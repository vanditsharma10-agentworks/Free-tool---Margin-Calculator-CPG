/**
 * End-to-end arithmetic check against figures taken directly from the source
 * sheet. Every expectation here was worked out BY HAND from the sheet's own
 * values, then asserted against the engine — so a silent change in either the
 * data or the maths fails the build.
 *
 * (scripts/verify_against_sheet.py separately proves the database matches the
 * sheet; this proves the engine does the right arithmetic with those numbers.)
 */
import { describe, it, expect } from "vitest";
import { forwardWaterfall, reverseWaterfall } from "./calc";
import { entryCost, type SlottingTerms } from "./entry";

describe("Sprouts — Natural, 457 stores, KeHE, markup 5–10%, margin 40–45%, 'free fill'", () => {
  // Band midpoints: markup (5+10)/2 = 7.5% ; margin (40+45)/2 = 42.5%
  const preset = { distributorMarkupPct: 7.5, retailerMarginPct: 42.5, hasDistributor: true };

  it("forward: $1.80 cost at a 40% margin reaches a $5.61 shelf price", () => {
    // wholesale        = 1.80 / (1 - 0.40)      = 3.00
    // distributor sell = 3.00 * 1.075           = 3.225
    // shelf            = 3.225 / (1 - 0.425)    = 5.608695...
    const r = forwardWaterfall({ cogs: 1.8, manufacturerMarginPct: 40, preset });
    expect(r.wholesale).toBe(3.0);
    expect(r.distributorSell).toBe(3.23); // 3.225 displayed
    expect(r.shelf).toBe(5.61); // NOT 5.62 — no rounding cascade
  });

  it("reverse: a $5.61 shelf price round-trips back to ~$3.00 wholesale", () => {
    const r = reverseWaterfall({ shelf: 5.61, cogs: 1.8, preset });
    expect(r.wholesale).toBeCloseTo(3.0, 1);
    expect(r.verdict).toBe("healthy");
  });

  it("free fill across all 457 stores costs 457 x 24 units x $1.80 = $19,742.40", () => {
    // "free fill" states no quantity, so the stated default applies: 2 cases x 12.
    const terms: SlottingTerms = { type: "free_fill", raw: "free fill" };
    const r = entryCost({
      terms, cogs: 1.8, stores: 457, skus: 1, assumedFreeCases: 2, unitsPerCase: 12,
    });
    expect(r.total).toBe(19742.4);
    expect(r.productTotal).toBe(19742.4);
    expect(r.cashTotal).toBe(0);
    expect(r.lines[0].assumed).toBe(true); // the quantity was assumed — must be flagged
  });

  it("a realistic 40-store launch costs far less than the full chain", () => {
    const terms: SlottingTerms = { type: "free_fill", raw: "free fill" };
    const r = entryCost({
      terms, cogs: 1.8, stores: 40, skus: 1, assumedFreeCases: 2, unitsPerCase: 12,
    });
    expect(r.total).toBe(1728); // 40 x 24 x 1.80
  });
});

describe("Earth Fare — Natural, 20 stores, UNFI, margin 35–40%, '$5.2k/SKU'", () => {
  it("slotting is a flat $5,200 regardless of store count", () => {
    const terms: SlottingTerms = { type: "lump", raw: "$5.2k/SKU", lumpLow: 5200, lumpHigh: 5200 };
    const twenty = entryCost({ terms, cogs: 1.8, stores: 20, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 });
    const two = entryCost({ terms, cogs: 1.8, stores: 2, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 });
    expect(twenty.total).toBe(5200);
    expect(two.total).toBe(5200);
    expect(twenty.cashTotal).toBe(5200);
  });

  it("three SKUs triples it to $15,600", () => {
    const terms: SlottingTerms = { type: "lump", lumpLow: 5200, lumpHigh: 5200 };
    const r = entryCost({ terms, cogs: 1.8, stores: 20, skus: 3, assumedFreeCases: 2, unitsPerCase: 12 });
    expect(r.total).toBe(15600);
  });
});

