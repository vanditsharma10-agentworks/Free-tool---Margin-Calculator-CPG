/**
 * Page copy data shared between the visible sections and the JSON-LD schema, so
 * the FAQ answers a crawler sees in FAQPage schema are byte-identical to what a
 * human reads on the page. Copy source of truth: the SEO repo,
 * content-log/retail-margin-calculator/copy.md.
 */

/** The live product site. The tool merges into it later; links are absolute so
 * they're correct on the destination and in schema. */
export const SITE = "https://www.getagentworks.com";
export const PATH = "/tools/retail-margin-calculator";
export const CANONICAL = `${SITE}${PATH}`;

/** Site FAQ shape ({ id, question, answer }) so it drops straight into the
 * website's <FaqSection>; the same array feeds the FAQPage JSON-LD. */
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: "typical-margin",
    question: "What's a typical retailer margin for wellness or protein bars?",
    answer:
      "It depends on the channel. Conventional grocery usually wants ~22–30%; natural and specialty retailers run ~40–50%+. Pick your actual retailer in the calculator and it fills in what brands report for that chain.",
  },
  {
    id: "sprouts-wfm",
    question: "What retail margin do Sprouts and Whole Foods expect?",
    answer:
      "Both sit in the natural/specialty band — roughly 40–50%. In the calculator, choosing Sprouts or a Whole Foods–type natural retailer pre-fills its reported margin so you can price backwards from the shelf.",
  },
  {
    id: "slotting-per-store",
    question: "Is a $1,000 slotting fee per SKU — or per store?",
    answer:
      "Usually per SKU, per store — which is exactly what makes it dangerous. Most chains run ~$50–$300 per SKU per store; big national banners can hit $250–$1,000+ per item. The calculator multiplies it out across your store count and SKUs so you see the real number before you commit.",
  },
  {
    id: "distributor-markup",
    question: "What markup does a regional distributor want — 15%?",
    answer:
      "Most distributors want ~15–25%, and push toward the top of that on low-volume independent drops where the delivery economics are worse. You can set the exact number in the tool.",
  },
  {
    id: "freight-in-cogs",
    question: 'When people say "50% gross margin," do you factor freight into COGS?',
    answer:
      "Yes — freight belongs in your landed cost. And even a clean 50% gross margin isn't the finish line: after distributor margin, retailer margin, slotting and trade spend, your contribution margin often lands ~10–20% of the shelf price. That's the number worth protecting.",
  },
  {
    id: "tpr-billback-scan",
    question: "What's the difference between a TPR, a billback, and a scan promo?",
    answer:
      "A TPR (temporary price reduction) is a short-term shelf-price cut you fund; a billback bills you after the fact for an agreed discount or fee; a scan promo pays the retailer per unit scanned at the register. All three are trade spend — money off your margin — so budget them in, not around.",
  },
  {
    id: "margin-vs-markup",
    question: "Is a 20% margin the same as a 25% markup?",
    answer:
      "Yes — they're the same deal described from two sides. Margin is a share of the selling price; markup is a share of your cost. A $10 item that cost $8 has a 20% margin ($2 ÷ $10) and a 25% markup ($2 ÷ $8). The converter in the tool flips between them so you never quote the wrong one.",
  },
  {
    id: "calc-retail-margin",
    question: "How do you calculate retail margin?",
    answer:
      "Retail margin = (retail price − cost) ÷ retail price. A $5 item that cost $3 has a $2 margin, or 40%. For CPG that cost should be your landed cost (including freight), and retail margin is just one layer — the calculator stacks it with the distributor's cut and slotting to show your real take.",
  },
  {
    id: "sources",
    question: "Where do your numbers come from?",
    answer:
      "They're community estimates — figures brands report paying across 219 US retail chains, not confirmed by the retailers or distributors themselves. When a specific chain hasn't reported something, the tool says so and uses a channel average. Always confirm the real terms with your buyer.",
  },
];

export interface RelatedLink {
  title: string;
  href: string;
  blurb: string;
  planned?: boolean;
}

// Absolute URLs on the destination site. Planned pages resolve once that
// cluster ships (forward-linking was the chosen approach); live ones work now.
export const RELATED_LINKS: RelatedLink[] = [
  {
    title: "Retail margins, slotting & pricing for CPG",
    href: `${SITE}/blog/retail-margins-slotting-pricing-cpg`,
    blurb: "The full pillar — how every layer of the margin waterfall works.",
    planned: false,
  },
  {
    title: "Distributors, brokers, KeHE & UNFI",
    href: `${SITE}/guides/distributors-brokers-for-cpg`,
    blurb: "When to bring on a distributor, and what their cut really costs.",
    planned: true,
  },
  {
    title: "How to find (and reach) retail buyers",
    href: `${SITE}/blog/how-to-find-retail-buyers`,
    blurb: "Where buyer contacts actually come from, and how to reach them.",
  },
  {
    title: "How to pitch retail buyers",
    href: `${SITE}/blog/how-to-pitch-retail-buyers`,
    blurb: "The pitch and follow-up that gets the meeting booked.",
  },
];
