#!/usr/bin/env python3
"""
Extract the retail chain reference data from the source spreadsheet and emit
seed SQL.

DESIGN NOTE — the slotting cost model is ADDITIVE, because real arrangements
genuinely combine mechanisms (e.g. "free fill, $60/SKU/store" = you give free
product AND pay a per-store fee). Three independent components, any of which
may be absent:

    free fill   : units given per store, per SKU   -> costs COGS, not cash
    per-store   : $ per store, per SKU             -> cash
    lump        : $ per SKU (one-time)             -> cash

    entry cost = (freeFillUnits * COGS + perStoreFee) * stores * SKUs
               + lumpSum * SKUs

Ranges ("$5k-15k") are kept as low/high; the midpoint is the default and the
range is shown to the user. Anything the parser cannot classify is marked
UNKNOWN rather than guessed — the tool then says so and falls back to the
channel average.

Usage:  python3 scripts/extract_sheet.py <path-to-xlsx> [--sql out.sql]
"""
import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from statistics import median

try:
    import openpyxl
except ImportError:
    sys.exit("openpyxl required:  pip3 install openpyxl")

HEADER_ROW = 11  # 0-indexed row holding the column names
FIRST_DATA_ROW = 12

COLS = {
    "channel": "Channel",
    "parent": "Retailer (Parent)",
    "banner": "Banner",
    "hq_city": "HQ City",
    "hq_state": "HQ State",
    "region": "HQ Region",
    "stores": "# stores",
    "website": "Website",
    "review": "Calendar Review or Open?",
    "distributor": "Primary Distributor",
    "anchor_dc": "Can Anchor DC",
    "stars": "Early Brand Prioritization",
    "markup": "Distributor Markup - estimate (Dry Grocery)",
    "margin": "Retailer Margin (Dry Grocery)",
    "slotting": "Slotting",
    "adtpr": "Ad/TPR Fee",
    "programs": "Available Programs",
}


# ── helpers ────────────────────────────────────────────────────────────────

def money(tok: str):
    """'$5k'->5000, '$5.2k'->5200, '1500'->1500, '20K'->20000, '.65'->0.65"""
    if tok is None:
        return None
    t = tok.strip().lower().replace("$", "").replace(",", "").strip()
    if not t:
        return None
    mult = 1.0
    if t.endswith("k"):
        mult = 1000.0
        t = t[:-1]
    try:
        return round(float(t) * mult, 2)
    except ValueError:
        return None


def parse_band(v):
    """'10-15%' -> (10.0, 15.0);  '40%+' -> (40.0, None);  'N/A'/blank -> None."""
    if v in (None, "", " "):
        return None
    s = str(v).replace("%", "").strip()
    if not s or s.upper() == "N/A":
        return None
    if s.endswith("+"):
        lo = money(s[:-1])
        return (lo, None) if lo is not None else None
    nums = re.findall(r"\d+\.?\d*", s)
    if len(nums) >= 2:
        return (float(nums[0]), float(nums[1]))
    if len(nums) == 1:
        return (float(nums[0]), float(nums[0]))
    return None


def band_mid(band):
    if band is None:
        return None
    lo, hi = band
    if lo is None:
        return None
    return round((lo + hi) / 2, 2) if hi is not None else lo


# ── the slotting parser ────────────────────────────────────────────────────

# "$100/sku / store", "$50/store", "$75-150/SKU/store", "$31/SKU/store"
RE_PER_STORE = re.compile(
    r"\$\s*([\d.,]+\s*k?)\s*(?:-\s*\$?\s*([\d.,]+\s*k?))?\s*/\s*(?:sku\s*/?\s*)?/?\s*store",
    re.I,
)
# "2-3cs free fill", "1.5-2cs", "2cs free fill", "3cs free fill"
RE_CASES = re.compile(r"([\d.]+)\s*(?:-\s*([\d.]+))?\s*cs\b", re.I)
# "12 free units", "3 units per SKU per store"
RE_UNITS = re.compile(r"\b([\d.]+)\s*(?:free\s+)?units?\b", re.I)
# "1-2 free fill"  (cases implied, no 'cs' token)
RE_BARE_CASES = re.compile(r"\b([\d.]+)\s*(?:-\s*([\d.]+))?\s+free\s+fill", re.I)
# any remaining money token, optionally "/sku"
RE_LUMP = re.compile(r"\$\s*([\d.,]+\s*k?)\s*(?:-\s*\$?\s*([\d.,]+\s*k?))?", re.I)

