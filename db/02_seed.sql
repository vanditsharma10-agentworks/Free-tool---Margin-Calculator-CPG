-- Preset data DERIVED LIVE from the Startup CPG Retail Tracker (Store List, 219
-- chains) on 2026-07-28. Medians per channel/distributor. We store only the
-- band structure + typical ranges (industry knowledge the tracker corroborates),
-- never the per-retailer table. Source attributed to Startup CPG on the page.
-- Re-seed each quarterly tracker update.

-- Idempotent: clear before seeding so `docker compose up` re-seeds cleanly.
TRUNCATE channels, distributors, trade_defaults, margin_bands RESTART IDENTITY;

-- ── Channels (median distributor markup / retailer margin) ─────────────────
INSERT INTO channels (slug, name, has_distributor, distributor_markup_pct, retailer_margin_pct, sample_size, note, sort_order) VALUES
  ('conventional', 'Conventional Grocery', TRUE, 17.5, 27.5, 119, 'KeHE/UNFI duopoly; largest channel', 1),
  ('natural',      'Natural / Specialty',  TRUE, 12.5, 37.5, 60,  'Higher retailer margins; UNFI/KeHE', 2),
  ('c-store',      'C-Store',              TRUE, 20.0, 42.5, 10,  'DSD-heavy; high markups + margins', 3),
  ('club',         'Club / Warehouse',     FALSE, NULL, 12.5, 10,  'Thin margin, high volume', 4),
  ('e-commerce',   'E-Commerce',           TRUE, 12.5, 32.5, 6,   'Amazon/pure-play', 5),
  ('drug',         'Drug',                 TRUE, 17.5, 47.5, 3,   'Highest retailer margins; small sample', 6);

-- ── Distributors (median markup) ───────────────────────────────────────────
INSERT INTO distributors (slug, name, has_distributor, distributor_markup_pct, sample_size, note, sort_order) VALUES
  ('kehe',   'KeHE',   TRUE, 12.5, 46, 'Largest primary distributor in the tracker', 1),
  ('unfi',   'UNFI',   TRUE, 12.5, 34, 'Other half of the duopoly', 2),
  ('direct', 'Direct — straight to the store (no distributor)', FALSE, NULL, 22, 'Sell straight to the retailer', 3),
  ('dsd',    'DSD distributor (delivers to stores)', TRUE, 17.5, 8, 'Higher markup; C-store/beverage', 4);

-- ── Trade-cost seed defaults (true-margin layer) ───────────────────────────
INSERT INTO trade_defaults (key, label, amount, unit) VALUES
  ('slotting_lump_per_sku', 'Slotting (one-time, per SKU)', 5000.00, 'per SKU'),
  ('slotting_per_store',    'Slotting (per SKU, per store)', 100.00, 'per SKU / store'),
  ('ad_tpr_fee',            'Ad / TPR fee (typical, per SKU / yr)', 1250.00, 'per SKU / yr'),
  ('healthy_margin_pct',    'Healthy wholesale-margin bar', 25.00, '%');

-- ── Margin bands (from the Dropdowns sheet) ────────────────────────────────
INSERT INTO margin_bands (kind, label, low_pct, high_pct, sort_order) VALUES
  ('distributor', '5-10%',  5,  10, 1),
  ('distributor', '10-15%', 10, 15, 2),
  ('distributor', '15-20%', 15, 20, 3),
  ('distributor', '20-25%', 20, 25, 4),
  ('distributor', '25-30%', 25, 30, 5),
  ('distributor', '30-35%', 30, 35, 6),
  ('distributor', '35-40%', 35, 40, 7),
  ('distributor', '40%+',   40, NULL, 8),
  ('retailer', '10-15%', 10, 15, 1),
  ('retailer', '15-20%', 15, 20, 2),
  ('retailer', '20-25%', 20, 25, 3),
  ('retailer', '25-30%', 25, 30, 4),
  ('retailer', '30-35%', 30, 35, 5),
  ('retailer', '35-40%', 35, 40, 6),
  ('retailer', '40-45%', 40, 45, 7),
  ('retailer', '45-50%', 45, 50, 8),
  ('retailer', '50%+',   50, NULL, 9);
