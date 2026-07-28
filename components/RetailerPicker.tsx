"use client";

import * as React from "react";
import { CheckIcon, SearchIcon, StoreIcon, ChevronsUpDownIcon, LayersIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Retailer, Channel } from "@/lib/resolve";

export type Selection =
  | { kind: "retailer"; slug: string }
  | { kind: "channel"; slug: string };

function stars(n: number | null) {
  if (!n) return null;
  return "★".repeat(Math.min(n, 5));
}

export function RetailerPicker({
  retailers,
  channels,
  value,
  onChange,
}: {
  retailers: Retailer[];
  channels: Channel[];
  value: Selection;
  onChange: (s: Selection) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = React.useMemo(() => {
    if (value.kind === "retailer") {
      const r = retailers.find((x) => x.slug === value.slug);
      return r
        ? { label: r.name, sub: `${r.channel}${r.stores ? ` · ${r.stores.toLocaleString()} stores` : ""}` }
        : { label: "Pick a store", sub: "" };
    }
    const c = channels.find((x) => x.slug === value.slug);
    return c
      ? { label: `Any ${c.name.toLowerCase()} store`, sub: `Typical across ${c.sampleSize ?? "—"} chains` }
      : { label: "Pick a store", sub: "" };
  }, [value, retailers, channels]);

  const needle = q.trim().toLowerCase();
  const matchedRetailers = React.useMemo(() => {
    if (!needle) return retailers.slice(0, 40);
    return retailers
      .filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          r.channel.toLowerCase().includes(needle) ||
          (r.distributorFamily ?? "").toLowerCase().includes(needle)
      )
      .slice(0, 40);
  }, [needle, retailers]);

  const matchedChannels = React.useMemo(
    () => channels.filter((c) => !needle || c.name.toLowerCase().includes(needle)),
    [needle, channels]
  );

  function pick(s: Selection) {
    onChange(s);
    setOpen(false);
    setQ("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-xl border border-input bg-card px-4 py-3 text-left transition-colors",
              "hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            )}
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                {value.kind === "retailer" ? <StoreIcon className="size-4" /> : <LayersIcon className="size-4" />}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-heading text-[15px] font-semibold">{selected.label}</span>
                {selected.sub && (
                  <span className="block truncate text-xs text-muted-foreground">{selected.sub}</span>
                )}
              </span>
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 text-muted-foreground" />
          </button>
        }
      />
      <PopoverContent className="w-(--anchor-width) min-w-[320px] p-0">
        <div className="flex items-center gap-2 border-b px-3 py-2.5">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search 219 retailers…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>

        <div className="max-h-[320px] overflow-y-auto overscroll-contain py-1">
          {matchedRetailers.length > 0 && (
            <>
              <p className="px-3 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Retailers
              </p>
              {matchedRetailers.map((r) => {
                const isSel = value.kind === "retailer" && value.slug === r.slug;
                return (
                  <button
                    key={r.slug}
                    type="button"
                    onClick={() => pick({ kind: "retailer", slug: r.slug })}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      isSel && "bg-accent"
                    )}
                  >
                    <CheckIcon className={cn("size-3.5 shrink-0", isSel ? "text-primary" : "opacity-0")} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{r.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {r.channel}
                        {r.stores ? ` · ${r.stores.toLocaleString()} stores` : ""}
                        {r.distributorFamily ? ` · ${r.distributorFamily}` : ""}
                      </span>
                    </span>
                    {r.stars ? (
                      <span
                        className="shrink-0 font-mono text-[10px] text-primary"
                        title={`${r.stars}/5 — how open this chain is to early brands`}
                      >
                        {stars(r.stars)}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </>
          )}

          {matchedChannels.length > 0 && (
            <>
              <p className="mt-1 border-t px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                Don&apos;t see yours? Use a store type
              </p>
              {matchedChannels.map((c) => {
                const isSel = value.kind === "channel" && value.slug === c.slug;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => pick({ kind: "channel", slug: c.slug })}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-accent",
                      isSel && "bg-accent"
                    )}
                  >
                    <CheckIcon className={cn("size-3.5 shrink-0", isSel ? "text-primary" : "opacity-0")} />
                    <span className="min-w-0 flex-1 truncate">Any {c.name.toLowerCase()} store</span>
                    <Badge variant="neutral" size="sm" className="shrink-0">
                      avg of {c.sampleSize}
                    </Badge>
                  </button>
                );
              })}
            </>
          )}

          {matchedRetailers.length === 0 && matchedChannels.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nothing matches “{q}”. Try a store type instead.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