NONE_TOKENS = ("none", "no slotting", "free")  # 'free' alone = no fee charged

# A percentage-of-invoice arrangement (e.g. "4.8% PPF OI") is a different
# mechanic entirely — it is NOT a free-fill deal even when the text mentions
# free fill as something the percentage covers.
RE_PERCENT_DEAL = re.compile(r"([\d.]+)\s*%\s*(?:ppf|oi|off invoice)", re.I)

# "free fill - $9k", "negotiable, free fill - $6k", "$100/store (direct), ... (KeHE)"
# A DASH between a free-fill option and a cash figure means EITHER/OR (a range
# from best case to worst case), not both. A COMMA or PLUS means both apply.
RE_FF_DASH_CASH = re.compile(r"free\s+fill[^,+]*?[-–]\s*\$", re.I)
RE_CASH_DASH_FF = re.compile(r"\$[^,+]*?[-–]\s*(?:[\d.]+\s*cs\s*)?free\s+fill", re.I)


def parse_slotting(raw):
    """
    -> dict(type, free_fill_units_low/high, per_store_low/high,
            lump_low/high, has_variants, alternatives, unparsed, raw)

    The cost model SUMS whichever components are present — except when
    `alternatives` is true, in which case the components are competing options
    (varies by channel/distributor/category) and must be presented as a range
    for the user to choose from, never added together.
    """
    out = {
        "raw": None,
        "type": "unknown",
        "free_fill_units_low": None, "free_fill_units_high": None,
        "free_fill_cases_low": None, "free_fill_cases_high": None,
        "per_store_low": None, "per_store_high": None,
        "lump_low": None, "lump_high": None,
        "percent_of_invoice": None,
        "has_variants": False,
        "alternatives": False,
        "unparsed": False,
    }
    if raw in (None, "", " "):
        return out
    text = str(raw).strip()
    out["raw"] = text
    low = text.lower()

    # Explicitly unknown — do NOT treat as zero.
    if low in ("n/a", "na", "tbd"):
        return out

    # Varies by channel / distributor / category / negotiable.
    if re.search(r"\(natural\)|\(conventional\)|\(kehe\)|\(direct\)|\(unfi\)|\(bozzutos\)|varies|negotiable|ambient|refrigerated|frozen|some flexibility", low):
        out["has_variants"] = True

    # Percentage-of-invoice deals are their own mechanic — bail out before the
    # free-fill branch so we never invent a free-fill cost that isn't charged.
    pct = RE_PERCENT_DEAL.search(low)
    if pct:
        out["percent_of_invoice"] = float(pct.group(1))
        out["type"] = "percent_of_invoice"
        return out

    # Components are competing alternatives, not additive, when the text
    # separates them with a dash or when the deal varies by channel/distributor.
    if RE_FF_DASH_CASH.search(low) or RE_CASH_DASH_FF.search(low) or out["has_variants"]:
        out["alternatives"] = True

    work = low

    # 1) per-store fees (must run before lump so "/sku/store" isn't read as lump)
    ps = RE_PER_STORE.findall(work)
    if ps:
        lows = [money(a) for a, _ in ps if money(a) is not None]
        highs = [money(b) if b else money(a) for a, b in ps]
        highs = [h for h in highs if h is not None]
        if lows:
            out["per_store_low"] = min(lows)
            out["per_store_high"] = max(highs) if highs else min(lows)
        work = RE_PER_STORE.sub(" ", work)

    # 2) free fill
    has_ff = "free fill" in low or "free units" in low or re.search(r"\bunits?\s+per\s+sku", low) is not None
    if has_ff:
        cases = RE_CASES.findall(work) or RE_BARE_CASES.findall(work)
        units = RE_UNITS.findall(work)
        if cases:
            a, b = cases[0]
            out["free_fill_cases_low"] = float(a)
            out["free_fill_cases_high"] = float(b) if b else float(a)
            work = RE_CASES.sub(" ", work)
        elif units:
            u = float(units[0])
            out["free_fill_units_low"] = u
            out["free_fill_units_high"] = u
            work = RE_UNITS.sub(" ", work)
        # bare "free fill" with no quantity -> quantity unknown; the app applies
        # a stated default (and says so).
        work = work.replace("free fill", " ")

    # 3) whatever money remains is a lump (per SKU)
    lumps = RE_LUMP.findall(work)
    if lumps:
        lows, highs = [], []
        for a, b in lumps:
            la, hb = money(a), money(b) if b else None
            if la is None:
                continue
            lows.append(la)
            highs.append(hb if hb is not None else la)
        if lows:
            out["lump_low"] = min(lows)
            out["lump_high"] = max(highs) if highs else min(lows)

    # 4) classify + handle the pure-none case
    has_cash = out["per_store_low"] is not None or out["lump_low"] is not None
    if not has_cash and not has_ff:
        if any(t in low for t in NONE_TOKENS):
            out["type"] = "none"
        else:
            out["unparsed"] = True   # something real we failed to read
        return out

    if has_ff and has_cash:
        out["type"] = "free_fill_plus_fee"
    elif has_ff:
        out["type"] = "free_fill"
    elif out["per_store_low"] is not None and out["lump_low"] is not None:
        out["type"] = "per_store_plus_lump"
    elif out["per_store_low"] is not None:
        out["type"] = "per_store"
    else:
        out["type"] = "lump"
    return out


