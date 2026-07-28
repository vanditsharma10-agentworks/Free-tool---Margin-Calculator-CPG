"use client";

import { useState } from "react";

import { Container } from "@/components/layout";
import { Breadcrumbs, type Crumb } from "@/components/common/breadcrumbs";
import { ListingCard } from "./listing-card";
import type { ListingItem } from "./types";

/** How many grid cards (after the featured one) to show before "Load more". */
const PAGE = 6;

/**
 * The listing body: the ambient dot-grid texture, then the cards, scaled to
 * however much content exists —
 *   0 items → a quiet empty state,
 *   1 item  → just the large featured card,
 *   2+      → featured card + a responsive card grid,
 *   > PAGE  → a client-side "Load more" (real numbered pagination + routes is a
 *             later concern, once there's enough content to warrant it).
 * No empty slots, no placeholder cards.
 */
export function ListingGrid({
  items,
  cta = "Read",
  emptyText = "New resources are on their way.",
  breadcrumbs,
}: {
  items: ListingItem[];
  cta?: string;
  emptyText?: string;
  breadcrumbs?: Crumb[];
}) {
  const [shown, setShown] = useState(PAGE);

  if (items.length === 0) {
    return (
      <ListingSection>
        <Container className="flex flex-col items-center gap-8">
          {breadcrumbs ? (
            <Breadcrumbs items={breadcrumbs} className="self-start" />
          ) : null}
          <p className="max-w-md rounded-2xl bg-card px-6 py-12 text-center text-muted-foreground ring-1 ring-foreground/10">
            {emptyText}
          </p>
        </Container>
      </ListingSection>
    );
  }

  const [featured, ...rest] = items;
  const gridItems = rest.slice(0, shown);
  const hasMore = rest.length > shown;

  return (
    <ListingSection>
      <Container className="flex flex-col gap-6">
        {breadcrumbs ? <Breadcrumbs items={breadcrumbs} /> : null}
        <ListingCard item={featured} featured cta={cta} />

        {gridItems.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {gridItems.map((item) => (
              <ListingCard key={item.href} item={item} cta={cta} />
            ))}
          </div>
        ) : null}

        {hasMore ? (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setShown((n) => n + PAGE)}
              className="rounded-full border border-border bg-card px-6 py-3 text-sm font-medium ring-1 ring-foreground/10 transition-colors hover:bg-muted"
            >
              Load more
            </button>
          </div>
        ) : null}
      </Container>
    </ListingSection>
  );
}

/** Shared shell: the drifting dot-grid behind the cards. No opaque background —
 *  the section is transparent so the `-z-10` dot layer shows through against the
 *  page (an opaque bg would paint over it, since `relative` alone makes no
 *  stacking context). Matches the homepage market section. */
function ListingSection({ children }: { children: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div
        aria-hidden
        className="dot-grid-bg pointer-events-none absolute inset-0 -z-10"
      />
      {children}
    </section>
  );
}
