import { CommunityBanner } from "./community-banner";
import { TopNav } from "./top-nav";
import { Main } from "./main";
import { Footer } from "./footer";

/**
 * App shell: a Slack promo banner, the top nav, a growing main region, and the
 * footer. Wrap page content with this once (in the root layout) and every route
 * inherits the chrome.
 */
export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <CommunityBanner />
      <TopNav />
      <Main>{children}</Main>
      <Footer />
    </>
  );
}