describe("A chain quoting '$100/sku / store' — the per-store trap", () => {
  it("scales linearly with stores, so a big chain is enormous", () => {
    const terms: SlottingTerms = { type: "per_store", perStoreLow: 100, perStoreHigh: 100 };
    const small = entryCost({ terms, cogs: 1.8, stores: 14, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 });
    const big = entryCost({ terms, cogs: 1.8, stores: 1000, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 });
    expect(small.total).toBe(1400);
    expect(big.total).toBe(100000); // one SKU, one thousand stores
  });
});

describe("'free fill, $60/SKU/store' — comma means BOTH apply", () => {
  it("sums the free product and the cash fee", () => {
    const terms: SlottingTerms = {
      type: "free_fill_plus_fee", raw: "free fill, $60/SKU/store",
      perStoreLow: 60, perStoreHigh: 60, alternatives: false,
    };
    const r = entryCost({ terms, cogs: 1.8, stores: 25, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 });
    // free fill: 25 x 24 x 1.80 = 1080 ; fee: 25 x 60 = 1500
    expect(r.productTotal).toBe(1080);
    expect(r.cashTotal).toBe(1500);
    expect(r.total).toBe(2580);
  });
});

describe("'free fill - $9k' — dash means EITHER/OR, never a sum", () => {
  it("returns the span between the two options, not their total", () => {
    const terms: SlottingTerms = {
      type: "free_fill_plus_fee", raw: "free fill - $9k (varies by cat.)",
      lumpLow: 9000, lumpHigh: 9000, alternatives: true, varies: true,
    };
    const r = entryCost({ terms, cogs: 1.8, stores: 25, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 });
    expect(r.totalLow).toBe(1080); // the free-fill route
    expect(r.totalHigh).toBe(9000); // the cash route
    expect(r.total).not.toBe(10080); // must NOT add them
    expect(r.isRange).toBe(true);
  });
});

describe("rounding + the waterfall sum invariant", () => {
  it("3.00 x 1.075 rounds to 3.23, not 3.22 (binary-float half-cent case)", () => {
    const r = forwardWaterfall({
      cogs: 1.8, manufacturerMarginPct: 40,
      preset: { distributorMarkupPct: 7.5, retailerMarginPct: 42.5, hasDistributor: true },
    });
    expect(r.distributorSell).toBe(3.23);
  });

  it("segments always sum EXACTLY to the shelf price, across many inputs", () => {
    const margins = [10, 25, 33.3, 42.5, 47.5, 60];
    const markups = [0, 5, 7.5, 12.5, 17.5, 30];
    const costs = [0.37, 1.8, 2.99, 12.5];
    for (const m of margins) {
      for (const k of markups) {
        for (const c of costs) {
          const r = forwardWaterfall({
            cogs: c, manufacturerMarginPct: 35,
            preset: { distributorMarkupPct: k, retailerMarginPct: m, hasDistributor: true },
          });
          const sum = r.cogs + r.manufacturerProfit + r.distributorCut + r.retailerCut;
          // Exact to the cent — the waterfall renders these as shares of shelf.
          expect(Math.abs(sum - r.shelf)).toBeLessThan(0.0051);
        }
      }
    }
  });

  it("reverse mode holds the same invariant", () => {
    for (const shelf of [2.49, 4.99, 5.61, 9.99, 24.0]) {
      const r = reverseWaterfall({
        shelf, cogs: 1.2,
        preset: { distributorMarkupPct: 12.5, retailerMarginPct: 37.5, hasDistributor: true },
      });
      const sum = r.cogs + r.manufacturerProfit + r.distributorCut + r.retailerCut;
      expect(Math.abs(sum - r.shelf)).toBeLessThan(0.0051);
    }
  });
});

describe("Club — no distributor layer, thin 12.5% margin", () => {
  it("skips the distributor entirely", () => {
    const preset = { distributorMarkupPct: 0, retailerMarginPct: 12.5, hasDistributor: false };
    const r = forwardWaterfall({ cogs: 1.8, manufacturerMarginPct: 40, preset });
    expect(r.wholesale).toBe(3.0);
    expect(r.distributorSell).toBe(3.0); // unchanged — nobody in between
    expect(r.distributorCut).toBe(0);
    expect(r.shelf).toBe(3.43); // 3.00 / 0.875
  });
});

