import { ArrowRight } from "lucide-react";

import { siteConfig } from "@/config/site";
import { buttonVariants } from "@/components/ui/button";
import { StarBorder } from "@/components/ui/star-border";
import { cn } from "@/lib/utils";

/**
 * Auth actions for the top nav: a ghost "Log in" and the primary CTA ("Calculate
 * your TAM"). Both point at the external product app (`siteConfig.auth`), so
 * they're plain anchors rather than Next.js links.
 */
export function AuthButtons({ className }: { className?: string }) {
  const { login, cta } = siteConfig.auth;

  return (
    <div className={cn("items-center gap-2", className)}>
      <a href={login.href} className={cn(buttonVariants({ variant: "ghost" }))}>
        {login.title}
      </a>
      <a
        href={cta.href}
        className={cn(
          buttonVariants({ size: "lg" }),
          // Bigger than the ghost Log in, with the hero button's purple theme.
          "relative isolate overflow-hidden h-10 gap-1.5 px-5 text-sm bg-[#5E50EE] text-white hover:bg-[#4A3FCB]",
        )}
      >
        <StarBorder />
        <span className="relative z-10 inline-flex items-center gap-1.5">
          {cta.title}
          <ArrowRight />
        </span>
      </a>
    </div>
  );
}
