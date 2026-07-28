/** Shape of the data in src/data/cta.json. */

export type CtaStatItem = {
  /** Key into the icon map (see icon-map.ts). */
  icon: string;
  label: string;
};

export type CtaSectionData = {
  heading: string;
  subheading: string;
  /** The primary CTA button to the app. */
  form: {
    buttonLabel: string;
    /** Destination — the product app signup (injected in page.tsx). */
    action: string;
  };
  /** Small reassurance line under the button. */
  buttonSubtext?: string;
  /** Background image URL for the CTA card. */
  image: string;
  /** Data points (currently not rendered in the card layout). */
  stats: CtaStatItem[];
};
