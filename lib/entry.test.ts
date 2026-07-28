import { describe, it, expect } from "vitest";
import { entryCost, freeFillUnitsPerStore, type SlottingTerms } from "./entry";

const base = { cogs: 1.8, stores: 10, skus: 1, assumedFreeCases: 2, unitsPerCase: 12 };

describe("free-fill quantity resolution", () => {
  it("uses cases when stated, converted by units-per-case", () => {
    const t: SlottingTerms = { type: "free_fill", ffCasesLow: 2, ffCasesHigh: 3 };
    expect(freeFillUnitsPerStore(t, 2, 12)).toEqual({ low: 24, high: 36, assumed: false });
  });

  it("uses an explicit unit count when given instead of cases", () => {
    const t: SlottingTerms = { type: "free_fill", ffUnitsLow: 12, ffUnitsHigh: 12 };
    expect(freeFillUnitsPerStore(t, 2, 12)).toEqual({ low: 12, high: 12, assumed: false });
  });

  it("falls back to the assumed default and FLAGS it when nothing is stated", () => {
    const t: SlottingTerms = { type: "free_fill" };
    const r = freeFillUnitsPerStore(t, 2, 12);
    expect(r).toEqual({ low: 24, high: 24, assumed: true });
  });

  it("cases take precedence over units when both somehow appear", () => {
    const t: SlottingTerms = { type: "free_fill", ffCasesLow: 1, ffCasesHigh: 1, ffUnitsLow: 99, ffUnitsHigh: 99 };
    expect(freeFillUnitsPerStore(t, 2, 12).low).toBe(12);
  });
});

describe("entryCost — single-component cases", () => {
  it("none => zero, not unknown", () => {
    const r = entryCost({ ...base, terms: { type: "none" } });
    expect(r.total).toBe(0);
    expect(r.unknown).toBe(false);
  });

  it("unknown => unknown, and NOT zero (caller must say so)", () => {
    const r = entryCost({ ...base, terms: { type: "unknown" } });
    expect(r.unknown).toBe(true);
    expect(r.total).toBeNull();
  });

  it("free fill costs COGS, and is marked as product not cash", () => {
    // 2 cases assumed x 12 units = 24 units x $1.80 x 10 stores = $432
    const r = entryCost({ ...base, terms: { type: "free_fill" } });
    expect(r.total).toBe(432);
    expect(r.productTotal).toBe(432);
    expect(r.cashTotal).toBe(0);
    expect(r.lines[0].inProduct).toBe(true);
    expect(r.lines[0].assumed).toBe(true);
  });

  it("per-store fee scales by stores AND skus", () => {
    const t: SlottingTerms = { type: "per_store", perStoreLow: 100, perStoreHigh: 100 };
    const r = entryCost({ ...base, skus: 3, terms: t });
    expect(r.total).toBe(3000); // 100 x 10 stores x 3 skus
    expect(r.cashTotal).toBe(3000);
    expect(r.productTotal).toBe(0);
  });

  it("lump is per SKU and does NOT scale with stores", () => {
    const t: SlottingTerms = { type: "lump", lumpLow: 5000, lumpHigh: 5000 };
    const a = entryCost({ ...base, stores: 10, terms: t });
    const b = entryCost({ ...base, stores: 500, terms: t });
    expect(a.total).toBe(5000);
    expect(b.total).toBe(5000); // store count must not matter
    expect(entryCost({ ...base, skus: 4, terms: t }).total).toBe(20000);
  });

  it("a lump RANGE reports low/high and a midpoint total", () => {
    const t: SlottingTerms = { type: "lump", lumpLow: 5000, lumpHigh: 15000 };
    const r = entryCost({ ...base, terms: t });
    expect(r.totalLow).toBe(5000);
    expect(r.totalHigh).toBe(15000);
    expect(r.total).toBe(10000);
    expect(r.isRange).toBe(true);
  });
});