describe("Selling direct — the distribution cost must NOT be treated as free", () => {
  // Club-style: 12.5% retailer margin, no third-party distributor.
  it("forward: a 15% self-distribution cost raises the shelf above the free-distribution case", () => {
    // wholesale = 1.80 / (1 - 0.40) = 3.00
    // your distribution cost 15% -> retailer cost = 3.00 * 1.15 = 3.45
    // shelf = 3.45 / (1 - 0.125) = 3.942857... -> 3.94
    const withCost = forwardWaterfall({
      cogs: 1.8, manufacturerMarginPct: 40,
      preset: { distributorMarkupPct: 15, retailerMarginPct: 12.5, hasDistributor: false },
    });
    expect(withCost.distributorSell).toBe(3.45);
    expect(withCost.shelf).toBe(3.94);
    // the middle band is your distribution cost = 3.45 - 3.00 = 0.45
    expect(withCost.distributorCut).toBe(0.45);

    // With the OLD behaviour (cost treated as 0) the shelf was only 3.43 —
    // proving the cost is now accounted for rather than dropped.
    const freeDist = forwardWaterfall({
      cogs: 1.8, manufacturerMarginPct: 40,
      preset: { distributorMarkupPct: 0, retailerMarginPct: 12.5, hasDistributor: false },
    });
    expect(freeDist.shelf).toBe(3.43);
    expect(withCost.shelf).toBeGreaterThan(freeDist.shelf);
  });

  it("forward: segments still sum exactly to the shelf price", () => {
    const r = forwardWaterfall({
      cogs: 1.8, manufacturerMarginPct: 40,
      preset: { distributorMarkupPct: 15, retailerMarginPct: 12.5, hasDistributor: false },
    });
    const sum = r.cogs + r.manufacturerProfit + r.distributorCut + r.retailerCut;
    expect(Math.abs(sum - r.shelf)).toBeLessThan(0.0051);
  });

  it("reverse: adding a distribution cost LOWERS your implied wholesale (no more inflation)", () => {
    // Same fixed shelf price, with vs without a self-distribution cost.
    const shelf = 3.94;
    const withCost = reverseWaterfall({
      shelf, cogs: 1.8,
      preset: { distributorMarkupPct: 15, retailerMarginPct: 12.5, hasDistributor: false },
    });
    const ignored = reverseWaterfall({
      shelf, cogs: 1.8,
      preset: { distributorMarkupPct: 0, retailerMarginPct: 12.5, hasDistributor: false },
    });
    // retailer cost = 3.94 * 0.875 = 3.4475
    // with cost: wholesale = 3.4475 / 1.15 = 2.9978...  (~3.00)
    // ignored:   wholesale = 3.4475            = 3.45
    expect(withCost.wholesale).toBeCloseTo(3.0, 1);
    expect(ignored.wholesale).toBeCloseTo(3.45, 1);
    // Ignoring the cost overstates your take by ~15% — exactly the gap.
    expect(withCost.wholesale).toBeLessThan(ignored.wholesale);
  });
});

describe("Drug — 47.5% retailer margin squeezes the brand hardest", () => {
  it("a $4.99 shelf price at a $1.80 cost is tight or worse", () => {
    const preset = { distributorMarkupPct: 17.5, retailerMarginPct: 47.5, hasDistributor: true };
    const r = reverseWaterfall({ shelf: 4.99, cogs: 1.8, preset });
    // retailer cost = 4.99 x 0.525 = 2.61975 ; wholesale = 2.61975 / 1.175 = 2.2296
    expect(r.wholesale).toBeCloseTo(2.23, 2);
    expect(r.manufacturerMarginPct).toBeCloseTo(19.3, 0);
    expect(r.verdict).toBe("tight");
  });
});
