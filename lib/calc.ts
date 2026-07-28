/**
 * CPG "cost-to-shelf" calculator engine — pure, framework-agnostic, client-safe.
 *
 * CONVENTIONS (stated up front so the model has no hidden assumptions):
 *
 *  - **Margin** is always on the SELLING price:  margin = (price - cost) / price.
 *  - **Markup** is always on the COST:           markup = (price - cost) / cost.
 *  - The tracker columns we seed from are literally named "Distributor Markup"
 *    and "Retailer Margin", so we honor that:
 *      • Distributor takes a MARKUP on its cost (= your wholesale price).
 *      • Retailer takes a MARGIN on the shelf (retail) price.
 *  - For DIRECT channels (Club, Direct) there is no distributor layer:
 *    distributorMarkupPct is treated as 0 and the retailer buys at your wholesale.
 *
 * The waterfall chain:
 *    COGS  ──(your margin)──▶  Wholesale (your price to distributor)
 *          ──(dist markup)──▶  Distributor sell price (= retailer's cost)
 *          ──(retail margin)─▶  Shelf price (what the shopper pays)
 *
 * All percentages are passed as whole numbers (e.g. 27.5 means 27.5%).
 */

export interface WaterfallPreset {
  /** Distributor markup on its cost (your wholesale), whole-number percent. */
  distributorMarkupPct: number;
  /** Retailer margin on shelf price, whole-number percent. */
  retailerMarginPct: number;
  /** Direct/Club channels have no distributor layer. */
  hasDistributor: boolean;
}

export interface WaterfallResult {
  cogs: number;
  wholesale: number;
  /** Distributor's selling price to the retailer = the retailer's unit cost. */
  distributorSell: number;
  shelf: number;
  manufacturerMarginPct: number;
  distributorMarkupPct: number;
  retailerMarginPct: number;
  /** Absolute dollars each tier keeps per unit. */
  manufacturerProfit: number;
  distributorCut: number;
  retailerCut: number;
}

export interface TrueMarginInput {
  /** Trade costs incurred over the horizon (typically first year). */
  slottingPerSkuLump?: number; // e.g. $5,000 one-time per SKU
  slottingPerStore?: number; // e.g. $100 per SKU per store
  adTprFee?: number; // lump ad/TPR spend over the horizon
  numStores?: number;
  /** Total units you expect to sell over the horizon. */
  annualUnits?: number;
}

export interface TrueMarginResult {
  grossProfit: number; // (wholesale - cogs) * annualUnits
  revenue: number; // wholesale * annualUnits
  slottingTotal: number;
  adTprTotal: number;
  tradeCostTotal: number;
  netProfit: number; // grossProfit - tradeCostTotal
  /** Effective margin after trade costs, whole-number percent. */
  trueMarginPct: number;
  paperMarginPct: number;
}

const EPS = 1e-9;

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function roundPct(n: number): number {
  return Math.round((n + Number.EPSILON) * 10) / 10;
}

// ── Base margin ↔ markup (the head-term feature) ───────────────────────────

/** markup% from margin%. margin must be < 100. */
export function marginToMarkup(marginPct: number): number {
  if (marginPct >= 100) throw new Error("Margin must be below 100%.");
  const m = marginPct / 100;
  return roundPct((m / (1 - m)) * 100);
}

/** margin% from markup%. */
export function markupToMargin(markupPct: number): number {
  const u = markupPct / 100;
  return roundPct((u / (1 + u)) * 100);
}

/** Price from cost + margin%. */
export function priceFromMargin(cost: number, marginPct: number): number {
  if (marginPct >= 100) throw new Error("Margin must be below 100%.");
  if (cost < 0) throw new Error("Cost cannot be negative.");
  return round2(cost / (1 - marginPct / 100));
}

/** Price from cost + markup%. */
export function priceFromMarkup(cost: number, markupPct: number): number {
  if (cost < 0) throw new Error("Cost cannot be negative.");
  return round2(cost * (1 + markupPct / 100));
}

/** Margin% implied by a cost/price pair. */
export function marginFromPrice(cost: number, price: number): number {
  if (price <= EPS) throw new Error("Price must be greater than zero.");
  return roundPct(((price - cost) / price) * 100);
}

// ── Forward waterfall: COGS + your margin → shelf price ─────────────────────

export interface ForwardInput {
  cogs: number;
  /** Your target margin on wholesale. Provide this OR `wholesale`. */
  manufacturerMarginPct?: number;
  /** Set your wholesale price directly instead of a target margin. */
  wholesale?: number;
  preset: WaterfallPreset;
}

