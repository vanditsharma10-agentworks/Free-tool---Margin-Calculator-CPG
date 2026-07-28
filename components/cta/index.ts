// Public surface of the CTA module. (CtaSection is a homepage-only compound and
// isn't shipped in this standalone tool — it pulls hero-section deps we don't need.)
export { CtaStat } from "./cta-stat";
export { CtaButton } from "./cta-button";
export type { CtaSectionData, CtaStatItem } from "./types";
