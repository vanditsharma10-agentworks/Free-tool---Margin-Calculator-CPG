import { describe, it, expect } from "vitest";
import {
  marginToMarkup,
  markupToMargin,
  priceFromMargin,
  priceFromMarkup,
  marginFromPrice,
  forwardWaterfall,
  reverseWaterfall,
  trueMargin,
  type WaterfallPreset,
} from "./calc";

// A representative "Natural via UNFI" preset (from the tracker-derived medians).
const naturalUnfi: WaterfallPreset = {
  distributorMarkupPct: 12.5,
  retailerMarginPct: 37.5,
  hasDistributor: true,
};

// A "Club (direct)" preset — no distributor layer.
const clubDirect: WaterfallPreset = {
  distributorMarkupPct: 0,
  retailerMarginPct: 12.5,
  hasDistributor: false,
};

describe("margin ↔ markup base conversions", () => {
  it("keystone (50% margin) is a 100% markup", () => {
    expect(marginToMarkup(50)).toBe(100);
    expect(markupToMargin(100)).toBe(50);
  });

  it("round-trips 40% margin", () => {
    expect(markupToMargin(marginToMarkup(40))).toBeCloseTo(40, 1);
  });

  it("priceFromMargin: $6 cost at 40% margin = $10", () => {
    expect(priceFromMargin(6, 40)).toBe(10);
  });

  it("priceFromMarkup: $6 cost at 50% markup = $9", () => {
    expect(priceFromMarkup(6, 50)).toBe(9);
  });

  it("marginFromPrice: $6 cost, $10 price = 40%", () => {
    expect(marginFromPrice(6, 10)).toBe(40);
  });

  it("EDGE: margin >= 100% is rejected", () => {
    expect(() => marginToMarkup(100)).toThrow();
    expect(() => priceFromMargin(5, 100)).toThrow();
  });

  it("EDGE: zero price rejected in marginFromPrice (div-by-zero)", () => {
    expect(() => marginFromPrice(5, 0)).toThrow();
  });
});

describe("forward waterfall", () => {
  it("COGS + target margin flows COGS→wholesale→dist→shelf", () => {
    // $1.80 cost, 40% mfg margin → wholesale $3.00
    const r = forwardWaterfall({ cogs: 1.8, manufacturerMarginPct: 40, preset: naturalUnfi });
    expect(r.wholesale).toBe(3.0);
    // distributor sell = 3.00 * 1.125 = 3.375 → 3.38 (rounded)
    expect(r.distributorSell).toBe(3.38);
    // shelf = 3.375 / (1 - 0.375) = 5.40
    expect(r.shelf).toBeCloseTo(5.4, 1);
    // tiers sum back to shelf
    expect(r.manufacturerProfit + r.cogs).toBeCloseTo(r.wholesale, 2);
    expect(r.wholesale + r.distributorCut).toBeCloseTo(r.distributorSell, 2);
    expect(r.distributorSell + r.retailerCut).toBeCloseTo(r.shelf, 2);
  });

  it("accepts a direct wholesale instead of a target margin", () => {
    const r = forwardWaterfall({ cogs: 6, wholesale: 10, preset: naturalUnfi });
    expect(r.manufacturerMarginPct).toBe(40);
  });

  it("EDGE: Direct/Club channel skips the distributor layer", () => {
    const r = forwardWaterfall({ cogs: 2, manufacturerMarginPct: 50, preset: clubDirect });
    // wholesale = 2 / 0.5 = 4; no distributor markup → retailer buys at 4
    expect(r.wholesale).toBe(4);
    expect(r.distributorSell).toBe(4);
    expect(r.distributorCut).toBe(0);
  });

  it("EDGE: negative COGS rejected", () => {
    expect(() => forwardWaterfall({ cogs: -1, manufacturerMarginPct: 40, preset: naturalUnfi })).toThrow();
  });

  it("EDGE: missing both margin and wholesale rejected", () => {
    expect(() => forwardWaterfall({ cogs: 2, preset: naturalUnfi })).toThrow();
  });
});

describe("reverse waterfall (the affordability check)", () => {
  it("healthy: generous shelf price supports a good margin", () => {
    const r = reverseWaterfall({ shelf: 5.4, cogs: 1.8, preset: naturalUnfi });
    expect(r.verdict).toBe("healthy");
    expect(r.wholesale).toBeGreaterThan(r.cogs);
  });

  it("EDGE: unaffordable when implied wholesale is below cost", () => {
    // Very low shelf price against a high cost → negative margin
    const r = reverseWaterfall({ shelf: 2.5, cogs: 3.0, preset: naturalUnfi });
    expect(r.verdict).toBe("unaffordable");
    expect(r.wholesale).toBeLessThan(r.cogs);
    expect(r.message).toContain("lose money");
  });

  it("tight: workable but below the healthy bar", () => {
    // Tune a shelf price that lands the wholesale margin between 0 and healthy(25%)
    const r = reverseWaterfall({ shelf: 4.0, cogs: 2.0, preset: naturalUnfi, healthyMarginPct: 25 });
    expect(r.verdict).toBe("tight");
    expect(r.manufacturerMarginPct).toBeGreaterThan(0);
    expect(r.manufacturerMarginPct).toBeLessThan(25);
  });

  it("EDGE: zero shelf price rejected (div-by-zero)", () => {
    expect(() => reverseWaterfall({ shelf: 0, cogs: 1, preset: naturalUnfi })).toThrow();
  });
});

describe("true margin (slotting + TPR)", () => {
  it("subtracts slotting lump + per-store + ad/TPR from gross", () => {
    // wholesale $3, cogs $1.80 → $1.20/unit gross. 50 stores, 20k units.
    const r = trueMargin(3, 1.8, {
      slottingPerSkuLump: 5000,
      slottingPerStore: 100,
      adTprFee: 1250,
      numStores: 50,
      annualUnits: 20000,
    });
    expect(r.grossProfit).toBe(24000); // 1.20 * 20000
    expect(r.slottingTotal).toBe(10000); // 5000 + 100*50
    expect(r.adTprTotal).toBe(1250);
    expect(r.netProfit).toBe(24000 - 11250);
    expect(r.trueMarginPct).toBeLessThan(r.paperMarginPct);
  });

  it("EDGE: zero volume → no revenue, true margin is not a positive number", () => {
    const r = trueMargin(3, 1.8, { slottingPerSkuLump: 5000, annualUnits: 0 });
    expect(r.revenue).toBe(0);
    expect(Number.isFinite(r.trueMarginPct)).toBe(false);
  });
});
