-- CPG Margin Calculator — reference schema.
-- Postgres runs /docker-entrypoint-initdb.d/*.sql in alpha order:
--   01_schema -> 02_channels -> 03_retailers
-- Everything in 02/03 is GENERATED from the source sheet by
-- scripts/extract_sheet.py — never hand-edit those files.

-- ── Channel-level aggregates: the fallback used when a specific chain has no
--    reported figure. Every value here is an average/median across the chains
--    in that channel, which is why the app labels it "averaged".
CREATE TABLE IF NOT EXISTS channels (
  id                      SERIAL PRIMARY KEY,
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  has_distributor         BOOLEAN NOT NULL DEFAULT TRUE,
  distributor_markup_pct  NUMERIC(5,2),
  markup_low              NUMERIC(5,2),
  markup_high             NUMERIC(5,2),
  retailer_margin_pct     NUMERIC(5,2) NOT NULL,
  margin_low              NUMERIC(5,2),
  margin_high             NUMERIC(5,2),
  sample_size             INT,
  common_slotting_type    TEXT,
  sort_order              INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS distributors (
  id                      SERIAL PRIMARY KEY,
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  has_distributor         BOOLEAN NOT NULL DEFAULT TRUE,
  distributor_markup_pct  NUMERIC(5,2),
  markup_low              NUMERIC(5,2),
  markup_high             NUMERIC(5,2),
  sample_size             INT,
  sort_order              INT NOT NULL DEFAULT 0
);

-- ── Per-chain reference data.
--    !! LOCAL DEVELOPMENT ONLY — see db/03_retailers.sql before publishing !!
CREATE TABLE IF NOT EXISTS retailers (
  id                  SERIAL PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  name                TEXT NOT NULL,
  banner              TEXT,
  channel             TEXT NOT NULL,
  region              TEXT,
  state               TEXT,
  stores              INT,
  distributor         TEXT,        -- raw, may list several
  distributor_family  TEXT,        -- KeHE | UNFI | Direct | DSD | <name> | NULL
  stars               INT,         -- early-brand prioritisation, 1-5

  -- Reported bands. NULL means this chain has no reported figure, and the app
  -- must fall back to the channel average AND say that it did.
  markup_low          NUMERIC(5,2),
  markup_high         NUMERIC(5,2),
  margin_low          NUMERIC(5,2),
  margin_high         NUMERIC(5,2),

  -- Slotting. `slotting_raw` is always shown to the user verbatim.
  slotting_raw        TEXT,
  slotting_type       TEXT,        -- free_fill | per_store | lump | ... | unknown
  ff_cases_low        NUMERIC(6,2),
  ff_cases_high       NUMERIC(6,2),
  ff_units_low        NUMERIC(8,2),
  ff_units_high       NUMERIC(8,2),
  per_store_low       NUMERIC(10,2),
  per_store_high      NUMERIC(10,2),
  lump_low            NUMERIC(12,2),
  lump_high           NUMERIC(12,2),
  percent_of_invoice  NUMERIC(5,2),
  -- TRUE  = the components are competing options (varies by channel/
  --         distributor/category) and must be shown as a range, never summed.
  -- FALSE = the components genuinely stack and are summed.
  slotting_alternatives BOOLEAN NOT NULL DEFAULT FALSE,
  slotting_varies     BOOLEAN NOT NULL DEFAULT FALSE,
  adtpr_raw           TEXT
);

CREATE INDEX IF NOT EXISTS retailers_channel_idx ON retailers (channel);
CREATE INDEX IF NOT EXISTS retailers_name_idx ON retailers (lower(name));

-- ── Assumptions the app applies when the sheet doesn't specify a quantity.
--    Surfaced in the UI as stated defaults, never as facts.
CREATE TABLE IF NOT EXISTS trade_defaults (
  id       SERIAL PRIMARY KEY,
  key      TEXT UNIQUE NOT NULL,
  label    TEXT NOT NULL,
  amount   NUMERIC(12,2) NOT NULL,
  unit     TEXT
);

TRUNCATE trade_defaults RESTART IDENTITY;
INSERT INTO trade_defaults (key, label, amount, unit) VALUES
  ('free_fill_cases_default', 'Assumed free cases per store when unspecified', 2, 'cases'),
  ('units_per_case_default',  'Assumed units per case', 12, 'units'),
  ('healthy_margin_pct',      'Healthy wholesale-margin bar', 25, '%');
