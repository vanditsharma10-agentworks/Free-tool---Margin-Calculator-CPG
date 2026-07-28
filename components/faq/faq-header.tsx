import { cn } from "@/lib/utils";

export type FaqHeaderProps = {
  badge: string;
  heading: string;
  subheading: string;
  className?: string;
};

/** Centered section header: badge pill + heading + subheading. */
export function FaqHeader({
  badge,
  heading,
  subheading,
  className,
}: FaqHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-5 text-center", className)}>
      <span className="rounded-lg bg-muted/60 px-3 py-1 text-sm font-medium text-muted-foreground">
        {badge}
      </span>
      <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
        {heading}
      </h2>
      <p className="max-w-xl text-base text-muted-foreground text-pretty">
        {subheading}
      </p>
    </div>
  );
}
