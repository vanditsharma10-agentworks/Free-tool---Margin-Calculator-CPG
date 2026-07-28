import { ArrowRightIcon, ArrowUpRightIcon } from "lucide-react";
import { FAQ_ITEMS, RELATED_LINKS, SIGNUP_URL } from "@/lib/content";

/** Narrow reading column for prose sections (the tool itself runs wider). */
function Prose({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`mx-auto max-w-2xl ${className}`}>{children}</section>;
}

function ExtLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-moss underline underline-offset-2 hover:text-moss/80">
      {children}
    </a>
  );
}

export function Hero() {
  return (
    <div className="mx-auto max-w-2xl">
      <nav aria-label="Breadcrumb" className="mb-4 text-xs text-muted-foreground">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>Agentworks</li>
          <li aria-hidden>/</li>
          <li>Tools</li>
          <li aria-hidden>/</li>
          <li className="text-foreground">Retail Margin Calculator</li>
        </ol>
      </nav>
      <h1 className="font-heading text-[32px] leading-[1.1] font-semibold tracking-tight sm:text-[40px]">
        Retail Margin &amp; Markup Calculator{" "}
        <span className="text-moss">for CPG brands</span>
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground sm:text-base">
        Punch in your cost and see what your product really needs to sell for on the shelf — after the
        distributor and the retailer each take their cut. Built on what brands actually pay across{" "}
        <strong className="text-foreground">219 US retail chains</strong>, not a generic margin box.
      </p>
      <p className="mt-3 text-[13px] font-medium text-muted-foreground">
        Free · No signup · Nothing to download
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        By the Agentworks team · Retailer data reviewed{" "}
        <time dateTime="2026-07">July 2026</time>
      </p>
    </div>
  );
}

export function WhyMargin() {
  return (
    <Prose>
      <h2 className="font-heading text-[24px] font-semibold tracking-tight">
        Why your real margin isn&apos;t the sticker math
      </h2>
      <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
        <p>
          Most margin calculators do one sum: <code className="text-foreground">(price − cost) ÷ price</code>.
          That&apos;s not the number that decides whether a retail deal makes you money.
        </p>
        <p>
          Your product doesn&apos;t go cost → shelf. It goes{" "}
          <strong className="text-foreground">
            your cost → your wholesale price → the distributor&apos;s cut → the retailer&apos;s margin → the
            shelf price
          </strong>{" "}
          — and every layer moves depending on the channel and who carries you. A number that looks healthy
          on paper can leave you with very little once everyone&apos;s been paid.
        </p>
      </div>

      <blockquote className="my-6 border-l-2 border-moss/60 bg-muted/40 py-4 pr-4 pl-5 text-[15px] leading-relaxed">
        <p className="text-foreground">
          One founder pulled their KeHE MCB report and realized the distributor was taking a{" "}
          <strong>37% margin on their cost</strong> — not the cost-plus they&apos;d assumed. On a 50% MCB
          deal, that math meant an ~80% discount off list. The spread was always there; the paper margin
          just hid it.
        </p>
      </blockquote>

      <p className="text-[15px] leading-relaxed text-muted-foreground">
        That&apos;s the gap this calculator closes: it shows you the whole{" "}
        <strong className="text-foreground">margin waterfall</strong>, with real by-channel numbers, so
        you&apos;re not finding out after the PO.
      </p>
    </Prose>
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

export function Education() {
  return (
    <Prose>
      <h2 className="font-heading text-[24px] font-semibold tracking-tight">
        How retail margins actually work
      </h2>
      <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
        Short version, in plain terms — the four things that decide your take.
      </p>
      <div className="mt-6 space-y-5">
        {POINTS.map((p, i) => (
          <div key={i} className="flex gap-4">
            <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-moss/12 font-mono text-xs font-semibold text-moss">
              {i + 1}
            </span>
            <div>
              <h3 className="font-heading text-[16px] font-semibold">{p.h}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">{p.b}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
        Figures are verified industry benchmarks from{" "}
        <ExtLink href="https://www.settle.com/blog/navigating-distribution-and-retail-margins-for-cpg-brands">
          Settle
        </ExtLink>
        ,{" "}
        <ExtLink href="https://eightx.co/blog/cpg-retail-distribution-margins">Eightx</ExtLink>,{" "}
        <ExtLink href="https://www.trustcultivar.com/resources/healthy-gross-margin-cpg">Cultivar</ExtLink>{" "}
        and{" "}
        <ExtLink href="https://blog.inpractise.com/cpg-distribution-slotting-fees/">In Practise</ExtLink>.
        Your deal will vary — use the calculator with your own numbers.
      </p>
    </Prose>
  );
}

export function Faq() {
  return (
    <Prose>
      <h2 className="font-heading text-[24px] font-semibold tracking-tight">
        Retail pricing questions, answered
      </h2>
      <div className="mt-5 divide-y divide-border rounded-xl border">
        {FAQ_ITEMS.map((f, i) => (
          <details key={i} className="group px-4 py-1 open:bg-muted/20">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-3.5 font-heading text-[15px] font-semibold [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="grid size-5 shrink-0 place-items-center rounded-full border text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-4 text-[14px] leading-relaxed text-muted-foreground">{f.a}</p>
          </details>
        ))}
      </div>
    </Prose>
  );
}

export function RelatedReading() {
  return (
    <Prose>
      <h2 className="font-heading text-[24px] font-semibold tracking-tight">Keep reading</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {RELATED_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="group rounded-xl border bg-card p-4 transition-colors hover:border-moss/50"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-heading text-[15px] font-semibold group-hover:text-moss">{l.title}</h3>
              <ArrowUpRightIcon className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-moss" />
            </div>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{l.blurb}</p>
          </a>
        ))}
      </div>
    </Prose>
  );
}

export function AboutCta() {
  return (
    <Prose>
      <div className="rounded-2xl border border-moss/25 bg-linear-to-br from-moss/[0.08] to-transparent p-6 sm:p-8">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-moss uppercase">About Agentworks Scout</p>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          This calculator is a free tool from <strong className="text-foreground">Agentworks Scout</strong>{" "}
          — an AI agent that helps CPG founders get their product onto more shelves. Scout finds the right
          independent-retail buyers near your customers, sends personalized outreach from your own Gmail,
          handles the back-and-forth, and books the meetings. The first two buyer meetings are on us. We
          built this because pricing for retail is where a lot of good brands quietly lose money — and the
          math shouldn&apos;t be a mystery.
        </p>

        <div className="mt-6 border-t border-moss/20 pt-6">
          <h2 className="font-heading text-[20px] font-semibold tracking-tight sm:text-[22px]">
            Getting the price right is step one. Getting on the shelf is the rest.
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
            Let Agentworks Scout find and pitch the buyers for you — first two meetings free.
          </p>
          <a
            href={SIGNUP_URL}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-moss px-5 py-2.5 text-sm font-semibold text-moss-contrast shadow-sm transition-colors hover:bg-moss/90"
          >
            Try Agentworks Scout free
            <ArrowRightIcon className="size-4" />
          </a>
        </div>
      </div>
    </Prose>
  );
}
