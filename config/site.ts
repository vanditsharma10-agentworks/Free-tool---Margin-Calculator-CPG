/**
 * Site-wide configuration — the single source of truth for chrome content.
 * Layout components (TopNav, Footer, …) read from here so they stay thin and
 * presentational; updating navigation or branding is a one-file change.
 */

// Outbound product links (login / TAM / signup) live in one registry so the
// pre-launch "coming soon" hold is a single-file change. See src/config/links.ts.
import { links } from "@/config/links";

/** Community Slack invite (shared invite link). Single source of truth — used
 *  by the footer Slack icon and the /coming-soon "Join our Slack" card. */
export const SLACK_INVITE_URL =
  "https://join.slack.com/t/agentworks-workspace/shared_invite/zt-41v4jwrjk-RgSKiekpr101unzDOxAfJQ";

export type NavItem = {
  title: string;
  href: string;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

/** One link inside the Resources mega-menu (title + one-line description). */
export type ResourceLink = {
  title: string;
  href: string;
  description: string;
};

/** A labelled column of links in the Resources mega-menu. Empty groups are not
 *  rendered — so "Free tools" simply appears once its first item is added. */
export type ResourceMenuGroup = {
  title: string;
  items: ResourceLink[];
};

export const siteConfig = {
  name: "Agentworks",
  /** Legal entity name — shown in the footer copyright. */
  legalName: "RSV Intelliwave",
  /**
   * Site-wide description — feeds the homepage <meta description> (via the root
   * layout) AND the Organization JSON-LD schema. Keep it accurate to what Scout
   * actually does; ~160 chars max so it isn't truncated in search results.
   */
  description:
    "Scout by Agentworks is an AI agent that finds the right cafés, gyms, spas, and indie stores for your CPG brand, pitches them in your voice, and books meetings.",
  url: "https://www.getagentworks.com",

  /** Social share / Open Graph metadata (LinkedIn, Facebook, X). */
  og: {
    title: "Get on the right shelves | First 2 meetings free",
    description:
      "Stop cold-walking into stores. Get warm buyer meetings where your brand belongs.",
    image: "/meta-og.jpg",
    imageAlt: "Agentworks — get your product on the right shelves",
  },

  /** Top-level nav links shown as plain items in the top bar, alongside the
   *  Resources mega-menu. Intentionally empty — the top bar is kept minimal
   *  (Resources + auth only); homepage sections live in `sections` (mobile menu)
   *  and the footer. Add a top-level link here if one is ever needed. */
  nav: [] as NavItem[],

  /** Homepage in-page section anchors. Not shown as individual desktop nav
   *  links (the bar stays minimal); the MOBILE menu surfaces them as quick
   *  links and the footer links to them. "/#..." jumps to the section from ANY
   *  page (a bare "#..." only works while already on the homepage). */
  sections: [
    { title: "How it works", href: "/#how-it-works" },
    { title: "Integrations", href: "/#integrations" },
    { title: "Testimonials", href: "/#testimonials" },
    { title: "FAQ", href: "/#faq" },
  ] satisfies NavItem[],

  /**
   * The "Resources" mega-menu — Blog, Solutions, and (as they ship) free tools
   * and any future resource pages. Groups render as columns; an empty group is
   * skipped, so the menu starts compact (one column) and grows into the full
   * multi-column mega-menu as content is added. To add a resource, drop a link
   * into the right group here — nav + mobile menu pick it up automatically.
   */
  resources: {
    title: "Resources",
    groups: [
      {
        title: "Explore",
        items: [
          {
            title: "Blog",
            href: "/blog",
            description:
              "Guides, playbooks, and tools for building your CPG brand.",
          },
          {
            title: "Solutions",
            href: "/solutions",
            description:
              "Software that finds retail buyers and books your meetings.",
          },
        ],
      },
      {
        title: "Free tools",
        // Ships as we release tools, e.g.:
        // { title: "Retail margin calculator", href: "/tools/retail-margin-calculator",
        //   description: "Work out your wholesale and retail margins in seconds." }
        items: [],
      },
    ] satisfies ResourceMenuGroup[],
  },

  /**
   * App auth entry points. Destinations come from the central links registry
   * (src/config/links.ts) — currently held at /coming-soon pre-launch.
   */
  auth: {
    login: { title: "Log in", href: links.login },
    // Primary nav CTA — straight into the app signup.
    cta: {
      title: "Get started",
      href: links.signup,
    },
  } satisfies Record<"login" | "cta", NavItem>,

  /** Footer content: brand CTA + socials + grouped link columns. */
  footer: {
    /** The CTA button shown under the footer logo. */
    cta: {
      buttonLabel: "Get my 2 free meetings",
      action: links.signup,
    },
    /** Social links — icons are mapped by `name` in <FooterSocials>.
     *  TODO: replace the X placeholder with the real URL. */
    socials: [
      {
        name: "LinkedIn",
        href: "https://www.linkedin.com/company/agentworks-ai/",
      },
      { name: "X", href: "#" },
      { name: "Slack", href: SLACK_INVITE_URL },
    ] satisfies { name: string; href: string }[],
    columns: [
      {
        // Each column's `title` renders as a visible heading over its links.
        title: "Product",
        items: [
          { title: "Pricing", href: "/pricing" },
          { title: "Solutions", href: "/solutions" },
          { title: "Retail outreach software", href: "/solutions/retail-outreach-software" },
          { title: "For independent retail", href: "/independent-retail" },
        ],
      },
      {
        title: "Resources",
        items: [
          { title: "Blog", href: "/blog" },
          { title: "Find retail buyers", href: "/blog/how-to-find-retail-buyers" },
          { title: "Pitch retail buyers", href: "/blog/how-to-pitch-retail-buyers" },
          { title: "Best outreach software", href: "/blog/best-retail-outreach-software-for-cpg-brands" },
        ],
      },
      {
        title: "Explore",
        items: [
          { title: "How it works", href: "/#how-it-works" },
          { title: "Integrations", href: "/#integrations" },
          { title: "Testimonials", href: "/#testimonials" },
          { title: "FAQ", href: "/#faq" },
        ],
      },
      {
        title: "Company",
        items: [
          { title: "Sign up", href: links.signup },
          { title: "Log in", href: links.login },
          { title: "Community Slack", href: SLACK_INVITE_URL },
          { title: "Privacy Policy", href: "/privacy" },
          { title: "Terms of Use", href: "/terms" },
        ],
      },
    ] satisfies NavGroup[],
  },
} as const;

export type SiteConfig = typeof siteConfig;
