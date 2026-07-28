import { CANONICAL, SITE, FAQ_ITEMS } from "@/lib/content";

/**
 * Server-rendered JSON-LD: WebApplication (the tool) + FAQPage (the Q&As) +
 * BreadcrumbList. Emitted in the static HTML so crawlers and AI engines read it
 * without running JS (house-style rule).
 */
export function Schema() {
  const webApp = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Retail Margin & Markup Calculator",
    url: CANONICAL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Free retail margin and markup calculator for CPG brands. Model the full cost-to-shelf waterfall — your cost, wholesale, distributor markup, retailer margin and slotting — with real figures from 219 US retail chains.",
    publisher: { "@type": "Organization", name: "Agentworks", url: SITE },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE}/` },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE}/tools` },
      {
        "@type": "ListItem",
        position: 3,
        name: "Retail Margin Calculator",
        item: CANONICAL,
      },
    ],
  };

  return (
    <>
      {[webApp, faqPage, breadcrumb].map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </>
  );
}
