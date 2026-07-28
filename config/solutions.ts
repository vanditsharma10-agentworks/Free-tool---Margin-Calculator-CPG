/**
 * Registry of solution pages (`/solutions/*`) — the single source of truth for
 * the solutions listing hub (`/solutions`) and any nav/footer references. Add a
 * new solution page here when you ship one, and add its `<loc>` to
 * public/sitemap.xml.
 */

export type SolutionEntry = {
  /** URL slug segment under /solutions/. */
  slug: string;
  /** Full route. */
  href: string;
  /** Card title on the listing hub. */
  title: string;
  /** One-line card description. */
  description: string;
  /** Short type label shown as a pill on the listing card (e.g. "Software"). */
  category: string;
};

export const solutions: SolutionEntry[] = [
  {
    slug: "retail-outreach-software",
    href: "/solutions/retail-outreach-software",
    title: "Retail outreach software for CPG brands",
    description:
      "Find independent buyers, pitch them in your voice, and book meetings — the outreach runs itself.",
    category: "Software",
  },
];
