"use client";

import { useState } from "react";

/**
 * The base margin ↔ markup converter — the generic head-term feature
 * ("margin calculator", "markup calculator") that sits under the CPG waterfall.
 */
export default function MarginMarkup({
  toMarkup,
  toMargin,
}: {
  toMarkup: (marginPct: number) => number;
  toMargin: (markupPct: number) => number;
}) {
  const [margin, setMargin] = useState(40);
  const [markup, setMarkup] = useState(66.7);

  function onMargin(v: number) {
    setMargin(v);
    try {
      setMarkup(toMarkup(v));
    } catch {
      /* margin >= 100: leave markup as-is */
    }
  }
  function onMarkup(v: number) {
    setMarkup(v);
    setMargin(toMargin(v));
  }

  return (
    <div className="card">
      <label>
        <strong>Margin ↔ markup converter</strong>{" "}
        <span className="hint">the two get confused constantly — this pins them</span>
      </label>
      <div className="row" style={{ marginTop: 12 }}>
        <div className="field">
          <label>Margin (%) — on selling price</label>
          <input type="number" step="0.5" min="0" max="99" value={margin} onChange={(e) => onMargin(+e.target.value)} />
        </div>
        <div className="field">
          <label>Markup (%) — on cost</label>
          <input type="number" step="0.5" min="0" value={markup} onChange={(e) => onMarkup(+e.target.value)} />
        </div>
      </div>
      <p className="source-note">
        Keystone = 50% margin = 100% markup. Enter either side; the other updates.
      </p>
    </div>
  );
}