# ── extraction ─────────────────────────────────────────────────────────────

def slug(s):
    s = re.sub(r"[^a-z0-9]+", "-", str(s).lower()).strip("-")
    return s or "x"


def stars(v):
    return str(v).count("⭐") if v else None


def load(path):
    wb = openpyxl.load_workbook(path, data_only=True)
    ws = wb["Store List"]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[HEADER_ROW]
    idx = {h: i for i, h in enumerate(header) if h}
    for key, name in COLS.items():
        if name not in idx:
            sys.exit(f"FATAL: expected column missing from sheet: {name!r}")

    def cell(r, key):
        v = r[idx[COLS[key]]]
        return None if v in ("", " ") else v

    out = []
    for r in rows[FIRST_DATA_ROW:]:
        if r[idx[COLS['channel']]] in (None, "", " "):
            continue
        ch = str(cell(r, "channel")).strip()
        # The sheet has both 'E-commerce' and 'E-Commerce'.
        ch_norm = "E-Commerce" if ch.lower() == "e-commerce" else ch
        st = cell(r, "stores")
        rec = {
            "channel": ch_norm,
            "parent": str(cell(r, "parent") or "").strip(),
            "banner": str(cell(r, "banner") or "").strip(),
            "region": str(cell(r, "region") or "").strip(),
            "state": str(cell(r, "hq_state") or "").strip(),
            "stores": int(st) if isinstance(st, (int, float)) else None,
            "distributor": str(cell(r, "distributor") or "").strip(),
            "stars": stars(cell(r, "stars")),
            "markup_band": parse_band(cell(r, "markup")),
            "margin_band": parse_band(cell(r, "margin")),
            "slotting": parse_slotting(cell(r, "slotting")),
            "adtpr": str(cell(r, "adtpr") or "").strip() or None,
        }
        out.append(rec)
    return out


