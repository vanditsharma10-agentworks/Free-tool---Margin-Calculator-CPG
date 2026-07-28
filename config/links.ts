/**
 * Outbound product-link registry — the single place that decides where every
 * "go to the app" call-to-action points. Consumers:
 *   1. Top-nav   · "Log in"        → links.login
 *   2. Top-nav   · "Get started"   → links.signup
 *   3. Hero      · "Get my 2 free meetings"      → links.signup
 *   4. Closing CTA · "Get my 2 free meetings"    → links.signup
 *   5. Footer    · "Get my 2 free meetings"      → links.signup
 *   6. Onboarding intro · closing slide          → links.signup
 * (The footer link columns reuse links.login / links.signup too.)
 *
 * The app is live, so these point at production. `COMING_SOON_PATH` is kept
 * exported for the still-present /coming-soon page.
 */

/** In-site holding page (no longer linked from the main CTAs). */
export const COMING_SOON_PATH = "/coming-soon";

export const links = {
  /** Top-nav "Log in" + footer "Log in" → the product app. */
  login: "https://app.getagentworks.com",

  /**
   * The signup target — shared by the top-nav "Get started", the hero, the
   * closing CTA, the footer, and the onboarding intro's closing slide.
   */
  signup: "https://app.getagentworks.com/signup",
} as const;

export type Links = typeof links;
