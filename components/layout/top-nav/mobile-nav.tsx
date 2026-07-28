"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { siteConfig, type NavItem } from "@/config/site";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { StarBorder } from "@/components/ui/star-border";
import { Container } from "@/components/layout/container";

/**
 * Small-screen navigation: a hamburger that opens a full-page overlay menu.
 * The icon morphs into an X, the panel fades up with the links easing in, page
 * scroll is locked while it's open, and it closes on link tap / Escape / the X.
 *
 * The overlay is portaled to <body> so it escapes the header's stacking +
 * backdrop-filter context and can truly cover the viewport. It sits just below
 * the header (z-40 vs the header's z-50) so the logo and this morphing button
 * stay visible and on top. Desktop is unaffected — the parent renders this with
 * `md:hidden`.
 */
export function MobileNav({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  // Client-only flag (SSR-safe, no effect setState) so the body portal is only
  // created in the browser, where document.body exists.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // While open: lock page scroll, trap focus, and wire Escape to close.
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        const items = panelRef.current?.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        );
        if (!items || items.length === 0) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const focusTimer = window.setTimeout(() => {
      panelRef.current
        ?.querySelector<HTMLElement>("[data-menu-first]")
        ?.focus();
    }, 0);

    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      window.clearTimeout(focusTimer);
    };
  }, [open]);

  const close = () => setOpen(false);
  const { auth } = siteConfig;
  // The mobile menu is a full nav (not just the desktop links), so it surfaces
  // the homepage in-page sections as quick links. Their "/#…" hrefs work from
  // any page (e.g. /privacy).
  const sectionLinks = siteConfig.sections;
  // The Resources destinations (Blog, Solutions, and tools as they ship) get
  // their own labelled group in the overlay.
  const resourceItems = siteConfig.resources.groups.flatMap((g) => g.items);
  // Rows: homepage sections (primary), the Resources group (label + links),
  // then Log in (secondary). A running index drives the cascade animation.
  type Row =
    | { kind: "label"; text: string }
    | { kind: "link"; item: NavItem; primary: boolean };
  const rows: Row[] = [
    ...sectionLinks.map((item) => ({ kind: "link" as const, item, primary: true })),
    ...(resourceItems.length
      ? [{ kind: "label" as const, text: siteConfig.resources.title }]
      : []),
    ...resourceItems.map((item) => ({
      kind: "link" as const,
      item: { title: item.title, href: item.href },
      primary: true,
    })),
    { kind: "link" as const, item: auth.login, primary: false },
  ];

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((o) => !o)}
        className="relative z-50 inline-flex size-11 items-center justify-center rounded-md text-foreground"
      >
        <MorphIcon open={open} />
      </button>

      {mounted &&
        createPortal(
          <div
            id="mobile-menu"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            inert={!open}
            className={cn(
              "fixed inset-0 z-40 bg-background transition-opacity duration-300 ease-out motion-reduce:transition-none",
              open ? "opacity-100" : "pointer-events-none opacity-0",
            )}
          >
            <Container className="flex h-full flex-col pb-10 pt-[calc(var(--header-height)+2rem)]">
              <nav className="flex flex-col">
                {rows.map((row, i) =>
                  row.kind === "label" ? (
                    <MenuLabel
                      key={`label-${row.text}`}
                      text={row.text}
                      open={open}
                      index={i}
                    />
                  ) : (
                    <MenuLink
                      key={row.item.href}
                      href={row.item.href}
                      onClick={close}
                      open={open}
                      index={i}
                      primary={row.primary}
                      first={i === 0}
                    >
                      {row.item.title}
                    </MenuLink>
                  ),
                )}
              </nav>

              <div
                className={cn(
                  "mt-auto pt-8 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                  open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                )}
                style={{
                  transitionDelay: open ? `${rows.length * 70 + 60}ms` : "0ms",
                }}
              >
                <a
                  href={auth.cta.href}
                  onClick={close}
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "relative isolate overflow-hidden h-12 w-full gap-1.5 rounded-xl bg-[#5E50EE] text-base text-white hover:bg-[#4A3FCB]",
                  )}
                >
                  <StarBorder />
                  <span className="relative z-10 inline-flex items-center gap-1.5">
                    {auth.cta.title}
                    <ArrowRight className="size-4" />
                  </span>
                </a>
              </div>
            </Container>
          </div>,
          document.body,
        )}
    </div>
  );
}

/** One menu row. Internal "/..." routes use Next's Link; hash + external links
 *  are plain anchors. Eases in (translate + fade) with a per-row delay. */
function MenuLink({
  href,
  children,
  onClick,
  open,
  index,
  primary,
  first,
}: {
  href: string;
  children: ReactNode;
  onClick: () => void;
  open: boolean;
  index: number;
  primary: boolean;
  first: boolean;
}) {
  const className = cn(
    "block border-b border-border/50 py-5 transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none",
    primary
      ? "text-3xl font-semibold tracking-tight text-foreground"
      : "text-2xl font-medium text-foreground/60",
    open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
  );
  const style = { transitionDelay: open ? `${index * 70 + 60}ms` : "0ms" };
  const extra = first ? { "data-menu-first": "" } : {};

  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className} style={style} onClick={onClick} {...extra}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} style={style} onClick={onClick} {...extra}>
      {children}
    </a>
  );
}

/** A small group heading (e.g. "Resources") in the mobile overlay. Eases in on
 *  the same cascade as the links; not focusable (it's not a link). */
function MenuLabel({
  text,
  open,
  index,
}: {
  text: string;
  open: boolean;
  index: number;
}) {
  return (
    <div
      className={cn(
        "pt-8 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-all duration-300 ease-out motion-reduce:transition-none motion-reduce:transform-none",
        open ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
      )}
      style={{ transitionDelay: open ? `${index * 70 + 60}ms` : "0ms" }}
    >
      {text}
    </div>
  );
}

/** Three lines that morph into an X. Positioned by `top` so the change
 *  animates smoothly; honours reduced-motion. */
function MorphIcon({ open }: { open: boolean }) {
  const line =
    "absolute left-0 h-0.5 w-full rounded-full bg-current transition-all duration-300 ease-out motion-reduce:transition-none";
  return (
    <span aria-hidden className="relative block h-4 w-5">
      <span className={cn(line, open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0")} />
      <span
        className={cn(
          line,
          "top-1/2 -translate-y-1/2",
          open ? "opacity-0" : "opacity-100",
        )}
      />
      <span
        className={cn(line, open ? "top-1/2 -translate-y-1/2 -rotate-45" : "top-[14px]")}
      />
    </span>
  );
}