def primary_distributor(s):
    """First named distributor; normalised to a family (KeHE / UNFI / Direct / DSD / other)."""
    if not s:
        return None
    first = s.split(",")[0].strip()
    fl = first.lower()
    if fl.startswith("kehe"):
        return "KeHE"
    if fl.startswith("unfi"):
        return "UNFI"
    if fl.startswith("direct"):
        return "Direct"
    if fl.startswith("dsd"):
        return "DSD"
    if fl in ("tbd", "other", "n/a"):
        return None
    return first


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("xlsx")
    ap.add_argument("--sql")
    ap.add_argument("--json")
    ap.add_argument("--audit", action="store_true", help="print every distinct slotting parse")
    args = ap.parse_args()

    recs = load(args.xlsx)
    print(f"chains parsed: {len(recs)}")

    # ---- parser audit: every distinct raw value and how it was read ----
    if args.audit:
        seen = {}
        for r in recs:
            s = r["slotting"]
            if s["raw"] and s["raw"] not in seen:
                seen[s["raw"]] = s
        print(f"\n=== SLOTTING PARSE AUDIT ({len(seen)} distinct) ===")
        for raw, s in sorted(seen.items()):
            bits = []
            if s["free_fill_cases_low"] is not None:
                bits.append(f"ff_cases={s['free_fill_cases_low']}-{s['free_fill_cases_high']}")
            if s["free_fill_units_low"] is not None:
                bits.append(f"ff_units={s['free_fill_units_low']}")
            if s["type"] in ("free_fill", "free_fill_plus_fee") and s["free_fill_cases_low"] is None and s["free_fill_units_low"] is None:
                bits.append("ff_qty=UNSPECIFIED")
            if s["per_store_low"] is not None:
                bits.append(f"per_store=${s['per_store_low']}-{s['per_store_high']}")
            if s["lump_low"] is not None:
                bits.append(f"lump=${s['lump_low']}-{s['lump_high']}")
            if s["percent_of_invoice"] is not None:
                bits.append(f"pct_of_invoice={s['percent_of_invoice']}%")
            if s["alternatives"]:
                bits.append("EITHER/OR")
            if s["has_variants"]:
                bits.append("VARIES")
            flag = "  <<< UNPARSED" if s["unparsed"] else ""
            print(f"  [{s['type']:20s}] {raw[:62]:64s} {' '.join(bits)}{flag}")

    bad = [r for r in recs if r["slotting"]["unparsed"]]
    print(f"\nunparsed slotting values: {len(bad)}")
    for r in bad:
        print(f"   ! {r['parent']}: {r['slotting']['raw']!r}")

    # ---- channel aggregates (the 'averaged' fallback) ----
    by_ch = defaultdict(lambda: {"margin": [], "markup": [], "slot_types": Counter(), "n": 0})
    for r in recs:
        c = by_ch[r["channel"]]
        c["n"] += 1
        mm = band_mid(r["margin_band"])
        if mm is not None:
            c["margin"].append(mm)
        mk = band_mid(r["markup_band"])
        if mk is not None:
            c["markup"].append(mk)
        st = r["slotting"]["type"]
        if st != "unknown":
            c["slot_types"][st] += 1

    print("\n=== CHANNEL AGGREGATES (the fallback when a chain has no data) ===")
    for ch, c in sorted(by_ch.items(), key=lambda kv: -kv[1]["n"]):
        mm = f"{min(c['margin']):.0f}-{max(c['margin']):.0f}" if c["margin"] else "--"
        common = c["slot_types"].most_common(1)[0][0] if c["slot_types"] else "--"
        print(f"  {ch:14s} n={c['n']:3d} marginMed={median(c['margin']) if c['margin'] else None} range={mm} commonSlot={common}")

    if args.json:
        with open(args.json, "w") as f:
            json.dump(recs, f, indent=1, default=str)
        print(f"\nwrote {args.json}")

    if args.sql:
        write_channels_sql(recs, by_ch, "db/02_channels.sql")
        print("wrote db/02_channels.sql")
        write_sql(recs, by_ch, args.sql)
        print(f"wrote {args.sql}")


def q(s):
    if s is None:
        return "NULL"
    return "'" + str(s).replace("'", "''") + "'"


def n(v):
    return "NULL" if v is None else str(v)


