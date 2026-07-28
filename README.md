# CPG Retail Margin Calculator — Free tool (Agentworks)

A **channel-aware CPG cost-to-shelf margin calculator** — not a generic margin box.
It models the real multi-layer chain (`COGS → wholesale → distributor markup →
retailer margin → shelf price`) and pre-fills **real by-channel presets** derived from
the Startup CPG Retail Tracker (219 chains).

> Standalone **local-dev** service for now. Pushes only to
> `github.com/vanditsharma10-agentworks/Free-tool---Margin-Calculator-CPG`.
> Eventually merges into the main Agentworks site (`v2.1-dev`) — **not yet**.

This repo currently contains **work #2: the calculator engine**. Work #1 (page
copy + design-system styling from the design repo) is separate and not done here.

## Stack
- **Next.js** (App Router, TypeScript) — single page
- **Postgres** (Docker) — holds the preset/reference dataset, served via `/api/presets`
- The calculator **math runs client-side** (`lib/calc.ts`); the DB only supplies presets

## Run it

Everything in Docker (Postgres auto-seeds on first boot):
```bash
docker compose up
# → http://localhost:3100   (host 3100 avoids clashing with the main site on 3000)
```

Just the DB in Docker, Next.js on the host:
```bash
docker compose up db
cp .env.example .env   # already present
npm install
npm run dev            # → http://localhost:3000 (or the next free port)
```

## Test the engine
```bash
npm test
```

## What's where
| Path | What |
|---|---|
| `lib/calc.ts` | Pure engine: margin↔markup, forward/reverse waterfall, true-margin |
| `lib/calc.test.ts` | Unit + edge-case tests (regression assertions) |
| `lib/presets.ts` | Preset types + hardcoded fallback (used if DB is down) |
| `db/01_schema.sql`, `db/02_seed.sql` | Reference schema + tracker-derived seed |
| `app/api/presets/route.ts` | Serves presets from Postgres (fallback on failure) |
| `app/page.tsx`, `components/` | Single-page UI (functional styling; design polish = work #1) |

## Preset data
Derived live from the tracker's Store List on 2026-07-28. Medians per channel:
Conventional 17.5/27.5 · Natural 12.5/37.5 · C-Store 20/42.5 · Club (direct) —/12.5 ·
E-Commerce 12.5/32.5 · Drug 17.5/47.5 (distributor markup / retailer margin %).
**Re-seed each quarterly tracker update** (`docker compose down -v && docker compose up`).
We store only the band structure + typical ranges and **attribute Startup CPG** — never
their per-retailer table.
