"use client";

import { cn } from "@/lib/utils";
import type { WaterfallResult } from "@/lib/calc";

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Who keeps what, as one horizontal bar split into shares of the shelf price.
 * A single bar (rather than four rows) makes the split legible at a glance —
 * the point is the proportions, not the individual numbers.
 */
export function Waterfall({
  result,
  showDistributor,
}: {
  result: WaterfallResult;
  showDistributor: boolean;
}) {
  const shelf = result.shelf > 0 ? result.shelf : 1;

  const segs = [
    { key: "cogs", label: "Your cost", val: result.cogs, cls: "bg-fog" },
    { key: "profit", label: "Your profit", val: result.manufacturerProfit, cls: "bg-moss" },
    ...(showDistributor
      ? [{ key: "dist", label: "Distributor", val: result.distributorCut, cls: "bg-moss/55" }]
      : []),
    { key: "retail", label: "Store", val: result.retailerCut, cls: "bg-clay" },
  ].filter((s) => s.val > 0);

  return (
    <div>
      <div
        className="flex h-9 w-full gap-0.5 overflow-hidden rounded-lg"
        role="img"
        aria-label={`Shelf price ${money(result.shelf)} split between cost, your profit, distributor and store`}
      >
        {segs.map((s) => {
          const pct = (s.val / shelf) * 100;
          return (
            <div
              key={s.key}
              className={cn(
                "flex items-center justify-center rounded-[3px] transition-[width] duration-300 ease-out",
                s.cls
              )}
              style={{ width: `${pct}%` }}
              title={`${s.label}: ${money(s.val)} (${pct.toFixed(0)}%)`}
            >
              {pct >= 12 && (
                <span className="px-1 font-mono text-[10px] font-semibold text-white/95">
                  {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
        {segs.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5 text-[11px]">
            <span className={cn("size-2 rounded-[2px]", s.cls)} aria-hidden />
            <span className="text-muted-foreground">{s.label}</span>
            <span className="font-mono font-medium text-foreground tabular-nums">{money(s.val)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
