"use client";

import * as React from "react";
import { NumberField } from "@/components/NumberField";
import { marginToMarkup, markupToMargin } from "@/lib/calc";

/** The two get confused constantly; this pins them to each other. */
export function MarginMarkup() {
  const [margin, setMargin] = React.useState(40);
  const [markup, setMarkup] = React.useState(66.7);

  function onMargin(v: number) {
    setMargin(v);
    try {
      setMarkup(marginToMarkup(v));
    } catch {
      /* margin >= 100 has no finite markup — leave the other side alone */
    }
  }
  function onMarkup(v: number) {
    setMarkup(v);
    setMargin(markupToMargin(v));
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <NumberField
          label="Margin"
          hint="% of the selling price"
          suffix="%"
          value={margin}
          step={0.5}
          min={0}
          max={99}
          onChange={onMargin}
        />
        <NumberField
          label="Markup"
          hint="% added on top of cost"
          suffix="%"
          value={markup}
          step={0.5}
          min={0}
          onChange={onMarkup}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Keystone = 50% margin = 100% markup. Type in either box.
      </p>
    </>
  );
}
