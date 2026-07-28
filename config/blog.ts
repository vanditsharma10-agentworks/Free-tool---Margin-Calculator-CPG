/**
 * Registry of blog posts (`/blog/*`) — the single source of truth for the blog
 * listing (`/blog`) and any nav/footer references. Add a post here when you ship
 * one, newest first, and add its `<loc>` to public/sitemap.xml.
 */

export type BlogPost = {
  /** URL slug segment under /blog/. */
  slug: string;
  /** Full route. */
  href: string;
  /** Post title (H1 / card title). */
  title: string;
  /** One–two line card summary. */
  description: string;
  /** Short category label (e.g. "Retail", "Guides"). */
  category: string;
  /** Byline. We publish under the team, not a fabricated person. */
  author: string;
  /** Publish date, ISO (YYYY-MM-DD). */
  date: string;
  /** Human read-time estimate, e.g. "12 min read". */
  readTime: string;
};

/** Newest first. */
export const posts: BlogPost[] = [
  {
    slug: "how-to-pitch-retail-buyers",
    href: "/blog/how-to-pitch-retail-buyers",
    title: "How to Pitch Retail Buyers (and Actually Get the Meeting)",
    description:
      "Who to pitch, the cold email that books a meeting, the line sheet, timing, follow-ups, and deliverability — the complete CPG playbook.",
    category: "Guides",
    author: "Agentworks team",
    date: "2026-07-23",
    readTime: "15 min read",
  },
  {
    slug: "how-to-find-retail-buyers",
    href: "/blog/how-to-find-retail-buyers",
    title: "How to Find (and Actually Reach) Retail Buyers for Your CPG Brand",
    description:
      "The stage-by-stage playbook: independent stores vs big chains, how to reach the real decision-maker, and how to run the outreach at scale.",
    category: "Guides",
    author: "Agentworks team",
    date: "2026-07-23",
    readTime: "12 min read",
  },
  {
    slug: "best-retail-outreach-software-for-cpg-brands",
    href: "/blog/best-retail-outreach-software-for-cpg-brands",
    title: "Best Retail Outreach Software for CPG Brands (2026)",
    description:
      "Split by the job you're actually doing — getting on shelves vs running the ones you've won — so you don't compare a cold-email tool to a shelf-audit app.",
    category: "Retail",
    author: "Agentworks team",
    date: "2026-07-22",
    readTime: "14 min read",
  },
];