describe("entryCost — ADDITIVE vs ALTERNATIVES (the load-bearing distinction)", () => {
  // Source text: "free fill, $60/SKU/store"  (comma => both apply)
  it("ADDITIVE: free fill AND a per-store fee are summed", () => {
    const t: SlottingTerms = {
      type: "free_fill_plus_fee", perStoreLow: 60, perStoreHigh: 60, alternatives: false,
    };
    const r = entryCost({ ...base, terms: t });
    // free fill 24u x $1.80 x 10 = 432 ; fee 60 x 10 = 600 ; total 1032
    expect(r.total).toBe(1032);
    expect(r.productTotal).toBe(432);
    expect(r.cashTotal).toBe(600);
    expect(r.isRange).toBe(false);
  });

  // Source text: "free fill - $9k"  (dash => either/or)
  it("ALTERNATIVES: components are competing options, spanning cheapest→dearest", () => {
    const t: SlottingTerms = {
      type: "free_fill_plus_fee", lumpLow: 9000, lumpHigh: 9000, alternatives: true,
    };
    const r = entryCost({ ...base, terms: t });
    expect(r.isRange).toBe(true);
    expect(r.totalLow).toBe(432);   // the free-fill option
    expect(r.totalHigh).toBe(9000); // the cash option
    // Crucially it must NOT be the sum:
    expect(r.total).not.toBe(9432);
    expect(r.note).toContain("alternatives");
  });

  it("ALTERNATIVES never exceeds the dearest single option", () => {
    const t: SlottingTerms = {
      type: "free_fill_plus_fee", perStoreLow: 100, perStoreHigh: 100,
      lumpLow: 20000, lumpHigh: 20000, alternatives: true,
    };
    const r = entryCost({ ...base, terms: t });
    expect(r.totalHigh).toBe(20000);
    expect(r.totalHigh).toBeLessThan(432 + 1000 + 20000);
  });
});

describe("entryCost — percent of invoice", () => {
  it("computes a % of expected annual sales", () => {
    const t: SlottingTerms = { type: "percent_of_invoice", percentOfInvoice: 4.8 };
    const r = entryCost({ ...base, terms: t, wholesale: 3, annualUnits: 20000 });
    expect(r.total).toBe(2880); // 4.8% of $60,000
    expect(r.cashTotal).toBe(2880);
  });

  it("asks for volume rather than guessing when none is given", () => {
    const t: SlottingTerms = { type: "percent_of_invoice", percentOfInvoice: 4.8 };
    const r = entryCost({ ...base, terms: t });
    expect(r.total).toBeNull();
    expect(r.note).toContain("annual volume");
  });
});

describe("entryCost — edge cases that must not produce nonsense", () => {
  it("zero stores => zero per-store and free-fill cost, lump unaffected", () => {
    const t: SlottingTerms = {
      type: "free_fill_plus_fee", perStoreLow: 60, perStoreHigh: 60, lumpLow: 1000, lumpHigh: 1000,
    };
    const r = entryCost({ ...base, stores: 0, terms: t });
    expect(r.lines.find((l) => l.key === "free_fill")!.low).toBe(0);
    expect(r.lines.find((l) => l.key === "per_store")!.low).toBe(0);
    expect(r.lines.find((l) => l.key === "lump")!.low).toBe(1000);
  });

  it("zero COGS => free fill costs nothing (you give away nothing of value)", () => {
    const r = entryCost({ ...base, cogs: 0, terms: { type: "free_fill" } });
    expect(r.total).toBe(0);
  });

  it("negative inputs are clamped, never propagated", () => {
    const t: SlottingTerms = { type: "per_store", perStoreLow: 100, perStoreHigh: 100 };
    const r = entryCost({ ...base, stores: -5, cogs: -3, terms: t });
    expect(r.total).toBe(0);
    expect(r.total).not.toBeLessThan(0);
  });

  it("zero SKUs yields zero, not a negative or NaN", () => {
    const t: SlottingTerms = { type: "lump", lumpLow: 5000, lumpHigh: 5000 };
    const r = entryCost({ ...base, skus: 0, terms: t });
    expect(r.total).toBe(0);
    expect(Number.isNaN(r.total)).toBe(false);
  });

  it("non-finite COGS does not produce NaN", () => {
    const r = entryCost({ ...base, cogs: NaN, terms: { type: "free_fill" } });
    expect(Number.isNaN(r.total!)).toBe(false);
    expect(r.total).toBe(0);
  });
});
