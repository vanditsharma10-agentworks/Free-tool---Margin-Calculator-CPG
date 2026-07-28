"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Render a same-sized placeholder until mounted — the server doesn't know the
  // resolved theme, and swapping the icon after hydration would mismatch.
  if (!mounted) return <span className="size-9 shrink-0" aria-hidden />;

  const isDark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="grid size-9 shrink-0 place-items-center rounded-full border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
    </button>
  );
}
