-- CPG Margin Calculator — reference/preset schema.
-- Postgres auto-runs files in /docker-entrypoint-initdb.d in alpha order,
-- so 01_schema runs before 02_seed.

CREATE TABLE IF NOT EXISTS channels (
  id                      SERIAL PRIMARY KEY,
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  has_distributor         BOOLEAN NOT NULL DEFAULT TRUE,
  distributor_markup_pct  NUMERIC(5,2),          -- NULL for direct channels
  retailer_margin_pct     NUMERIC(5,2) NOT NULL,
  sample_size             INT,                   -- # chains behind the median
  note                    TEXT,
  sort_order              INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS distributors (
  id                      SERIAL PRIMARY KEY,
  slug                    TEXT UNIQUE NOT NULL,
  name                    TEXT NOT NULL,
  has_distributor         BOOLEAN NOT NULL DEFAULT TRUE,
  distributor_markup_pct  NUMERIC(5,2),
  sample_size             INT,
  note                    TEXT,
  sort_order              INT NOT NULL DEFAULT 0
);

-- Seed dollar defaults for the "true margin" (slotting + TPR) layer.
CREATE TABLE IF NOT EXISTS trade_defaults (
  id       SERIAL PRIMARY KEY,
  key      TEXT UNIQUE NOT NULL,
  label    TEXT NOT NULL,
  amount   NUMERIC(12,2) NOT NULL,
  unit     TEXT
);

-- The controlled margin bands (from the tracker's Dropdowns sheet) — used to
-- populate reference dropdowns / tooltips.
CREATE TABLE IF NOT EXISTS margin_bands (
  id          SERIAL PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('distributor','retailer')),
  label       TEXT NOT NULL,
  low_pct     NUMERIC(5,2),
  high_pct    NUMERIC(5,2),
  sort_order  INT NOT NULL DEFAULT 0
);
