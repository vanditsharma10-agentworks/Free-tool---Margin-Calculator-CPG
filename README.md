# CPG Retail Price & Margin Calculator

Work out what a product needs to sell for on the shelf — and what it costs to get
there — using real reported figures from **219 US retail chains**.

Pick your actual retailer (Sprouts, Fresh Thyme, Earth Fare…) and the calculator
fills in that chain's own reported margins, distributor markup, store count and
slotting terms. When a chain hasn't reported something, it falls back to the
channel average **and says so, every time**.

> Standalone **local-dev** service. Pushes only to
> `github.com/vanditsharma10-agentworks/Free-tool---Margin-Calculator-CPG`.
> Eventually merges into the main Agentworks site — **not yet**.

## ⚠️ Before this ever ships publicly

`db/03_retailers.sql` holds **named per-chain economics**. It is deliberately in
its own file so it is trivially separable. Publishing named retailers with their
margins and slotting fees is a republication question that must be settled first
(see ADR 0007 in the SEO repo). Local use is fine.

All figures are **community estimates** — reported by brands, not confirmed by
the retailers or distributors named. The UI states this.

## Run it

```bash
docker compose up          # Postgres + Next.js  → http://localhost:3100
```

DB in Docker, app on the host:

```bash
docker compose up db
npm install && npm run dev # → http://localhost:3000
```

## Correctness

Three independent layers, all of which must pass:

```bash
npm test                                   # 67 unit + integration tests
SHEET="/path/to/sheet.xlsx" npm run verify:sheet   # DB matches the sheet, field by field
npx tsc --noEmit                           # types
```

- **`scripts/verify_against_sheet.py`** re-reads the spreadsheet from scratch and
  diffs every chain's channel, store count, margin band, markup band and raw
  slotting text against the database. Exits non-zero on any mismatch.
- **`lib/sheet-integration.test.ts`** asserts the arithmetic against expectations
  worked out **by hand** from the sheet, so neither the data nor the maths can
  drift silently.
- Money is rounded half-up with a relative epsilon (plain `Math.round(n*100)`
  turns 3.225 into 3.22), intermediates stay at full precision, and waterfall
  segments are derived from rounded endpoints so they always sum to the shelf price.

## The slotting model

Real arrangements combine mechanisms, so entry cost is **additive** across three
independent components:

| Component | Cost |
|---|---|
| Free fill | `units/store × COGS × stores × SKUs` — product, not cash |
| Per-store fee | `$/store × stores × SKUs` |
| Lump sum | `$/SKU × SKUs` (does *not* scale with stores) |

**The one distinction that matters:** `"free fill, $60/SKU/store"` (comma) means
both apply and they're summed. `"free fill - $9k"` (dash), or any term that varies
by channel/distributor/category, means they're **competing alternatives** — shown
as a range, never added. Summing those would invent a cost nobody charges.

Percentage-of-invoice deals (e.g. `4.8% PPF OI`) are their own mechanic and are
never mistaken for free fill.

## Layout

| Path | What |
|---|---|
| `lib/calc.ts` | Price waterfall: margin↔markup, forward, reverse |
| `lib/entry.ts` | Shelf-entry cost model (free fill / per-store / lump / %) |
| `lib/resolve.ts` | Provenance — exact vs averaged — and peer lookup |
| `scripts/extract_sheet.py` | Parses the sheet → `db/02_channels.sql`, `db/03_retailers.sql` |
| `scripts/verify_against_sheet.py` | Independent DB-vs-sheet cross-check |
| `components/` | UI, built on the Agentworks design language |

Regenerate the seed data after a sheet update:

```bash
SHEET="/path/to/sheet.xlsx" npm run extract && docker compose down -v && docker compose up
```

## Design

Uses the Agentworks design language (Base UI + Tailwind 4 tokens, Montserrat /
IBM Plex Mono, `moss` = brand indigo `#5e50ee`). Light and dark are both
first-class. Components in `components/ui` are ported from
`dabbygabby/agentworks-design-language` — don't hand-roll replacements.
