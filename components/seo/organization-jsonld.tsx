import { siteConfig } from "@/config/site";

/**
 * Organization JSON-LD — structured data describing the Agentworks brand entity
 * for search engines and AI crawlers, powering Knowledge Graph / entity
 * recognition (see docs/decisions and the SEO research notes).
 *
 * Rendered as a plain server-side <script type="application/ld+json"> (NOT via
 * next/script) on purpose: it must land in the initial HTML response so crawlers
 * that don't execute JavaScript — GPTBot, ClaudeBot, PerplexityBot — can read it.
 * Injecting it client-side (the way Clarity/PostHog load) would hide it from
 * exactly that audience. This is a Server Component, so the tag is emitted at
 * request/build time with no client JS.
 *
 * All values are sourced from `siteConfig` so this stays a single source of
 * truth — updating the config updates the schema.
 */

// Only real, canonical brand-identity profiles belong in `sameAs`; a wrong or
// placeholder value actively MISATTRIBUTES the entity to Google (a documented
// failure mode). So we allowlist identity profiles and require a real http(s)
// URL — this excludes the Slack link (an invite, not an identity profile) and
// drops the X link while it's still a "#" placeholder. When X becomes a real
// URL it will be picked up automatically.
const IDENTITY_SOCIAL_NAMES = new Set(["LinkedIn", "X"]);

function buildSameAs(): string[] {
  return siteConfig.footer.socials
    .filter(
      (s) => IDENTITY_SOCIAL_NAMES.has(s.name) && s.href.startsWith("http"),
    )
    .map((s) => s.href);
}

export function OrganizationJsonLd() {
  const sameAs = buildSameAs();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: siteConfig.legalName,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon.png`,
    description: siteConfig.description,
    // Omit `sameAs` entirely rather than emit an empty array if no real
    // identity profiles are configured.
    ...(sameAs.length > 0 ? { sameAs } : {}),
  };

  return (
    <script
      type="application/ld+json"
      // Next.js' recommended JSON-LD pattern: stringify, then replace every
      // less-than character with its unicode escape so no string value can
      // break out of the script tag (XSS hardening).
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
      }}
    />
  );
}
