/**
 * Provenance resolution — decides, for every figure the calculator shows,
 * whether it came from the chain's own reported data or from a channel average,
 * so the UI can always say which.
 *
 * The rule is simple and absolute: if the specific chain reported a figure we
 * use it and mark it `exact`; otherwise we fall back to the channel average and
 * mark it `averaged`. We never present an average as if it were the chain's own
 * number, and we never silently show nothing.
 */
import type { SlottingTerms, SlottingType } from "./entry";

export type Provenance = "exact" | "averaged" | "unknown";

export interface Retailer {
  slug: string;
  name: string;
  channel: string;
  region: string | null;
  stores: number | null;
  distributor: string | null;
  distributorFamily: string | null;
  stars: number | null;
  markupLow: number | null;
  markupHigh: number | null;
  marginLow: number | null;
  marginHigh: number | null;
  slottingRaw: string | null;
  slottingType: SlottingType;
  ffCasesLow: number | null;
  ffCasesHigh: number | null;
  ffUnitsLow: number | null;
  ffUnitsHigh: number | null;
  perStoreLow: number | null;
  perStoreHigh: number | null;
  lumpLow: number | null;
  lumpHigh: number | null;
  percentOfInvoice: number | null;
  slottingAlternatives: boolean;
  slottingVaries: boolean;
  adtprRaw: string | null;
}

export interface Channel {
  slug: string;
  name: string;
  hasDistributor: boolean;
  distributorMarkupPct: number | null;
  markupLow: number | null;
  markupHigh: number | null;
  retailerMarginPct: number;
  marginLow: number | null;
  marginHigh: number | null;
  sampleSize: number | null;
  commonSlottingType: SlottingType | null;
}

export interface ResolvedPct {
  value: number;
  low: number | null;
  high: number | null;
  provenance: Provenance;
  /** Plain-language explanation shown under the field. */
  note: string;
}

const midOf = (lo: number | null, hi: number | null, fallback: number) => {
  if (lo == null && hi == null) return fallback;
  if (lo == null) return hi!;
  if (hi == null) return lo;
  return (lo + hi) / 2;
};

/** The store's cut of the shelf price. */
export function resolveMargin(r: Retailer | null, ch: Channel | null): ResolvedPct | null {
  if (r && r.marginLow != null) {
    return {
      value: midOf(r.marginLow, r.marginHigh, r.marginLow),
      low: r.marginLow,
      high: r.marginHigh,
      provenance: "exact",
      note: `${r.name}'s own reported range.`,
    };
  }
  if (ch) {
    const who = r ? `${r.name} hasn't reported this` : "No specific store picked";
    return {
      value: ch.retailerMarginPct,
      low: ch.marginLow,
      high: ch.marginHigh,
      provenance: "averaged",
      note: `${who} — this is the typical figure across ${ch.sampleSize ?? "other"} ${ch.name.toLowerCase()} chains.`,
    };
  }
  return null;
}

/** What the distributor adds on top of your price. */
export function resolveMarkup(r: Retailer | null, ch: Channel | null): ResolvedPct | null {
  if (r && r.markupLow != null) {
    return {
      value: midOf(r.markupLow, r.markupHigh, r.markupLow),
      low: r.markupLow,
      high: r.markupHigh,
      provenance: "exact",
      note: `Reported for ${r.name}.`,
    };
  }
  if (ch && ch.distributorMarkupPct != null) {
    const who = r ? `${r.name} hasn't reported this` : "No specific store picked";
    return {
      value: ch.distributorMarkupPct,
      low: ch.markupLow,
      high: ch.markupHigh,
      provenance: "averaged",
      note: `${who} — typical across ${ch.sampleSize ?? "other"} ${ch.name.toLowerCase()} chains.`,
    };
  }
  return null;
}

export interface ResolvedSlotting {
  terms: SlottingTerms;
  provenance: Provenance;
  note: string;
  /** The chain's own words, shown verbatim when we have them. */
  raw: string | null;
}

export function resolveSlotting(r: Retailer | null, ch: Channel | null): ResolvedSlotting {
  if (r && r.slottingType && r.slottingType !== "unknown") {
    return {
      terms: {
        type: r.slottingType,
        raw: r.slottingRaw,
        ffCasesLow: r.ffCasesLow,
        ffCasesHigh: r.ffCasesHigh,
        ffUnitsLow: r.ffUnitsLow,
        ffUnitsHigh: r.ffUnitsHigh,
        perStoreLow: r.perStoreLow,
        perStoreHigh: r.perStoreHigh,
        lumpLow: r.lumpLow,
        lumpHigh: r.lumpHigh,
        percentOfInvoice: r.percentOfInvoice,
        alternatives: r.slottingAlternatives,
        varies: r.slottingVaries,
      },
      provenance: "exact",
      note: `${r.name}'s reported terms.`,
      raw: r.slottingRaw,
    };
  }
  // Fall back to whatever is most common in the channel — and say so.
  const common = ch?.commonSlottingType ?? null;
  if (common) {
    return {
      terms: { type: common, alternatives: false },
      provenance: "averaged",
      note: r
        ? `${r.name} hasn't reported its terms — showing the most common arrangement for ${ch!.name.toLowerCase()} chains.`
        : `Most common arrangement for ${ch!.name.toLowerCase()} chains.`,
      raw: null,
    };
  }
  return {
    terms: { type: "unknown" },
    provenance: "unknown",
    note: "No reported terms for this store, and too few similar chains to average. Enter your own.",
    raw: null,
  };
}

export interface Peer {
  name: string;
  stores: number | null;
  description: string;
}

/**
 * Named examples of what other chains in the same channel charge — the answer
 * to "who in a similar category charges what". Ordered by how well-known /
 * early-brand-friendly they are (stars), then size.
 */
export function slottingPeers(channel: string, all: Retailer[], exclude?: string, limit = 5): Peer[] {
  return all
    .filter(
      (x) =>
        x.channel === channel &&
        x.slug !== exclude &&
        x.slottingRaw != null &&
        x.slottingType !== "unknown"
    )
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || (b.stores ?? 0) - (a.stores ?? 0))
    .slice(0, limit)
    .map((x) => ({ name: x.name, stores: x.stores, description: x.slottingRaw! }));
}

/** Named examples of margins in the same channel. */
export function marginPeers(channel: string, all: Retailer[], exclude?: string, limit = 5): Peer[] {
  return all
    .filter((x) => x.channel === channel && x.slug !== exclude && x.marginLow != null)
    .sort((a, b) => (b.stars ?? 0) - (a.stars ?? 0) || (b.stores ?? 0) - (a.stores ?? 0))
    .slice(0, limit)
    .map((x) => ({
      name: x.name,
      stores: x.stores,
      description:
        x.marginHigh != null && x.marginHigh !== x.marginLow
          ? `${x.marginLow}–${x.marginHigh}%`
          : `${x.marginLow}%`,
    }));
}
