import { Fragment } from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export type Crumb = {
  label: string;
  /** Omit on the current (last) page. */
  href?: string;
};

/**
 * Visible breadcrumb trail (Home / Section / Page). Pair it with a
 * BreadcrumbList JSON-LD on the page so the visible trail and the structured
 * data match. The last crumb is the current page (no link, aria-current).
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("text-sm text-muted-foreground", className)}
    >
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <Fragment key={`${item.label}-${i}`}>
            {i > 0 ? <li aria-hidden="true">/</li> : null}
            <li>
              {item.href ? (
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground" aria-current="page">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}
