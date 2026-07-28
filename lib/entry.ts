/**
 * Shelf-entry cost model — what it costs to get a product onto the shelf,
 * separate from the per-unit price waterfall in `calc.ts`.
 *
 * THREE INDEPENDENT COMPONENTS (any may be absent):
 *
 *   free fill  — you give product, not cash.
 *                cost = unitsPerStore * COGS * stores * SKUs
 *   per-store  — a cash fee per store, per SKU.
 *                cost = feePerStore * stores * SKUs
 *   lump       — a one-time cash fee per SKU.
 *                cost = lumpPerSku * SKUs
 *
 * ADDITIVE vs ALTERNATIVES — this distinction is load-bearing:
 *   The source text "free fill, $60/SKU/store" (comma) means BOTH apply, so the
 *   components are summed. But "free fill - $9k" (dash) and anything that varies
 *   by channel/distributor/category means the components are COMPETING OPTIONS.
 *   Summing those would invent a cost nobody charges, so when
 *   `alternatives` is true we return a RANGE (cheapest option → dearest option)
 *   instead of a total.
 */

export type SlottingType =
  | "free_fill"
  | "per_store"
  | "lump"
  | "free_fill_plus_fee"
  | "per_store_plus_lump"
  | "percent_of_invoice"
  | "none"
  | "unknown";

export interface SlottingTerms {
  type: SlottingType;
  /** Raw text from the source, always shown to the user verbatim. */
  raw?: string | null;
  ffCasesLow?: number | null;
  ffCasesHigh?: number | null;
  ffUnitsLow?: number | null;
  ffUnitsHigh?: number | null;
  perStoreLow?: number | null;
  perStoreHigh?: number | null;
  lumpLow?: number | null;
  lumpHigh?: number | null;
  percentOfInvoice?: number | null;
  /** Components compete rather than stack — present as a range, never a sum. */
  alternatives?: boolean;
  varies?: boolean;
}

export interface EntryCostInput {
  terms: SlottingTerms;
  cogs: number;
  stores: number;
  skus: number;
  /** Applied when the source says "free fill" without naming a quantity. */
  assumedFreeCases: number;
  unitsPerCase: number;
  /** Wholesale price — only needed for percent-of-invoice deals. */
  wholesale?: number;
  /** Annual units — only needed for percent-of-invoice deals. */
  annualUnits?: number;
}

export interface EntryCostLine {
  key: "free_fill" | "per_store" | "lump" | "percent";
  label: string;
  /** True when this is product given away rather than cash paid. */
  inProduct: boolean;
  low: number;
  high: number;
  detail: string;
  /** The quantity was assumed because the source didn't state one. */
  assumed?: boolean;
}

export interface EntryCostResult {
  lines: EntryCostLine[];
  /** Sum of the midpoints — the headline number. Null when unknown. */
  total: number | null;
  totalLow: number | null;
  totalHigh: number | null;
  cashTotal: number;
  productTotal: number;
  /** Components are options, so the total is a range across them, not a sum. */
  isRange: boolean;
  /** No usable terms — the caller must fall back and say so. */
  unknown: boolean;
  note?: string;
}

const r2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Midpoint of a low/high pair; falls back to whichever side exists. */
function mid(low?: number | null, high?: number | null): number | null {
  if (low == null && high == null) return null;
  if (low == null) return high!;
  if (high == null) return low;
  return (low + high) / 2;
}

/**
 * Units of free product given per store, per SKU.
 * Cases take precedence over an explicit unit count; if neither is stated we
 * apply the assumed default and flag it.
 */
export function freeFillUnitsPerStore(
  terms: SlottingTerms,
  assumedFreeCases: number,
  unitsPerCase: number
): { low: number; high: number; assumed: boolean } {
  const casesMid = mid(terms.ffCasesLow, terms.ffCasesHigh);
  if (casesMid != null) {
    const lo = (terms.ffCasesLow ?? casesMid) * unitsPerCase;
    const hi = (terms.ffCasesHigh ?? casesMid) * unitsPerCase;
    return { low: lo, high: hi, assumed: false };
  }
  const unitsMid = mid(terms.ffUnitsLow, terms.ffUnitsHigh);
  if (unitsMid != null) {
    return { low: terms.ffUnitsLow ?? unitsMid, high: terms.ffUnitsHigh ?? unitsMid, assumed: false };
  }
  const u = assumedFreeCases * unitsPerCase;
  return { low: u, high: u, assumed: true };
}

const hasFreeFill = (t: SlottingType) => t === "free_fill" || t === "free_fill_plus_fee";

