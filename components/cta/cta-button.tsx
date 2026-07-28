import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StarBorder } from "@/components/ui/star-border";

type CtaButtonProps = {
  /** Visible button text. */
  label: string;
  /** Destination — the product app (login / signup). */
  href: string;
  className?: string;
  /** "compact" renders a slimmer button — used in the footer. */
  size?: "default" | "compact";
  /** Fires on click (e.g. the intro's mark-seen + analytics) before navigation. */
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

/**
 * Primary "go to the app" call-to-action, rendered as a link styled like the
 * app's submit button. Replaces the old website-capture form now that the app
 * collects the website itself during onboarding — this just points at signup.
 */
export function CtaButton({
  label,
  href,
  className,
  size = "default",
  onClick,
}: CtaButtonProps) {
  const compact = size === "compact";

  return (
    <a
      href={href}
      onClick={onClick}
      className={cn(
        buttonVariants({ size: "lg" }),
        "relative isolate shrink-0 overflow-hidden rounded-lg bg-[#5E50EE] text-white hover:bg-[#4A3FCB]",
        compact ? "h-11 px-4 text-sm sm:h-10" : "h-12 px-6 text-base",
        className,
      )}
    >
      <StarBorder />
      <span className="relative z-10">{label}</span>
    </a>
  );
}
