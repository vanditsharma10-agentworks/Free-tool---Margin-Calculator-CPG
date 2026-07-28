import type { Metadata } from "next";
import { TriangleAlertIcon } from "lucide-react";

import { Container } from "@/components/layout";
import { SectionHeader } from "@/components/common/section-header";
import { FaqSection } from "@/components/faq";
import { CtaSection, type CtaSectionData } from "@/components/cta";
import { ListingCard } from "@/components/listing/listing-card";
import type { ListingItem } from "@/components/listing/types";
import { Calculator } from "@/components/Calculator";
import { links } from "@/config/links";
import { siteConfig } from "@/config/site";
import { posts } from "@/config/blog";
import { CANONICAL, PATH, SITE, FAQ_ITEMS } from "@/lib/content";
import { query } from "@/lib/db";
import type { Retailer, Channel } from "@/lib/resolve";
import type { SlottingType } from "@/lib/entry";

export const dynamic = "force-dynamic";

const TITLE = "Retail Margin & Markup Calculator for CPG Brands";
const DESCRIPTION =
  "Free retail margin & markup calculator for CPG brands. See your true margin after distributor, retailer & slotting — real data from 219 US chains.";

export const metadata: Metadata = {
  // Kept ≤60 chars (drops "Brands" that the H1/OG keep).
  title: { absolute: "Retail Margin & Markup Calculator for CPG | Agentworks" },
  description: DESCRIPTION,
  alternates: { canonical: PATH },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    images: [{ url: "/meta-og.jpg", width: 1200, height: 630, alt: "Retail margin calculator" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION, images: ["/meta-og.jpg"] },
};

// Blog cards — the site's real live posts, rendered with the site's own
// ListingCard so they match /blog exactly.
const BLOG_ITEMS: ListingItem[] = posts.slice(0, 3).map((p) => ({
  href: p.href,
  title: p.title,
  description: p.description,
  category: p.category,
  meta: [p.readTime],
}));

// Closing CTA — the homepage CtaSection design, with tool-specific copy.
const CTA: CtaSectionData = {
  heading: "Get the price right, then get on the shelf.",
  subheading:
    "Scout finds the right buyers, pitches them in your voice, and books your first two meetings — on us.",
  form: { buttonLabel: "Get my 2 free meetings", action: links.signup },
  buttonSubtext: "First 2 buyer meetings free",
  image: "",
  stats: [
    { icon: "truck", label: "70M+ places to get your product stocked" },
    { icon: "users", label: "Real buyer meetings, booked for you" },
    { icon: "shield-check", label: "First two meetings on us" },
  ],
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

function ToolJsonLd() {
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Retail Margin & Markup Calculator",
    url: CANONICAL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description: DESCRIPTION,
    publisher: { "@type": "Organization", name: "Agentworks", url: SITE },
  };
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE}/tools` },
      { "@type": "ListItem", position: 3, name: "Retail Margin Calculator", item: CANONICAL },
    ],
  };
  return (
    <>
      {[webApp, faqPage, breadcrumb].map((o, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(o) }} />
      ))}
    </>
  );
}

export default async function RetailMarginCalculatorPage() {
  let data;
  try {
    data = await getData();
  } catch {
    return (
      <Container className="py-20">
        <div className="mx-auto flex max-w-2xl items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
          <TriangleAlertIcon className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold">The database isn&apos;t running.</p>
            <p className="mt-1 text-muted-foreground">
              Start it with <code className="font-mono">docker compose up db</code>, then reload.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <ToolJsonLd />

      {/* Small white hero — just H1 + subheading */}
      <Container className="pt-10 pb-8 sm:pt-14 sm:pb-10">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Retail Margin &amp; Markup Calculator{" "}
            <span className="text-primary">for CPG</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
            See what your product needs to sell for on the shelf — after the distributor and the retailer
            each take their cut. Real numbers from 219 US retail chains.
          </p>
        </div>
      </Container>

      {/* The tool */}
      <Container className="pb-6">
        <Calculator data={data} />
      </Container>

      {/* FAQ — the site's own component */}
      <FaqSection
        badge="FAQ"
        heading="Retail pricing questions, answered"
        subheading="The questions CPG founders actually ask about margins, distributors and slotting."
        items={FAQ_ITEMS}
      />

      {/* About Agentworks Scout — full-width band */}
      <section className="border-y bg-muted/30 py-16 sm:py-20">
        <Container>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
              About Agentworks Scout
            </p>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
              This calculator is a free tool from{" "}
              <strong className="text-foreground">Agentworks Scout</strong> — an AI agent that helps CPG
              founders get their product onto more shelves. Scout finds the right independent-retail buyers
              near your customers, sends personalized outreach from your own Gmail, handles the
              back-and-forth, and books the meetings. The first two buyer meetings are on us. We built this
              because pricing for retail is where a lot of good brands quietly lose money — and the math
              shouldn&apos;t be a mystery.
            </p>
          </div>
        </Container>
      </section>

      {/* Read next — full-width blog cards (the site's ListingCard) */}
      <Container className="py-16 sm:py-20">
        <SectionHeader align="center" heading="Read next" className="mx-auto" />
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {BLOG_ITEMS.map((item) => (
            <ListingCard key={item.href} item={item} />
          ))}
        </div>
      </Container>

      {/* Closing CTA — the homepage design */}
      <CtaSection {...CTA} />

      <Container>
        <p className="mx-auto max-w-3xl pb-16 text-center text-xs leading-relaxed text-muted-foreground">
          Figures on this page are community estimates reported by brands across {data.retailers.length} US
          retail chains — not confirmed by the retailers or distributors named. Always confirm the real terms
          with your buyer. {siteConfig.name} Scout · a free tool.
        </p>
      </Container>
    </>
  );
}
