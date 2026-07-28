import { describe, it, expect } from "vitest";
import {
  resolveMargin,
  resolveMarkup,
  resolveSlotting,
  slottingPeers,
  marginPeers,
  type Retailer,
  type Channel,
} from "./resolve";

const blank: Retailer = {
  slug: "x", name: "X", channel: "Natural", region: null, stores: null,
  distributor: null, distributorFamily: null, stars: null,
  markupLow: null, markupHigh: null, marginLow: null, marginHigh: null,
  slottingRaw: null, slottingType: "unknown",
  ffCasesLow: null, ffCasesHigh: null, ffUnitsLow: null, ffUnitsHigh: null,
  perStoreLow: null, perStoreHigh: null, lumpLow: null, lumpHigh: null,
  percentOfInvoice: null, slottingAlternatives: false, slottingVaries: false, adtprRaw: null,
};

const natural: Channel = {
  slug: "natural", name: "Natural", hasDistributor: true,
  distributorMarkupPct: 12.5, markupLow: 7.5, markupHigh: 22.5,
  retailerMarginPct: 37.5, marginLow: 37.5, marginHigh: 42.5,
  sampleSize: 60, commonSlottingType: "free_fill",
};

describe("margin provenance", () => {
  it("uses the chain's own band and marks it exact", () => {
    const r = { ...blank, name: "Sprouts", marginLow: 40, marginHigh: 45 };
    const m = resolveMargin(r, natural)!;
    expect(m.provenance).toBe("exact");
    expect(m.value).toBe(42.5);
    expect(m.note).toContain("Sprouts");
  });

  it("falls back to the channel average and SAYS it averaged", () => {
    const r = { ...blank, name: "Erewhon" };
    const m = resolveMargin(r, natural)!;
    expect(m.provenance).toBe("averaged");
    expect(m.value).toBe(37.5);
    expect(m.note).toContain("Erewhon hasn't reported");
    expect(m.note).toContain("60");
  });

  it("handles an open-ended band (e.g. 50%+) without NaN", () => {
    const r = { ...blank, marginLow: 50, marginHigh: null };
    const m = resolveMargin(r, natural)!;
    expect(m.value).toBe(50);
    expect(Number.isNaN(m.value)).toBe(false);
  });
});

describe("markup provenance", () => {
  it("marks the chain's own markup exact", () => {
    const r = { ...blank, name: "Sprouts", markupLow: 5, markupHigh: 10 };
    expect(resolveMarkup(r, natural)!.provenance).toBe("exact");
    expect(resolveMarkup(r, natural)!.value).toBe(7.5);
  });

  it("averages when absent", () => {
    expect(resolveMarkup(blank, natural)!.provenance).toBe("averaged");
  });

  it("returns null when the channel has no distributor layer at all", () => {
    const club: Channel = { ...natural, name: "Club", distributorMarkupPct: null, hasDistributor: false };
    expect(resolveMarkup(blank, club)).toBeNull();
  });
});

describe("slotting provenance", () => {
  it("uses the chain's own terms verbatim and marks exact", () => {
    const r = { ...blank, name: "Earth Fare", slottingRaw: "$5.2k/SKU", slottingType: "lump" as const, lumpLow: 5200, lumpHigh: 5200 };
    const s = resolveSlotting(r, natural);
    expect(s.provenance).toBe("exact");
    expect(s.raw).toBe("$5.2k/SKU");
    expect(s.terms.lumpLow).toBe(5200);
  });

  it("carries the alternatives flag through untouched", () => {
    const r = { ...blank, slottingRaw: "free fill - $9k", slottingType: "free_fill_plus_fee" as const, lumpLow: 9000, lumpHigh: 9000, slottingAlternatives: true };
    expect(resolveSlotting(r, natural).terms.alternatives).toBe(true);
  });

  it("falls back to the channel's most common arrangement and says so", () => {
    const r = { ...blank, name: "Erewhon" };
    const s = resolveSlotting(r, natural);
    expect(s.provenance).toBe("averaged");
    expect(s.terms.type).toBe("free_fill");
    expect(s.note).toContain("hasn't reported");
    expect(s.raw).toBeNull();
  });

  it("admits it doesn't know when the channel has no common type either", () => {
    const thin: Channel = { ...natural, commonSlottingType: null };
    const s = resolveSlotting(blank, thin);
    expect(s.provenance).toBe("unknown");
    expect(s.terms.type).toBe("unknown");
  });
});

describe("peers — who in the same category charges what", () => {
  const all: Retailer[] = [
    { ...blank, slug: "a", name: "Earth Fare", stars: 5, stores: 20, slottingRaw: "$5.2k/SKU", slottingType: "lump", marginLow: 35, marginHigh: 40 },
    { ...blank, slug: "b", name: "Fresh Thyme", stars: 5, stores: 74, slottingRaw: "free fill", slottingType: "free_fill", marginLow: 35, marginHigh: 40 },
    { ...blank, slug: "c", name: "Other Channel", channel: "Conventional", stars: 5, slottingRaw: "none", slottingType: "none" },
    { ...blank, slug: "d", name: "No Data", stars: 3 },
  ];

  it("returns same-channel named examples only", () => {
    const p = slottingPeers("Natural", all);
    expect(p.map((x) => x.name)).toEqual(["Fresh Thyme", "Earth Fare"]);
    expect(p[0].description).toBe("free fill");
  });

  it("excludes the selected chain itself", () => {
    expect(slottingPeers("Natural", all, "b").map((x) => x.name)).toEqual(["Earth Fare"]);
  });

  it("omits chains with no reported terms", () => {
    expect(slottingPeers("Natural", all).some((x) => x.name === "No Data")).toBe(false);
  });

  it("margin peers format bands readably", () => {
    expect(marginPeers("Natural", all)[0].description).toBe("35–40%");
  });

  it("respects the limit", () => {
    expect(slottingPeers("Natural", all, undefined, 1)).toHaveLength(1);
  });
});
