"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * A labelled numeric input with the unit rendered inside the field, so the user
 * never has to guess whether a box wants dollars or a percentage.
 *
 * Keeps its own text state while focused so intermediate values ("1.", "") do
 * not get coerced to 0 mid-typing — the parent only ever receives valid numbers.
 */
export function NumberField({
  label, hint, value, onChange, prefix, suffix, icon,
  step = 1, min, max, disabled,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (n: number) => void;
  prefix?: string;
  suffix?: string;
  icon?: React.ReactNode;
  step?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}) {
  const [draft, setDraft] = React.useState<string | null>(null);
  const shown = draft ?? String(value);

  function commit(raw: string) {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) {
      setDraft(null);
      return;
    }
    let v = n;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    onChange(v);
    setDraft(null);
  }

  return (
    <div className={cn(disabled && "opacity-55")}>
      <label className="block">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{hint}</span>
        )}
        <span
          className={cn(
            "mt-1.5 flex items-center gap-1 rounded-lg bg-muted/40 px-3 ring-1 ring-border transition-all",
            "focus-within:bg-card focus-within:ring-2 focus-within:ring-primary",
            disabled && "pointer-events-none"
          )}
        >
          {prefix && <span className="shrink-0 text-[13px] text-muted-foreground">{prefix}</span>}
          <input
            type="number"
            inputMode="decimal"
            className="w-full bg-transparent py-2 font-mono text-[15px] font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            value={shown}
            step={step}
            min={min}
            max={max}
            disabled={disabled}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => commit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
          />
          {suffix && <span className="shrink-0 text-[13px] text-muted-foreground">{suffix}</span>}
        </span>
      </label>
    </div>
  );
}
