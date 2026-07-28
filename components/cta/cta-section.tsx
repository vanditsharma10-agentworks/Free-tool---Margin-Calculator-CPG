"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";

import { CtaButton } from "./cta-button";
import { fallbackIcon, iconMap } from "./icon-map";
import type { CtaSectionData } from "./types";

// Same mouse-reactive dot field as the hero, scoped to the card via its ref.
const AntigravityField = dynamic(
  () => import("@/components/hero/antigravity-field"),
  { ssr: false },
);

/**
 * Closing call-to-action: a wide, rounded black card (with small side gutters,
 * not edge-to-edge) holding the "antigravity" dot field reacting to the cursor
 * and the copy + CTA over the top. Data-driven from src/data/cta.json (the old
 * background photo is no longer used).
 */
export function CtaSection({
  heading,
  subheading,
  form,
  buttonSubtext,
  stats,
}: CtaSectionData) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  return (
    <section className="py-20 md:py-28">
      {/* Wide, rounded black card with small side gutters (Antigravity-style) —
          not edge-to-edge. */}
      <div className="mx-auto max-w-[1728px] px-4 sm:px-6 lg:px-10">
        <div
          ref={cardRef}
          className="relative isolate flex min-h-[560px] flex-col justify-center overflow-hidden rounded-3xl bg-black px-6 py-16 sm:min-h-[620px] sm:rounded-[2rem] sm:px-12 md:min-h-[720px] md:px-16 md:py-24 lg:min-h-[820px]"
        >
          {/* Mouse-reactive dots, confined to this card (eventSource = card). */}
          <AntigravityField sourceRef={cardRef} opacity={0.7} />

          <div className="relative z-10 grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          {/* Left: copy */}
          <div className="flex min-w-0 flex-col items-start gap-4 text-white">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl lg:text-6xl">
              {heading}
            </h2>
            <p className="max-w-md text-lg text-white/80 text-pretty">
              {subheading}
            </p>
            {stats.length ? (
              <ul className="mt-1 flex flex-col gap-2.5">
                {stats.map((stat) => {
                  const Icon = iconMap[stat.icon] ?? fallbackIcon;
                  return (
                    <li
                      key={stat.label}
                      className="flex items-center gap-2.5 text-white/85"
                    >
                      <Icon className="size-4 shrink-0 text-white/60" />
                      <span className="text-base">{stat.label}</span>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

            {/* Right: primary CTA button to the app */}
            <div className="flex w-full min-w-0 flex-col items-start lg:max-w-xl lg:translate-y-[15px] lg:items-end lg:justify-self-end">
              <CtaButton label={form.buttonLabel} href={form.action} />
              {buttonSubtext ? (
                <p className="mt-3 px-1 text-sm text-white/70">
                  {buttonSubtext}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
