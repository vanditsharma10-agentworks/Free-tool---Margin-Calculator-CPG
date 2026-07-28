import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { Retailer, Channel } from "@/lib/resolve";
import type { SlottingType } from "@/lib/entry";

export const dynamic = "force-dynamic";

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

interface RetailerRow {
  slug: string; name: string; channel: string; region: string | null;
  stores: number | null; distributor: string | null; distributor_family: string | null;
  stars: number | null; markup_low: string | null; markup_high: string | null;
  margin_low: string | null; margin_high: string | null;
  slotting_raw: string | null; slotting_type: string | null;
  ff_cases_low: string | null; ff_cases_high: string | null;
  ff_units_low: string | null; ff_units_high: string | null;
  per_store_low: string | null; per_store_high: string | null;
  lump_low: string | null; lump_high: string | null;
  percent_of_invoice: string | null;
  slotting_alternatives: boolean; slotting_varies: boolean; adtpr_raw: string | null;
}

interface ChannelRow {
  slug: string; name: string; has_distributor: boolean;
  distributor_markup_pct: string | null; markup_low: string | null; markup_high: string | null;
  retailer_margin_pct: string; margin_low: string | null; margin_high: string | null;
  sample_size: number | null; common_slotting_type: string | null;
}

interface DistRow {
  slug: string; name: string; has_distributor: boolean;
  distributor_markup_pct: string | null; markup_low: string | null; markup_high: string | null;
  sample_size: number | null;
}

export interface AppData {
  retailers: Retailer[];
  channels: Channel[];
  distributors: {
    slug: string; name: string; hasDistributor: boolean;
    distributorMarkupPct: number | null; markupLow: number | null; markupHigh: number | null;
    sampleSize: number | null;
  }[];
  defaults: { assumedFreeCases: number; unitsPerCase: number; healthyMarginPct: number };
  ok: boolean;
}

export async function GET() {
  try {
    const [rRows, cRows, dRows, tRows] = await Promise.all([
      query<RetailerRow>("SELECT * FROM retailers ORDER BY (stars IS NULL), stars DESC, stores DESC NULLS LAST, name"),
      query<ChannelRow>("SELECT * FROM channels ORDER BY sort_order"),
      query<DistRow>("SELECT * FROM distributors ORDER BY sort_order"),
      query<{ key: string; amount: string }>("SELECT key, amount FROM trade_defaults"),
    ]);

    const retailers: Retailer[] = rRows.map((r) => ({
      slug: r.slug, name: r.name, channel: r.channel, region: r.region,
      stores: r.stores, distributor: r.distributor, distributorFamily: r.distributor_family,
      stars: r.stars,
      markupLow: num(r.markup_low), markupHigh: num(r.markup_high),
      marginLow: num(r.margin_low), marginHigh: num(r.margin_high),
      slottingRaw: r.slotting_raw,
      slottingType: (r.slotting_type ?? "unknown") as SlottingType,
      ffCasesLow: num(r.ff_cases_low), ffCasesHigh: num(r.ff_cases_high),
      ffUnitsLow: num(r.ff_units_low), ffUnitsHigh: num(r.ff_units_high),
      perStoreLow: num(r.per_store_low), perStoreHigh: num(r.per_store_high),
      lumpLow: num(r.lump_low), lumpHigh: num(r.lump_high),
      percentOfInvoice: num(r.percent_of_invoice),
      slottingAlternatives: r.slotting_alternatives,
      slottingVaries: r.slotting_varies,
      adtprRaw: r.adtpr_raw,
    }));

    const channels: Channel[] = cRows.map((c) => ({
      slug: c.slug, name: c.name, hasDistributor: c.has_distributor,
      distributorMarkupPct: num(c.distributor_markup_pct),
      markupLow: num(c.markup_low), markupHigh: num(c.markup_high),
      retailerMarginPct: Number(c.retailer_margin_pct),
      marginLow: num(c.margin_low), marginHigh: num(c.margin_high),
      sampleSize: c.sample_size,
      commonSlottingType: (c.common_slotting_type ?? null) as SlottingType | null,
    }));

    const t = Object.fromEntries(tRows.map((x) => [x.key, Number(x.amount)]));

    const payload: AppData = {
      retailers,
      channels,
      distributors: dRows.map((d) => ({
        slug: d.slug, name: d.name, hasDistributor: d.has_distributor,
        distributorMarkupPct: num(d.distributor_markup_pct),
        markupLow: num(d.markup_low), markupHigh: num(d.markup_high),
        sampleSize: d.sample_size,
      })),
      defaults: {
        assumedFreeCases: t.free_fill_cases_default ?? 2,
        unitsPerCase: t.units_per_case_default ?? 12,
        healthyMarginPct: t.healthy_margin_pct ?? 25,
      },
      ok: true,
    };
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[/api/data]", (err as Error).message);
    return NextResponse.json(
      { retailers: [], channels: [], distributors: [], defaults: { assumedFreeCases: 2, unitsPerCase: 12, healthyMarginPct: 25 }, ok: false },
      { status: 503 }
    );
  }
}
