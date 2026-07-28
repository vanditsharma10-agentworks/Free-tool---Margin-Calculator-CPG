#!/usr/bin/env python3
"""
Independent cross-check: does what the database serves actually match the sheet?

This deliberately re-reads the spreadsheet from scratch rather than trusting
anything extract_sheet.py produced, and compares field-by-field for every chain.
Exits non-zero on ANY mismatch.

Usage:  python3 scripts/verify_against_sheet.py <path-to-xlsx>
"""
import subprocess
import sys
import re

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl required:  pip3 install openpyxl")

HEADER_ROW, FIRST_DATA_ROW = 11, 12
CONTAINER = "margin_calc_db"


def psql(sql):
    out = subprocess.run(
        ["docker", "exec", CONTAINER, "psql", "-U", "calc", "-d", "margin_calculator",
         "-t", "-A", "-F", "\x1f", "-c", sql],
        capture_output=True, text=True,
    )
    if out.returncode != 0:
        sys.exit(f"psql failed: {out.stderr}")
    return [l.split("\x1f") for l in out.stdout.strip().split("\n") if l.strip()]


def band(v):
    """Independent re-implementation — deliberately not imported from the extractor."""
    if v in (None, "", " "):
        return (None, None)
    s = str(v).replace("%", "").strip()
    if not s or s.upper() == "N/A":
        return (None, None)
    if s.endswith("+"):
        n = re.findall(r"\d+\.?\d*", s)
        return (float(n[0]), None) if n else (None, None)
    n = re.findall(r"\d+\.?\d*", s)
    if len(n) >= 2:
        return (float(n[0]), float(n[1]))
    if len(n) == 1:
        return (float(n[0]), float(n[0]))
    return (None, None)


def norm_channel(c):
    return "E-Commerce" if str(c).strip().lower() == "e-commerce" else str(c).strip()


def num(s):
    if s in (None, "", "\\N"):
        return None
    try:
        return float(s)
    except ValueError:
        return None


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: verify_against_sheet.py <xlsx>")
    path = sys.argv[1]

    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Store List"]
    rows = list(ws.iter_rows(values_only=True))
    H = rows[HEADER_ROW]
    idx = {h: i for i, h in enumerate(H) if h}

    sheet = {}
    order = []
    for r in rows[FIRST_DATA_ROW:]:
        ch = r[idx["Channel"]]
        if ch in (None, "", " "):
            continue
        name = str(r[idx["Retailer (Parent)"]] or "").strip()
        st = r[idx["# stores"]]
        rec = {
            "name": name,
            "channel": norm_channel(ch),
            "stores": int(st) if isinstance(st, (int, float)) else None,
            "margin": band(r[idx["Retailer Margin (Dry Grocery)"]]),
            "markup": band(r[idx["Distributor Markup - estimate (Dry Grocery)"]]),
            "slotting_raw": (str(r[idx["Slotting"]]).strip()
                             if r[idx["Slotting"]] not in (None, "", " ") else None),
        }
        order.append(rec)
        sheet.setdefault(name, []).append(rec)

    print(f"sheet rows (chains): {len(order)}")

    db_rows = psql(
        "SELECT name, channel, stores, margin_low, margin_high, markup_low, markup_high, "
        "slotting_raw FROM retailers ORDER BY id;"
    )
    print(f"db rows (retailers): {len(db_rows)}")

    errors = []
    if len(db_rows) != len(order):
        errors.append(f"ROW COUNT: sheet has {len(order)}, db has {len(db_rows)}")

    # Rows were inserted in sheet order, so compare positionally — this also
    # catches any silent reordering or dropped row.
    for i, (s, d) in enumerate(zip(order, db_rows)):
        dname, dch, dstores, dml, dmh, dkl, dkh, dslot = (d + [None] * 8)[:8]
        where = f"row {i} ({s['name']!r})"

        if dname != s["name"]:
            errors.append(f"{where}: name mismatch db={dname!r}")
        if dch != s["channel"]:
            errors.append(f"{where}: channel sheet={s['channel']!r} db={dch!r}")

        ds = int(float(dstores)) if dstores not in (None, "", "\\N") else None
        if ds != s["stores"]:
            errors.append(f"{where}: stores sheet={s['stores']} db={ds}")

        if (num(dml), num(dmh)) != s["margin"]:
            errors.append(f"{where}: margin sheet={s['margin']} db={(num(dml), num(dmh))}")
        if (num(dkl), num(dkh)) != s["markup"]:
            errors.append(f"{where}: markup sheet={s['markup']} db={(num(dkl), num(dkh))}")

        dsl = dslot if dslot not in ("", "\\N") else None
        if dsl != s["slotting_raw"]:
            errors.append(f"{where}: slotting_raw sheet={s['slotting_raw']!r} db={dsl!r}")

    # Channel aggregates must be reproducible from the sheet.
    from statistics import median
    by_ch = {}
    for rec in order:
        lo, hi = rec["margin"]
        if lo is None:
            continue
        m = (lo + hi) / 2 if hi is not None else lo
        by_ch.setdefault(rec["channel"], []).append(m)

    for slug_name, med, n_ in [(r[0], num(r[1]), int(float(r[2]))) for r in
                               psql("SELECT name, retailer_margin_pct, sample_size FROM channels;")]:
        vals = by_ch.get(slug_name)
        if not vals:
            errors.append(f"channel {slug_name!r} in db but not derivable from sheet")
            continue
        expect = round(median(vals), 2)
        if abs(expect - med) > 0.011:
            errors.append(f"channel {slug_name}: median margin sheet={expect} db={med}")

    # Channel sample sizes count ALL chains in the channel, not just those with margins.
    counts = {}
    for rec in order:
        counts[rec["channel"]] = counts.get(rec["channel"], 0) + 1
    for name, _m, n_ in [(r[0], r[1], int(float(r[2]))) for r in
                         psql("SELECT name, retailer_margin_pct, sample_size FROM channels;")]:
        if counts.get(name) != n_:
            errors.append(f"channel {name}: sample_size sheet={counts.get(name)} db={n_}")

    print()
    if errors:
        print(f"❌ VERIFICATION FAILED — {len(errors)} mismatch(es):")
        for e in errors[:40]:
            print("   ", e)
        if len(errors) > 40:
            print(f"    ... and {len(errors) - 40} more")
        sys.exit(1)

    print("✅ VERIFIED — every chain's channel, store count, margin band, markup band")
    print("   and raw slotting text in the database matches the sheet exactly;")
    print("   channel medians and sample sizes reproduce from the sheet.")


if __name__ == "__main__":
    main()
