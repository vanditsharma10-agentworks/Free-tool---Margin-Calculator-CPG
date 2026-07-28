/** Shape of the data in src/data/faqs.json. */

export type FaqItemData = {
  /** Stable key + accordion item value. */
  id: string;
  question: string;
  answer: string;
};

export type FaqSectionData = {
  badge: string;
  heading: string;
  subheading: string;
  items: FaqItemData[];
};
