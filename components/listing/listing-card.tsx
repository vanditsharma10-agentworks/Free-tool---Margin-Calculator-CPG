import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ListingItem } from "./types";

/**
 * One listing card. `featured` renders the large lead card (soft brand tint,
 * bigger title); the default is a compact grid card (soft neutral tint). Both
 * sit on the dot-grid backdrop, so their fills are opaque enough to read over
 * it. Card titles are H2 (the page H1 lives in <ListingHero>).
 */
export function ListingCard({
  item,
  featured = false,
  cta = "Read",
}: {
  item: ListingItem;
  featured?: boolean;
  cta?: string;
}) {
  return (
    <Link
      href={item.href}
      className={cn(
        "group flex flex-col rounded-2xl ring-1 ring-foreground/10 transition-colors hover:ring-primary/40",
        featured ? "gap-4 bg-secondary p-8 sm:p-10" : "gap-3 bg-card p-6",
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-muted-foreground">
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-primary">
          {item.category}
        </span>
        {item.meta?.map((m) => (
          <span key={m} className="inline-flex items-center gap-2">
            <span aria-hidden>·</span>
            <span>{m}</span>
          </span>
        ))}
      </div>

      <h2
        className={cn(
          "font-semibold tracking-tight text-balance text-foreground",
          featured
            ? "text-2xl sm:text-3xl md:text-4xl"
            : "text-lg leading-snug",
        )}
      >
        {item.title}
      </h2>

      <p
        className={cn(
          "text-muted-foreground text-pretty",
          featured ? "max-w-2xl text-base sm:text-lg" : "text-sm",
        )}
      >
        {item.description}
      </p>

      <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-primary">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