def write_channels_sql(recs, by_ch, path):
    """Channel + distributor aggregates — the 'averaged' fallback layer."""
    # Channels with no distributor layer at all.
    DIRECT_CHANNELS = {"Club"}
    lines = [
        "-- GENERATED by scripts/extract_sheet.py — do not hand-edit.",
        "-- Channel-level averages across the chains in each channel. These are the",
        "-- figures the app labels 'averaged' when a specific chain has no report.",
        "TRUNCATE channels, distributors RESTART IDENTITY;",
        "",
    ]
    order = sorted(by_ch.items(), key=lambda kv: -kv[1]["n"])
    for i, (ch, c) in enumerate(order, 1):
        margins, markups = c["margin"], c["markup"]
        if not margins:
            continue
        has_dist = ch not in DIRECT_CHANNELS and bool(markups)
        common = c["slot_types"].most_common(1)[0][0] if c["slot_types"] else None
        lines.append(
            "INSERT INTO channels (slug, name, has_distributor, distributor_markup_pct, "
            "markup_low, markup_high, retailer_margin_pct, margin_low, margin_high, "
            "sample_size, common_slotting_type, sort_order) VALUES ("
            f"{q(slug(ch))}, {q(ch)}, {'TRUE' if has_dist else 'FALSE'}, "
            f"{n(round(median(markups), 2) if (markups and has_dist) else None)}, "
            f"{n(min(markups) if (markups and has_dist) else None)}, {n(max(markups) if (markups and has_dist) else None)}, "
            f"{round(median(margins), 2)}, {min(margins)}, {max(margins)}, "
            f"{c['n']}, {q(common)}, {i});"
        )

    # Distributor families, aggregated from the chains that use each.
    by_d = defaultdict(list)
    for r in recs:
        fam = primary_distributor(r["distributor"])
        mk = band_mid(r["markup_band"])
        if fam:
            by_d[fam].append(mk)
    FAMILIES = ["KeHE", "UNFI", "Direct", "DSD"]
    lines.append("")
    for i, fam in enumerate(FAMILIES, 1):
        vals = [v for v in by_d.get(fam, []) if v is not None]
        is_direct = fam == "Direct"
        label = {
            "KeHE": "KeHE", "UNFI": "UNFI",
            "Direct": "Direct — straight to the store (no distributor)",
            "DSD": "DSD distributor (delivers to stores)",
        }[fam]
        lines.append(
            "INSERT INTO distributors (slug, name, has_distributor, distributor_markup_pct, "
            "markup_low, markup_high, sample_size, sort_order) VALUES ("
            f"{q(fam.lower())}, {q(label)}, {'FALSE' if is_direct else 'TRUE'}, "
            f"{n(round(median(vals), 2) if (vals and not is_direct) else None)}, "
            f"{n(min(vals) if (vals and not is_direct) else None)}, {n(max(vals) if (vals and not is_direct) else None)}, "
            f"{len(by_d.get(fam, []))}, {i});"
        )
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


def write_sql(recs, by_ch, path):
    lines = [
        "-- GENERATED by scripts/extract_sheet.py — do not hand-edit.",
        "-- =====================================================================",
        "-- !! LOCAL DEVELOPMENT ONLY — DO NOT PUBLISH !!",
        "-- Per-chain named retailer economics. Community estimates, not validated",
        "-- by the retailers or distributors named. Kept in its own file so it is",
        "-- trivially separable before anything ships publicly.",
        "-- =====================================================================",
        "TRUNCATE retailers RESTART IDENTITY;",
        "",
    ]
    seen = set()
    for r in recs:
        s = r["slotting"]
        base = slug(r["parent"] or r["banner"])
        sl = base
        i = 2
        while sl in seen:
            sl = f"{base}-{i}"
            i += 1
        seen.add(sl)
        mb, kb = r["margin_band"], r["markup_band"]
        lines.append(
            "INSERT INTO retailers (slug, name, banner, channel, region, state, stores, "
            "distributor, distributor_family, stars, markup_low, markup_high, margin_low, margin_high, "
            "slotting_raw, slotting_type, ff_cases_low, ff_cases_high, ff_units_low, ff_units_high, "
            "per_store_low, per_store_high, lump_low, lump_high, percent_of_invoice, "
            "slotting_alternatives, slotting_varies, adtpr_raw) VALUES ("
            f"{q(sl)}, {q(r['parent'])}, {q(r['banner'])}, {q(r['channel'])}, {q(r['region'])}, "
            f"{q(r['state'])}, {n(r['stores'])}, {q(r['distributor'])}, {q(primary_distributor(r['distributor']))}, "
            f"{n(r['stars'])}, {n(kb[0] if kb else None)}, {n(kb[1] if kb else None)}, "
            f"{n(mb[0] if mb else None)}, {n(mb[1] if mb else None)}, "
            f"{q(s['raw'])}, {q(s['type'])}, {n(s['free_fill_cases_low'])}, {n(s['free_fill_cases_high'])}, "
            f"{n(s['free_fill_units_low'])}, {n(s['free_fill_units_high'])}, "
            f"{n(s['per_store_low'])}, {n(s['per_store_high'])}, {n(s['lump_low'])}, {n(s['lump_high'])}, "
            f"{n(s['percent_of_invoice'])}, "
            f"{'TRUE' if s['alternatives'] else 'FALSE'}, {'TRUE' if s['has_variants'] else 'FALSE'}, {q(r['adtpr'])});"
        )
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    main()
