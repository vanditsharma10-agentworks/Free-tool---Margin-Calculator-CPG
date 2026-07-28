"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Provenance as P, Peer } from "@/lib/resolve";

/**
 * The honesty layer. A filled dot means the figure is the chain's own reported
 * number; a hollow dot means we averaged it across the channel and are saying
 * so. Never show a figure without one of these.
 */
export function ProvenanceNote({
  provenance,
  note,
  peers,
  peersLabel = "What similar stores charge",
  className,
}: {
  provenance: P;
  note: string;
  peers?: Peer[];
  peersLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const dot =
    provenance === "exact"
      ? "bg-primary"
      : provenance === "averaged"
        ? "border border-dashed border-muted-foreground bg-transparent"
        : "border border-dashed border-warning bg-transparent";

  return (
    <div className={cn("mt-1.5", className)}>
      <p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
        <span className={cn("mt-1 size-2 shrink-0 rounded-full", dot)} aria-hidden />
        <span>
          {provenance === "averaged" && <span className="font-medium text-foreground">Averaged — </span>}
          {provenance === "unknown" && <span className="font-medium text-warning">Not reported — </span>}
          {note}
        </span>
      </p>

      {peers && peers.length > 0 && (
        <div className="mt-1.5">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            <ChevronDownIcon className={cn("size-3 transition-transform", open && "rotate-180")} />
            {peersLabel}
          </button>
          {open && (
            <ul className="mt-1.5 space-y-1 rounded-lg border bg-muted/40 px-3 py-2">
              {peers.map((p) => (
                <li key={p.name} className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-foreground">
                    {p.name}
                    {p.stores ? (
                      <span className="text-muted-foreground"> · {p.stores.toLocaleString()} stores</span>
                    ) : null}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{p.description}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
