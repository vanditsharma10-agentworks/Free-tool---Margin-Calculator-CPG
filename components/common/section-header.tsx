import { cn } from "@/lib/utils";
import { ScrollReveal } from "./scroll-reveal";

export type SectionHeaderProps = {
  /** Optional pill above the heading (e.g. "FAQs"). */
  badge?: string;
  heading: string;
  subheading?: string;
  align?: "center" | "left";
  className?: string;
  /** Reveal the heading word-by-word as it scrolls into view. */
  revealOnScroll?: boolean;
};

const HEADING_CLASSNAME =
  "max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl";

/**
 * Shared section header: optional badge + heading + subheading. Reusable across
 * sections (FAQ, testimonials, …) via the `align` and `badge` props. Set
 * `revealOnScroll` to animate the heading word-by-word as it scrolls into view
 * (see <ScrollReveal>).
 */
export function SectionHeader({
  badge,
  heading,
  subheading,
  align = "center",
  className,
  revealOnScroll = false,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-5",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className,
      )}
    >
      {badge ? (
        <span className="rounded-lg bg-muted/60 px-3 py-1 text-sm font-medium text-muted-foreground">
          {badge}
        </span>
      ) : null}
      {revealOnScroll ? (
        <ScrollReveal as="h2" className={HEADING_CLASSNAME}>
          {heading}
        </ScrollReveal>
      ) : (
        <h2 className={HEADING_CLASSNAME}>{heading}</h2>
      )}
      {subheading ? (
        <p className="max-w-xl text-base text-muted-foreground text-pretty">
          {subheading}
        </p>
      ) : null}
    </div>
  );
}
