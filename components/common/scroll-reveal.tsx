"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from "motion/react";

import { cn } from "@/lib/utils";

/**
 * ScrollReveal — text that reveals word-by-word as the block scrolls up through
 * the viewport: each word fades from faint to solid and de-blurs, staggered by
 * index and scrubbed to scroll position. Same effect as the react-bits
 * ScrollReveal, but driven by `motion` (already a dependency) instead of GSAP.
 * Honors prefers-reduced-motion (renders fully revealed).
 *
 * `as` controls the rendered tag (defaults to "p"); pass `as="h2"` to use it as
 * an actual section heading. Pass a `className` with your own text size/weight
 * to override the defaults — later classes win via tailwind-merge.
 */

const BASE_OPACITY = 0.12;
const BLUR_PX = 4;
const REVEAL_SPAN = 0.4; // fraction of scroll progress each word takes to reveal

export function ScrollReveal({
  children,
  className,
  as: Tag = "p",
}: {
  children: string;
  className?: string;
  as?: "p" | "h2" | "h3";
}) {
  const containerRef = useRef<HTMLHeadingElement | HTMLParagraphElement>(null);
  const wordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const reduced = useReducedMotion();

  // Split into words, keeping whitespace tokens so spacing is preserved.
  const tokens = useMemo(() => children.split(/(\s+)/), [children]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.5"],
  });

  const apply = (p: number) => {
    const spans = wordRefs.current;
    const n = spans.length;
    const step = n > 1 ? (1 - REVEAL_SPAN) / (n - 1) : 0;
    spans.forEach((span, i) => {
      if (!span) return;
      const t = Math.max(0, Math.min(1, (p - i * step) / REVEAL_SPAN));
      span.style.opacity = String(BASE_OPACITY + (1 - BASE_OPACITY) * t);
      span.style.filter = t >= 1 ? "none" : `blur(${(1 - t) * BLUR_PX}px)`;
    });
  };

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!reduced) apply(p);
  });

  useEffect(() => {
    if (reduced) {
      wordRefs.current.forEach((span) => {
        if (span) {
          span.style.opacity = "1";
          span.style.filter = "none";
        }
      });
      return;
    }
    apply(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, tokens]);

  let wordIndex = 0;
  return (
    <Tag
      ref={containerRef as never}
      className={cn(
        "text-[clamp(1.75rem,4.2vw,3.5rem)] font-semibold leading-[1.25] tracking-tight text-balance",
        className,
      )}
    >
      {tokens.map((tok, i) => {
        if (/^\s+$/.test(tok)) return tok;
        const idx = wordIndex++;
        return (
          <span
            key={i}
            ref={(el) => {
              wordRefs.current[idx] = el;
            }}
            className="inline-block"
            style={{ opacity: BASE_OPACITY, filter: `blur(${BLUR_PX}px)` }}
          >
            {tok}
          </span>
        );
      })}
    </Tag>
  );
}
