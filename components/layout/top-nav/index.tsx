"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import { Container } from "@/components/layout/container";
import { Logo } from "./logo";
import { NavLinks } from "./nav-links";
import { AuthButtons } from "./auth-buttons";
import { MobileNav } from "./mobile-nav";

/**
 * Site header. At the very top of the page it sits flush with the content —
 * transparent, no border. Once the user scrolls past a small threshold it
 * detaches into a floating, blurred pill that animates in. Sticky so it stays
 * in view; the flush/floating swap is purely a styling transition driven by
 * scroll position.
 */
export function TopNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll(); // sync initial state (e.g. on reload mid-page)
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Wrapper handles the "detach" — gains a top gap and side inset on scroll. */}
      <div
        className={cn(
          "transition-[margin,padding] duration-300 ease-out motion-reduce:transition-none",
          scrolled ? "mt-3 px-3 sm:px-4" : "mt-0 px-0",
        )}
      >
        {/* Container is the bar itself — border/background/shadow fade in on scroll. */}
        <Container
          className={cn(
            "flex h-[var(--header-height)] items-center justify-between gap-4 rounded-2xl border transition-[background-color,border-color,box-shadow] duration-300 ease-out motion-reduce:transition-none",
            scrolled
              ? "border-border/60 bg-background/70 shadow-lg backdrop-blur-md supports-[backdrop-filter]:bg-background/60"
              : "border-transparent bg-transparent shadow-none",
          )}
        >
          <Logo />
          {/* Right side: menu items sit just before the auth buttons. */}
          <div className="flex items-center gap-1">
            <NavLinks className="hidden md:flex" />
            <AuthButtons className="hidden md:flex" />
            <MobileNav className="md:hidden" />
          </div>
        </Container>
      </div>
    </header>
  );
}
