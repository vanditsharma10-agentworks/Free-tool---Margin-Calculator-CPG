import Link from "next/link";

import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

const linkClass =
  "block py-2 text-sm text-foreground/80 transition-colors hover:text-foreground";

/** The footer link columns, driven by siteConfig.footer.columns. Each column
 *  is a labelled group: a heading over its links.
 *
 *  Link type matters for smooth scrolling:
 *   - In-page anchors (e.g. /#how-it-works) render as a NATIVE <a>, so the
 *     global `scroll-behavior: smooth` applies. Next.js <Link> would scroll
 *     instantly and bypass it.
 *   - External URLs open in a new tab.
 *   - Plain internal routes (/privacy, /terms) use <Link> for client nav.
 */
export function FooterNav({ className }: { className?: string }) {
  return (
    <nav
      aria-label="Footer"
      className={cn("grid grid-cols-2 gap-x-8 gap-y-10 lg:grid-cols-4", className)}
    >
      {siteConfig.footer.columns.map((group) => (
        <div key={group.title}>
          <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {group.title}
          </h3>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const isExternal = item.href.startsWith("http");
              const isAnchor = item.href.includes("#");

              // Key by title, not href — multiple links can share one href while
              // the product is held at /coming-soon (e.g. TAM + Log in).
              return (
                <li key={item.title}>
                  {isAnchor || isExternal ? (
                    <a
                      href={item.href}
                      className={linkClass}
                      {...(isExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {item.title}
                    </a>
                  ) : (
                    <Link href={item.href} className={linkClass}>
                      {item.title}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
