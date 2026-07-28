import type { Metadata } from "next";
import { TriangleAlertIcon } from "lucide-react";
import { Calculator } from "@/components/Calculator";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Schema } from "@/components/Schema";
import {
  Hero, WhyMargin, Education, Faq, RelatedReading, AboutCta,
} from "@/components/PageCopy";
import { CANONICAL } from "@/lib/content";
import { query } from "@/lib/db";
import type { Retailer, Channel } from "@/lib/resolve";
import type { SlottingType } from "@/lib/entry";

export const dynamic = "force-dynamic";

const TITLE = "Retail Margin & Markup Calculator for CPG | Agentworks";
const DESC =
  "Free retail margin & markup calculator for CPG brands. See your true margin after distributor, retailer & slotting — real data from 219 US chains.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESC,
    url: CANONICAL,
    siteName: "Agentworks",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESC },
};

const num = (v: unknown): number | null =>
  v === null || v === undefined || v === "" ? null : Number(v);

async function getData() {
  const [rRows, cRows, tRows] = await Promise.all([
    query<Record<string, unknown>>(
      "SELECT * FROM retailers ORDER BY (stars IS NULL), stars DESC, stores DESC NULLS LAST, name"
    ),
    query<Record<string, unknown>>("SELECT * FROM channels ORDER BY sort_order"),
    query<{ key: string; amount: string }>("SELECT key, amount FROM trade_defaults"),
  ]);

  const retailers: Retailer[] = rRows.map((r) => ({
    slug: r.slug as string,
    name: r.name as string,
    channel: r.channel as string,
    region: (r.region as string) ?? null,
    stores: r.stores == null ? null : Number(r.stores),
    distributor: (r.distributor as string) ?? null,
    distributorFamily: (r.distributor_family as string) ?? null,
    stars: r.stars == null ? null : Number(r.stars),
    markupLow: num(r.markup_low), markupHigh: num(r.markup_high),
    marginLow: num(r.margin_low), marginHigh: num(r.margin_high),
    slottingRaw: (r.slotting_raw as string) ?? null,
    slottingType: ((r.slotting_type as string) ?? "unknown") as SlottingType,
    ffCasesLow: num(r.ff_cases_low), ffCasesHigh: num(r.ff_cases_high),
    ffUnitsLow: num(r.ff_units_low), ffUnitsHigh: num(r.ff_units_high),
    perStoreLow: num(r.per_store_low), perStoreHigh: num(r.per_store_high),
    lumpLow: num(r.lump_low), lumpHigh: num(r.lump_high),
    percentOfInvoice: num(r.percent_of_invoice),
    slottingAlternatives: Boolean(r.slotting_alternatives),
    slottingVaries: Boolean(r.slotting_varies),
    adtprRaw: (r.adtpr_raw as string) ?? null,
  }));

  const channels: Channel[] = cRows.map((c) => ({
    slug: c.slug as string,
    name: c.name as string,
    hasDistributor: Boolean(c.has_distributor),
    distributorMarkupPct: num(c.distributor_markup_pct),
    markupLow: num(c.markup_low), markupHigh: num(c.markup_high),
    retailerMarginPct: Number(c.retailer_margin_pct),
    marginLow: num(c.margin_low), marginHigh: num(c.margin_high),
    sampleSize: c.sample_size == null ? null : Number(c.sample_size),
    commonSlottingType: ((c.common_slotting_type as string) ?? null) as SlottingType | null,
  }));

  const t = Object.fromEntries(tRows.map((x) => [x.key, Number(x.amount)]));
  return {
    retailers,
    channels,
    defaults: {
      assumedFreeCases: t.free_fill_cases_default ?? 2,
      unitsPerCase: t.units_per_case_default ?? 12,
      healthyMarginPct: t.healthy_margin_pct ?? 25,
    },
    ok: true,
  };
}

export default async function Home() {
  let data;
  try {
    data = await getData();
  } catch {
    return (
      <main className="mx-auto max-w-3xl px-5 py-20">
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5 text-sm text-warning">
          <TriangleAlertIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">The database isn&apos;t running.</p>
            <p className="mt-1 text-muted-foreground">
              Start it with <code className="font-mono">docker compose up db</code>, then reload.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="mx-auto max-w-[1360px] px-4 pb-24 sm:px-6">
      <Schema />

      <div className="flex justify-end pt-5">
        <ThemeToggle />
      </div>

      {/* Hero copy */}
      <div className="pt-2 pb-8">
        <Hero />
      </div>

      {/* The tool — a standalone block, not merged into the copy */}
      <Calculator data={data} />

      {/* Wrap copy */}
      <div className="mt-16 space-y-16">
        <WhyMargin />
        <Education />
        <Faq />
        <RelatedReading />
        <AboutCta />
      </div>

      <footer className="mx-auto mt-16 max-w-2xl border-t pt-6 text-xs leading-relaxed text-muted-foreground">
        Figures on this page are community estimates reported by brands across {data.retailers.length} US
        retail chains — not confirmed by the retailers or distributors named. They&apos;re a starting point;
        always confirm the real terms with your buyer. A free tool from Agentworks Scout.
      </footer>
    </main>
  );
}
