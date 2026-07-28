import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

/**
 * Oversized brand wordmark anchored to the bottom of the footer and clipped
 * from below, so only the top portion of the letters shows. Decorative only
 * (hidden from assistive tech).
 */
export function FooterWordmark({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative select-none overflow-hidden text-[clamp(2.5rem,18vw,15rem)] leading-none",
        className,
      )}
    >
      <span className="absolute inset-x-0 -top-[0.1em] block whitespace-nowrap text-center font-bold tracking-tighter text-foreground">
        {siteConfig.name}
      </span>
      {/* Spacer sets the visible band height — the wordmark is clipped below it.
          0.53em ≈ a bit more than half showing. Larger = more visible. */}
      <div className="h-[0.53em]" />
    </div>
  );
}
