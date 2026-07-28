"use client";

import type { WaterfallResult } from "@/lib/calc";

/**
 * Stacked price waterfall: each bar's width is its share of the final shelf
 * price, so you can see at a glance who keeps what.
 */
export default function Waterfall({
  result,
  showDistributor = true,
}: {
  result: WaterfallResult;
  showDistributor?: boolean;
}) {
  const shelf = result.shelf || 1;
  const segments = [
    { label: "Your cost", val: result.cogs, color: "#8a8aa0" },
    { label: "Your profit", val: result.manufacturerProfit, color: "#5e50ee" },
    ...(showDistributor
      ? [{ label: "Distributor's cut", val: result.distributorCut, color: "#8b7ff0" }]
      : []),
    { label: "Store's cut", val: result.retailerCut, color: "#b7aef7" },
  ];

  return (
    <div className="waterfall">
      {segments.map((s) => {
        const pct = Math.max(0, (s.val / shelf) * 100);
        return (
          <div className="bar-row" key={s.label}>
            <div className="bar-label">{s.label}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${pct}%`, background: s.color }}>
                {pct >= 12 ? `${pct.toFixed(0)}%` : ""}
              </div>
            </div>
            <div className="bar-val">${s.val.toFixed(2)}</div>
          </div>
        );
      })}
      <div className="bar-row" style={{ marginTop: 4, fontWeight: 700 }}>
        <div className="bar-label">Shelf price</div>
        <div />
        <div className="bar-val">${result.shelf.toFixed(2)}</div>
      </div>
    </div>
  );
}
