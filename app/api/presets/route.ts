import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import {
  FALLBACK_PRESETS,
  type ChannelPreset,
  type DistributorPreset,
  type PresetPayload,
  type TradeDefaults,
} from "@/lib/presets";

// Always read fresh from the DB; preset data changes on quarterly re-seed.
export const dynamic = "force-dynamic";

interface ChannelRow {
  slug: string;
  name: string;
  has_distributor: boolean;
  distributor_markup_pct: string | null;
  retailer_margin_pct: string;
  sample_size: number | null;
  note: string | null;
}
interface DistributorRow {
  slug: string;
  name: string;
  has_distributor: boolean;
  distributor_markup_pct: string | null;
  sample_size: number | null;
  note: string | null;
}
interface TradeRow {
  key: string;
  amount: string;
}

const num = (v: string | null): number | null => (v == null ? null : Number(v));

export async function GET() {
  try {
    const [channelRows, distRows, tradeRows] = await Promise.all([
      query<ChannelRow>("SELECT * FROM channels ORDER BY sort_order, id"),
      query<DistributorRow>("SELECT * FROM distributors ORDER BY sort_order, id"),
      query<TradeRow>("SELECT key, amount FROM trade_defaults"),
    ]);

    const channels: ChannelPreset[] = channelRows.map((r) => ({
      slug: r.slug,
      name: r.name,
      hasDistributor: r.has_distributor,
      distributorMarkupPct: num(r.distributor_markup_pct),
      retailerMarginPct: Number(r.retailer_margin_pct),
      sampleSize: r.sample_size,
      note: r.note ?? undefined,
    }));

    const distributors: DistributorPreset[] = distRows.map((r) => ({
      slug: r.slug,
      name: r.name,
      hasDistributor: r.has_distributor,
      distributorMarkupPct: num(r.distributor_markup_pct),
      sampleSize: r.sample_size,
      note: r.note ?? undefined,
    }));

    const t = Object.fromEntries(tradeRows.map((r) => [r.key, Number(r.amount)]));
    const tradeDefaults: TradeDefaults = {
      slottingLumpPerSku: t.slotting_lump_per_sku ?? FALLBACK_PRESETS.tradeDefaults.slottingLumpPerSku,
      slottingPerStore: t.slotting_per_store ?? FALLBACK_PRESETS.tradeDefaults.slottingPerStore,
      adTprFee: t.ad_tpr_fee ?? FALLBACK_PRESETS.tradeDefaults.adTprFee,
      healthyMarginPct: t.healthy_margin_pct ?? FALLBACK_PRESETS.tradeDefaults.healthyMarginPct,
    };

    // If the DB is up but unseeded, fall back rather than serve empty selectors.
    if (channels.length === 0) {
      return NextResponse.json(FALLBACK_PRESETS);
    }

    const payload: PresetPayload = { channels, distributors, tradeDefaults, source: "db" };
    return NextResponse.json(payload);
  } catch (err) {
    // DB down / not up yet — the calculator still works on the fallback presets.
    console.warn("[/api/presets] DB unavailable, serving fallback:", (err as Error).message);
    return NextResponse.json(FALLBACK_PRESETS);
  }
}