export function forwardWaterfall(input: ForwardInput): WaterfallResult {
  const { cogs, preset } = input;
  if (cogs < 0) throw new Error("COGS cannot be negative.");

  let wholesale: number;
  let manufacturerMarginPct: number;

  if (input.wholesale != null) {
    wholesale = input.wholesale;
    if (wholesale <= EPS) throw new Error("Wholesale price must be greater than zero.");
    manufacturerMarginPct = marginFromPrice(cogs, wholesale);
  } else if (input.manufacturerMarginPct != null) {
    manufacturerMarginPct = input.manufacturerMarginPct;
    wholesale = priceFromMargin(cogs, manufacturerMarginPct);
  } else {
    throw new Error("Provide either a target margin or a wholesale price.");
  }

  const distMarkupPct = preset.hasDistributor ? preset.distributorMarkupPct : 0;
  const distributorSell = round2(wholesale * (1 + distMarkupPct / 100));

  const retailerMarginPct = preset.retailerMarginPct;
  if (retailerMarginPct >= 100) throw new Error("Retailer margin must be below 100%.");
  const shelf = round2(distributorSell / (1 - retailerMarginPct / 100));

  return {
    cogs: round2(cogs),
    wholesale: round2(wholesale),
    distributorSell,
    shelf,
    manufacturerMarginPct: roundPct(manufacturerMarginPct),
    distributorMarkupPct: distMarkupPct,
    retailerMarginPct,
    manufacturerProfit: round2(wholesale - cogs),
    distributorCut: round2(distributorSell - wholesale),
    retailerCut: round2(shelf - distributorSell),
  };
}

// ── Reverse waterfall: realistic shelf price → can you afford it? ───────────

export interface ReverseInput {
  /** A realistic in-market shelf price you must hit. */
  shelf: number;
  cogs: number;
  preset: WaterfallPreset;
  /** Optional: a margin you consider "healthy" for the verdict (default 25%). */
  healthyMarginPct?: number;
}

export type ReverseVerdict = "unaffordable" | "tight" | "healthy";

export interface ReverseResult extends WaterfallResult {
  verdict: ReverseVerdict;
  /** Human-readable one-liner. */
  message: string;
}

export function reverseWaterfall(input: ReverseInput): ReverseResult {
  const { shelf, cogs, preset } = input;
  if (shelf <= EPS) throw new Error("Shelf price must be greater than zero.");
  if (cogs < 0) throw new Error("COGS cannot be negative.");

  const retailerMarginPct = preset.retailerMarginPct;
  if (retailerMarginPct >= 100) throw new Error("Retailer margin must be below 100%.");
  const distributorSell = round2(shelf * (1 - retailerMarginPct / 100)); // retailer cost

  const distMarkupPct = preset.hasDistributor ? preset.distributorMarkupPct : 0;
  const wholesale = round2(distributorSell / (1 + distMarkupPct / 100));

  const manufacturerProfit = round2(wholesale - cogs);
  const manufacturerMarginPct =
    wholesale > EPS ? roundPct((manufacturerProfit / wholesale) * 100) : -Infinity;

  const healthy = input.healthyMarginPct ?? 25;
  let verdict: ReverseVerdict;
  let message: string;
  if (wholesale <= cogs) {
    verdict = "unaffordable";
    message =
      `At a $${shelf.toFixed(2)} shelf price, your implied wholesale of ` +
      `$${wholesale.toFixed(2)} is below your $${cogs.toFixed(2)} cost — ` +
      `you'd lose money on every unit in this channel.`;
  } else if (manufacturerMarginPct < healthy) {
    verdict = "tight";
    message =
      `A $${shelf.toFixed(2)} shelf price leaves you a ${manufacturerMarginPct.toFixed(1)}% ` +
      `wholesale margin — workable but thin (below your ${healthy}% healthy bar).`;
  } else {
    verdict = "healthy";
    message =
      `A $${shelf.toFixed(2)} shelf price supports a ${manufacturerMarginPct.toFixed(1)}% ` +
      `wholesale margin at your $${cogs.toFixed(2)} cost — this channel works.`;
  }

  return {
    cogs: round2(cogs),
    wholesale,
    distributorSell,
    shelf: round2(shelf),
    manufacturerMarginPct,
    distributorMarkupPct: distMarkupPct,
    retailerMarginPct,
    manufacturerProfit,
    distributorCut: round2(distributorSell - wholesale),
    retailerCut: round2(shelf - distributorSell),
    verdict,
    message,
  };
}

// ── True margin: subtract slotting + TPR/ad over a horizon ──────────────────

/**
 * Paper margins lie because slotting and trade fees hit real dollars. Given a
 * per-unit wholesale + cogs and a volume/store estimate, compute the effective
 * margin after those trade costs (the "first-year reality" view).
 */
export function trueMargin(
  wholesale: number,
  cogs: number,
  t: TrueMarginInput
): TrueMarginResult {
  const units = Math.max(t.annualUnits ?? 0, 0);
  const stores = Math.max(t.numStores ?? 0, 0);

  const revenue = round2(wholesale * units);
  const grossProfit = round2((wholesale - cogs) * units);

  const slottingTotal = round2(
    (t.slottingPerSkuLump ?? 0) + (t.slottingPerStore ?? 0) * stores
  );
  const adTprTotal = round2(t.adTprFee ?? 0);
  const tradeCostTotal = round2(slottingTotal + adTprTotal);

  const netProfit = round2(grossProfit - tradeCostTotal);
  const trueMarginPct = revenue > EPS ? roundPct((netProfit / revenue) * 100) : -Infinity;
  const paperMarginPct = wholesale > EPS ? roundPct(((wholesale - cogs) / wholesale) * 100) : -Infinity;

  return {
    grossProfit,
    revenue,
    slottingTotal,
    adTprTotal,
    tradeCostTotal,
    netProfit,
    trueMarginPct,
    paperMarginPct,
  };
}
