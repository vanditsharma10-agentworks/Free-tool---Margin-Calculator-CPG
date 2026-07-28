"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { SLACK_INVITE_URL } from "@/config/site";

/**
 * Slim promo bar above the top nav inviting visitors into the Slack community.
 *
 * Dismissible for the current page view only — the open/closed flag lives in
 * component state (no localStorage), so the banner returns on the next load.
 * Per design: only the CTA is a link; the rest of the bar is static text. It
 * sits in normal flow above the sticky <TopNav>, so it scrolls away as the nav
 * detaches into its floating pill.
 */
export function CommunityBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="relative z-50 w-full bg-[#5E50EE] text-white">
      <div className="mx-auto flex max-w-container items-center justify-center gap-2 px-10 py-2 text-center text-sm">
        {/* Slack glyph (matches the footer + coming-soon icons). */}
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="hidden size-4 shrink-0 sm:block"
          aria-hidden
        >
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
        </svg>
        <p className="text-pretty">
          Getting your product on the right shelves? Meet the founders doing it.{" "}
          <a
            href={SLACK_INVITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold whitespace-nowrap underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            Join our Slack &rarr;
          </a>
        </p>
      </div>

      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label="Dismiss announcement"
        className="absolute right-2 top-1/2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
