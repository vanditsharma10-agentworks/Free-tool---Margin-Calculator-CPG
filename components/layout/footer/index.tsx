import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/top-nav/logo";
// Import directly (not via the cta barrel) to avoid a layout↔cta cycle.
import { CtaButton } from "@/components/cta/cta-button";
import { siteConfig } from "@/config/site";
import { FooterNav } from "./footer-nav";
import { FooterSocials } from "./footer-socials";
import { FooterWordmark } from "./footer-wordmark";

/**
 * Site footer: brand + website CTA + socials + copyright on the left, link
 * columns on the right, and an oversized wordmark clipped at the bottom.
 */
export function Footer() {
  const { cta } = siteConfig.footer;

  return (
    <footer className="overflow-hidden border-t">
      <Container className="pt-16 md:pt-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.1fr_1.5fr] lg:gap-20">
          {/* Left: brand, website CTA, socials, copyright */}
          <div className="flex flex-col items-start gap-6">
            <Logo />
            <CtaButton
              label={cta.buttonLabel}
              href={cta.action}
              size="compact"
            />
            <div className="space-y-3">
              <FooterSocials />
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} {siteConfig.legalName}
              </p>
            </div>
          </div>

          {/* Right: link columns */}
          <FooterNav />
        </div>
      </Container>
      <FooterWordmark className="mt-16 px-[var(--container-padding)] md:mt-20" />
    </footer>
  );
}
