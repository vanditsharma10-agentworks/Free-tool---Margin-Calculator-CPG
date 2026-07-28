/** One entry in a magazine-style listing (blog post or solution page). */
export type ListingItem = {
  /** Destination route. */
  href: string;
  /** Card title. */
  title: string;
  /** One–two line summary. */
  description: string;
  /** Short category / type label shown as a pill. */
  category: string;
  /** Optional extra meta shown after the category (e.g. author, read time,
   *  date for blog posts). Rendered as `· a · b · c`. */
  meta?: string[];
};