export function entryCost(input: EntryCostInput): EntryCostResult {
  const { terms, cogs, stores, skus, assumedFreeCases, unitsPerCase } = input;

  const empty: EntryCostResult = {
    lines: [], total: null, totalLow: null, totalHigh: null,
    cashTotal: 0, productTotal: 0, isRange: false, unknown: true,
  };

  if (terms.type === "unknown") return empty;

  if (terms.type === "none") {
    return {
      lines: [], total: 0, totalLow: 0, totalHigh: 0,
      cashTotal: 0, productTotal: 0, isRange: false, unknown: false,
      note: "This retailer doesn't charge to get on shelf.",
    };
  }

  // Guard: negative or non-finite inputs would silently produce nonsense.
  const n = (v: number) => (Number.isFinite(v) && v > 0 ? v : 0);
  const storeCount = n(stores);
  const skuCount = n(skus);
  const unitCost = Number.isFinite(cogs) && cogs > 0 ? cogs : 0;

  // Percent-of-invoice is its own mechanic: a % of what you sell them, not a
  // fee per store or SKU.
  if (terms.type === "percent_of_invoice") {
    const pct = terms.percentOfInvoice ?? 0;
    const revenue = (input.wholesale ?? 0) * (input.annualUnits ?? 0);
    if (revenue <= 0) {
      return {
        ...empty, unknown: false, total: null,
        note: `This retailer takes ${pct}% off invoice instead of a slotting fee. Add your expected annual volume to see what that costs.`,
      };
    }
    const amt = r2((pct / 100) * revenue);
    return {
      lines: [{
        key: "percent", label: `${pct}% off invoice`, inProduct: false,
        low: amt, high: amt,
        detail: `${pct}% of $${r2(revenue).toLocaleString()} expected annual sales`,
      }],
      total: amt, totalLow: amt, totalHigh: amt,
      cashTotal: amt, productTotal: 0, isRange: false, unknown: false,
    };
  }

  const lines: EntryCostLine[] = [];

  if (hasFreeFill(terms.type)) {
    const ff = freeFillUnitsPerStore(terms, assumedFreeCases, unitsPerCase);
    const low = r2(ff.low * unitCost * storeCount * skuCount);
    const high = r2(ff.high * unitCost * storeCount * skuCount);
    const qty = ff.low === ff.high ? `${ff.low}` : `${ff.low}–${ff.high}`;
    lines.push({
      key: "free_fill",
      label: "Free fill (product, not cash)",
      inProduct: true,
      low, high,
      detail: `${qty} units per store × $${unitCost.toFixed(2)} cost × ${storeCount} stores${skuCount > 1 ? ` × ${skuCount} SKUs` : ""}`,
      assumed: ff.assumed,
    });
  }

  const psMid = mid(terms.perStoreLow, terms.perStoreHigh);
  if (psMid != null) {
    const lo = r2((terms.perStoreLow ?? psMid) * storeCount * skuCount);
    const hi = r2((terms.perStoreHigh ?? psMid) * storeCount * skuCount);
    const rate =
      terms.perStoreLow === terms.perStoreHigh || terms.perStoreHigh == null
        ? `$${terms.perStoreLow}`
        : `$${terms.perStoreLow}–$${terms.perStoreHigh}`;
    lines.push({
      key: "per_store",
      label: "Per-store fee",
      inProduct: false,
      low: lo, high: hi,
      detail: `${rate} per store${skuCount > 1 ? " per SKU" : ""} × ${storeCount} stores${skuCount > 1 ? ` × ${skuCount} SKUs` : ""}`,
    });
  }

  const lumpMid = mid(terms.lumpLow, terms.lumpHigh);
  if (lumpMid != null) {
    const lo = r2((terms.lumpLow ?? lumpMid) * skuCount);
    const hi = r2((terms.lumpHigh ?? lumpMid) * skuCount);
    const rate =
      terms.lumpLow === terms.lumpHigh || terms.lumpHigh == null
        ? `$${(terms.lumpLow ?? 0).toLocaleString()}`
        : `$${(terms.lumpLow ?? 0).toLocaleString()}–$${(terms.lumpHigh ?? 0).toLocaleString()}`;
    lines.push({
      key: "lump",
      label: "One-time slotting fee",
      inProduct: false,
      low: lo, high: hi,
      detail: `${rate} per SKU${skuCount > 1 ? ` × ${skuCount} SKUs` : ""}`,
    });
  }

  if (lines.length === 0) return empty;

  // ALTERNATIVES: the components are competing options, so the answer spans
  // from the cheapest option to the dearest — summing them would be wrong.
  if (terms.alternatives) {
    const lows = lines.map((l) => l.low);
    const highs = lines.map((l) => l.high);
    const lo = Math.min(...lows);
    const hi = Math.max(...highs);
    return {
      lines,
      total: r2((lo + hi) / 2),
      totalLow: r2(lo),
      totalHigh: r2(hi),
      cashTotal: r2(lines.filter((l) => !l.inProduct).reduce((s, l) => s + (l.low + l.high) / 2, 0)),
      productTotal: r2(lines.filter((l) => l.inProduct).reduce((s, l) => s + (l.low + l.high) / 2, 0)),
      isRange: true,
      unknown: false,
      note: "This retailer's terms vary — the options below are alternatives, not add-ons. Your actual cost depends on the deal you strike.",
    };
  }

  // ADDITIVE: the components genuinely stack.
  const totalLow = r2(lines.reduce((s, l) => s + l.low, 0));
  const totalHigh = r2(lines.reduce((s, l) => s + l.high, 0));
  const cash = r2(lines.filter((l) => !l.inProduct).reduce((s, l) => s + (l.low + l.high) / 2, 0));
  const product = r2(lines.filter((l) => l.inProduct).reduce((s, l) => s + (l.low + l.high) / 2, 0));

  return {
    lines,
    total: r2((totalLow + totalHigh) / 2),
    totalLow,
    totalHigh,
    cashTotal: cash,
    productTotal: product,
    isRange: totalLow !== totalHigh,
    unknown: false,
  };
}
