import type { Metadata } from "next";
import { TriangleAlertIcon, ArrowUpRightIcon } from "lucide-react";

import { Container } from "@/components/layout";
import { Breadcrumbs, type Crumb } from "@/components/common/breadcrumbs";
import { SectionHeader } from "@/components/common/section-header";
import { FaqSection } from "@/components/faq";
import { CtaButton } from "@/components/cta/cta-button";
import { Calculator } from "@/components/Calculator";
import { links } from "@/config/links";
import { siteConfig } from "@/config/site";
import { CANONICAL, PATH, SITE, FAQ_ITEMS, RELATED_LINKS } from "@/lib/content";
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

const CRUMBS: Crumb[] = [
  { label: "Home", href: "/" },
  { label: "Tools", href: "/tools" },
  { label: "Retail Margin Calculator" },
];

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

const POINTS = [
  {
    h: "Keystone is the baseline, not the rule",
    b: '"Keystone" means doubling the cost at each step: you → wholesale, wholesale → retail. That\'s a 100% markup, or a 50% margin, at each stage. Handy shorthand, but most CPG deals don\'t run clean keystone.',
  },
  {
    h: "Retailer margin swings hard by channel",
    b: "Conventional center-store grocery usually wants ~22–30%. Natural and specialty (Whole Foods, Sprouts, and the like) run ~40–50%+. Same product, very different shelf price to hold the same take.",
  },
  {
    h: "The distributor takes a cut too — usually ~15–25%",
    b: "Go through KeHE or UNFI and they mark up on the way to the retailer. Sell direct and you skip that layer, but you take on the cost of doing the distributor's job — freight, warehousing, delivery — which is why direct isn't free.",
  },
  {
    h: "Then slotting and trade spend quietly eat the rest",
    b: "Slotting runs roughly $50–$300 per SKU per store at most chains, and $250–$1,000 per item at big national banners. Trade spend is commonly planned at 15–20% of sales. Which is why the number that matters isn't gross margin — it's your contribution margin after every channel cost, often ~10–20% of the shelf price.",
  },
];

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
      {children}
    </a>
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
              Start it with{" "}
              <code className="font-mono">docker compose up db</code>, then reload.
            </p>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <>
      <ToolJsonLd />

      <Container className="py-10 sm:py-14">
        {/* Hero */}
        <div className="mx-auto max-w-3xl">
          <Breadcrumbs items={CRUMBS} className="mb-5" />
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Retail Margin &amp; Markup Calculator{" "}
            <span className="text-primary">for CPG brands</span>
          </h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground text-pretty sm:text-lg">
            Punch in your cost and see what your product really needs to sell for on the shelf — after the
            distributor and the retailer each take their cut. Built on what brands actually pay across{" "}
            <strong className="text-foreground">219 US retail chains</strong>, not a generic margin box.
          </p>
          <p className="mt-3 text-sm font-medium text-muted-foreground">
            Free · No signup · Nothing to download ·{" "}
            <span className="text-muted-foreground/80">
              By the Agentworks team · Data reviewed <time dateTime="2026-07">July 2026</time>
            </span>
          </p>
        </div>

        {/* The tool — a standalone block, not merged into the copy */}
        <div className="mt-10">
          <Calculator data={data} />
        </div>
      </Container>

      {/* Why real margin ≠ sticker math */}
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            align="left"
            heading="Why your real margin isn't the sticker math"
            className="mb-6"
          />
          <div className="space-y-4 text-base leading-relaxed text-muted-foreground">
            <p>
              Most margin calculators do one sum:{" "}
              <code className="text-foreground">(price − cost) ÷ price</code>. That&apos;s not the number
              that decides whether a retail deal makes you money.
            </p>
            <p>
              Your product doesn&apos;t go cost → shelf. It goes{" "}
              <strong className="text-foreground">
                your cost → your wholesale price → the distributor&apos;s cut → the retailer&apos;s margin →
                the shelf price
              </strong>{" "}
              — and every layer moves depending on the channel and who carries you. A number that looks
              healthy on paper can leave you with very little once everyone&apos;s been paid.
            </p>
          </div>

          <blockquote className="my-6 border-l-2 border-primary/60 bg-muted/50 py-4 pr-4 pl-5 text-base leading-relaxed text-foreground">
            One founder pulled their KeHE MCB report and realized the distributor was taking a{" "}
            <strong>37% margin on their cost</strong> — not the cost-plus they&apos;d assumed. On a 50% MCB
            deal, that math meant an ~80% discount off list. The spread was always there; the paper margin
            just hid it.
          </blockquote>

          <p className="text-base leading-relaxed text-muted-foreground">
            That&apos;s the gap this calculator closes: it shows you the whole{" "}
            <strong className="text-foreground">margin waterfall</strong>, with real by-channel numbers, so
            you&apos;re not finding out after the PO.
          </p>
        </div>
      </Container>

      {/* Education */}
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeader
            align="left"
            heading="How retail margins actually work"
            subheading="Short version, in plain terms — the four things that decide your take."
            className="mb-8"
          />
          <div className="space-y-6">
            {POINTS.map((p, i) => (
              <div key={i} className="flex gap-4">
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold">{p.h}</h3>
                  <p className="mt-1 text-base leading-relaxed text-muted-foreground">{p.b}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Figures are verified industry benchmarks from{" "}
            <ExtLink href="https://www.settle.com/blog/navigating-distribution-and-retail-margins-for-cpg-brands">
              Settle
            </ExtLink>
            , <ExtLink href="https://eightx.co/blog/cpg-retail-distribution-margins">Eightx</ExtLink>,{" "}
            <ExtLink href="https://www.trustcultivar.com/resources/healthy-gross-margin-cpg">Cultivar</ExtLink>{" "}
            and <ExtLink href="https://blog.inpractise.com/cpg-distribution-slotting-fees/">In Practise</ExtLink>.
            Your deal will vary — use the calculator with your own numbers.
          </p>
        </div>
      </Container>

      {/* FAQ — the site's own component */}
      <FaqSection
        badge="FAQ"
        heading="Retail pricing questions, answered"
        subheading="The questions CPG founders actually ask about margins, distributors and slotting."
        items={FAQ_ITEMS}
      />

      {/* Related reading */}
      <Container className="py-12 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <SectionHeader align="left" heading="Keep reading" className="mb-6" />
          <div className="grid gap-3 sm:grid-cols-2">
            {RELATED_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold group-hover:text-primary">{l.title}</h3>
                  <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{l.blurb}</p>
              </a>
            ))}
          </div>
        </div>
      </Container>

      {/* About + CTA */}
      <Container className="pt-4 pb-20 sm:pb-28">
        <div className="mx-auto max-w-2xl rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-10">
          <p className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">About Agentworks Scout</p>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            This calculator is a free tool from <strong className="text-foreground">Agentworks Scout</strong>{" "}
            — an AI agent that helps CPG founders get their product onto more shelves. Scout finds the right
            independent-retail buyers near your customers, sends personalized outreach from your own Gmail,
            handles the back-and-forth, and books the meetings. The first two buyer meetings are on us. We
            built this because pricing for retail is where a lot of good brands quietly lose money — and the
            math shouldn&apos;t be a mystery.
          </p>
          <div className="mt-7 border-t border-primary/15 pt-7">
            <h2 className="text-2xl font-semibold tracking-tight text-balance">
              Getting the price right is step one. Getting on the shelf is the rest.
            </h2>
            <p className="mt-2 text-base leading-relaxed text-muted-foreground">
              Let Agentworks Scout find and pitch the buyers for you — first two meetings free.
            </p>
            <CtaButton label="Get my 2 free meetings" href={links.signup} className="mt-6" />
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-xs leading-relaxed text-muted-foreground">
          Figures on this page are community estimates reported by brands across {data.retailers.length} US
          retail chains — not confirmed by the retailers or distributors named. They&apos;re a starting
          point; always confirm the real terms with your buyer. {siteConfig.name} Scout · a free tool.
        </p>
      </Container>
    </>
  );
}
