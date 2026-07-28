/**
 * Preset types + a hardcoded FALLBACK mirror of the seed data.
 *
 * The DB is the source of truth (served via /api/presets), but the fallback
 * keeps the calculator fully usable if the DB is down or not yet up — the math
 * is client-side, so presets are the only thing the DB provides. The fallback
 * is derived from the same 2026-07-28 tracker analysis as db/02_seed.sql; keep
 * the two in sync when re-seeding.
 */

export interface ChannelPreset {
  slug: string;
  name: string;
  hasDistributor: boolean;
  distributorMarkupPct: number | null;
  retailerMarginPct: number;
  sampleSize: number | null;
  note?: string;
}

export interface DistributorPreset {
  slug: string;
  name: string;
  hasDistributor: boolean;
  distributorMarkupPct: number | null;
  sampleSize: number | null;
  note?: string;
}

export interface TradeDefaults {
  slottingLumpPerSku: number;
  slottingPerStore: number;
  adTprFee: number;
  healthyMarginPct: number;
}

export interface PresetPayload {
  channels: ChannelPreset[];
  distributors: DistributorPreset[];
  tradeDefaults: TradeDefaults;
  source: "db" | "fallback";
}

export const FALLBACK_CHANNELS: ChannelPreset[] = [
  { slug: "conventional", name: "Conventional Grocery", hasDistributor: true, distributorMarkupPct: 17.5, retailerMarginPct: 27.5, sampleSize: 119, note: "KeHE/UNFI duopoly; largest channel" },
  { slug: "natural", name: "Natural / Specialty", hasDistributor: true, distributorMarkupPct: 12.5, retailerMarginPct: 37.5, sampleSize: 60, note: "Higher retailer margins" },
  { slug: "c-store", name: "C-Store", hasDistributor: true, distributorMarkupPct: 20.0, retailerMarginPct: 42.5, sampleSize: 10, note: "DSD-heavy" },
  { slug: "club", name: "Club / Warehouse", hasDistributor: false, distributorMarkupPct: null, retailerMarginPct: 12.5, sampleSize: 10, note: "Thin margin, high volume" },
  { slug: "e-commerce", name: "E-Commerce", hasDistributor: true, distributorMarkupPct: 12.5, retailerMarginPct: 32.5, sampleSize: 6, note: "Amazon/pure-play" },
  { slug: "drug", name: "Drug", hasDistributor: true, distributorMarkupPct: 17.5, retailerMarginPct: 47.5, sampleSize: 3, note: "Highest retailer margins; small sample" },
];

export const FALLBACK_DISTRIBUTORS: DistributorPreset[] = [
  { slug: "kehe", name: "KeHE", hasDistributor: true, distributorMarkupPct: 12.5, sampleSize: 46 },
  { slug: "unfi", name: "UNFI", hasDistributor: true, distributorMarkupPct: 12.5, sampleSize: 34 },
  { slug: "direct", name: "Direct — straight to the store (no distributor)", hasDistributor: false, distributorMarkupPct: null, sampleSize: 22 },
  { slug: "dsd", name: "DSD distributor (delivers to stores)", hasDistributor: true, distributorMarkupPct: 17.5, sampleSize: 8 },
];

export const FALLBACK_TRADE_DEFAULTS: TradeDefaults = {
  slottingLumpPerSku: 5000,
  slottingPerStore: 100,
  adTprFee: 1250,
  healthyMarginPct: 25,
};

export const FALLBACK_PRESETS: PresetPayload = {
  channels: FALLBACK_CHANNELS,
  distributors: FALLBACK_DISTRIBUTORS,
  tradeDefaults: FALLBACK_TRADE_DEFAULTS,
  source: "fallback",
};
