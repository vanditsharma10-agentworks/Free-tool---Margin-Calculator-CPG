"use client";

import * as React from "react";
import {
  ArrowRightLeftIcon, InfoIcon, PackageIcon, StoreIcon, TriangleAlertIcon, WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { InfoHint } from "@/components/ui/info-hint";
import { RetailerPicker, type Selection } from "@/components/RetailerPicker";
import { ProvenanceNote } from "@/components/Provenance";
import { Waterfall } from "@/components/Waterfall";
import { MarginMarkup } from "@/components/MarginMarkup";
import { NumberField } from "@/components/NumberField";
import {
  forwardWaterfall, reverseWaterfall, type WaterfallPreset, type ReverseResult,
} from "@/lib/calc";
import { entryCost, type SlottingTerms } from "@/lib/entry";
import {
  resolveMargin, resolveMarkup, resolveSlotting, slottingPeers, marginPeers,
  type Retailer, type Channel,
} from "@/lib/resolve";

interface AppData {
  retailers: Retailer[];
  channels: Channel[];
  defaults: { assumedFreeCases: number; unitsPerCase: number; healthyMarginPct: number };
  ok: boolean;
}

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;
const money0 = (n: number) => `$${Math.round(n).toLocaleString()}`;

export function Calculator({ data }: { data: AppData }) {
  const { retailers, channels, defaults } = data;

  const [sel, setSel] = React.useState<Selection>(() =>
    retailers.some((r) => r.slug === "sprouts")
      ? { kind: "retailer", slug: "sprouts" }
      : retailers[0]
        ? { kind: "retailer", slug: retailers[0].slug }
        : { kind: "channel", slug: channels[0]?.slug ?? "natural" }
  );

  const [mode, setMode] = React.useState<"forward" | "reverse">("forward");
  const [cogs, setCogs] = React.useState(1.8);
  const [targetMargin, setTargetMargin] = React.useState(40);
  const [shelfInput, setShelfInput] = React.useState(5.99);

  // Overrides are null until the user actually edits, so changing retailer
  // re-adopts that retailer's figures rather than stranding a stale edit.
  const [marginOv, setMarginOv] = React.useState<number | null>(null);
  const [markupOv, setMarkupOv] = React.useState<number | null>(null);
  const [distOv, setDistOv] = React.useState<boolean | null>(null);
  const [storesOv, setStoresOv] = React.useState<number | null>(null);

  const [entryOn, setEntryOn] = React.useState(false);
  const [skus, setSkus] = React.useState(1);
  const [unitsPerCase, setUnitsPerCase] = React.useState(defaults.unitsPerCase);
  const [freeCases, setFreeCases] = React.useState(defaults.assumedFreeCases);

  const retailer = sel.kind === "retailer" ? retailers.find((r) => r.slug === sel.slug) ?? null : null;
  const channel = React.useMemo(() => {
    const name = retailer?.channel ?? null;
    if (name) return channels.find((c) => c.name === name) ?? null;
    return channels.find((c) => c.slug === (sel.kind === "channel" ? sel.slug : "")) ?? null;
  }, [retailer, channels, sel]);

  React.useEffect(() => {
    setMarginOv(null);
    setMarkupOv(null);
    setDistOv(null);
    setStoresOv(null);
  }, [sel]);

  const rMargin = resolveMargin(retailer, channel);
  const rMarkup = resolveMarkup(retailer, channel);
  const rSlot = resolveSlotting(retailer, channel);

  const marginPct = marginOv ?? rMargin?.value ?? 30;
  const hasDistributor = distOv ?? rMarkup !== null;
  const markupPct = markupOv ?? rMarkup?.value ?? 0;
  const stores = storesOv ?? retailer?.stores ?? 25;

  const preset: WaterfallPreset = {
    distributorMarkupPct: markupPct,
    retailerMarginPct: marginPct,
    hasDistributor,
  };

  const { result, error } = React.useMemo(() => {
    try {
      if (mode === "forward") {
        return {
          result: forwardWaterfall({ cogs, manufacturerMarginPct: targetMargin, preset }),
          error: "",
        };
      }
      return {
        result: reverseWaterfall({
          shelf: shelfInput, cogs, preset, healthyMarginPct: defaults.healthyMarginPct,
        }),
        error: "",
      };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cogs, targetMargin, shelfInput, markupPct, marginPct, hasDistributor, defaults.healthyMarginPct]);

  const reverse = mode === "reverse" ? (result as ReverseResult | null) : null;

  // Free-fill quantity is a user-adjustable assumption only when the source
  // didn't state one; otherwise the reported quantity wins.
  const terms: SlottingTerms = rSlot.terms;
  const entry = React.useMemo(() => {
    if (!entryOn || !result) return null;
    return entryCost({
      terms, cogs: result.cogs, stores, skus,
      assumedFreeCases: freeCases, unitsPerCase,
      wholesale: result.wholesale, annualUnits: 0,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryOn, result, terms, stores, skus, freeCases, unitsPerCase]);

  const whoLabel = retailer?.name ?? (channel ? `a typical ${channel.name.toLowerCase()} store` : "the store");
  const middleman = hasDistributor ? "the distributor" : whoLabel;

  return (
    <div className="space-y-5">
      {/* ── THE ANSWER ─────────────────────────────────────────────── */}
      <Card className="overflow-hidden border-moss/25 bg-linear-to-b from-moss/[0.07] to-transparent">
        <CardContent className="pt-6">
          {error ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <TriangleAlertIcon className="size-4" /> {error}
            </p>
          ) : result ? (
            <>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-[13px] text-muted-foreground">
                    {mode === "forward" ? "Shelf price" : "You'd sell to them for"}
                  </p>
                  <p className="font-heading text-[44px] leading-none font-semibold tracking-tight tabular-nums">
                    {mode === "forward" ? money(result.shelf) : money(result.wholesale)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[13px] text-muted-foreground">Your margin</p>
                  <p
                    className={cn(
                      "font-heading text-[22px] leading-tight font-semibold tabular-nums",
                      result.manufacturerMarginPct < 0 ? "text-destructive" : "text-foreground"
                    )}
                  >
                    {Number.isFinite(result.manufacturerMarginPct)
                      ? `${result.manufacturerMarginPct.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed">
                You sell to <strong>{middleman}</strong> for{" "}
                <strong className="tabular-nums">{money(result.wholesale)}</strong>.{" "}
                {hasDistributor && (
                  <>
                    They pass it to the store at{" "}
                    <strong className="tabular-nums">{money(result.distributorSell)}</strong>.{" "}
                  </>
                )}
                <strong>{whoLabel}</strong> shelves it at{" "}
                <strong className="tabular-nums">{money(result.shelf)}</strong> and keeps{" "}
                <strong>{marginPct}%</strong>.
              </p>

              <div className="mt-5">
                <Waterfall result={result} showDistributor={hasDistributor} />
              </div>

              {reverse && (
                <div
                  className={cn(
                    "mt-5 rounded-lg border px-4 py-3 text-sm",
                    reverse.verdict === "healthy" && "border-signal/30 bg-signal/10 text-signal",
                    reverse.verdict === "tight" && "border-warning/30 bg-warning/10 text-warning",
                    reverse.verdict === "unaffordable" && "border-destructive/30 bg-destructive/10 text-destructive"
                  )}
                >
                  {reverse.message}
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* ── YOUR NUMBERS ───────────────────────────────────────────── */}
      <Card>
        <CardContent className="space-y-5 pt-6">
          <div>
            <p className="mb-2 font-heading text-[15px] font-semibold">Where do you want to start?</p>
            <div className="inline-flex rounded-full border bg-muted/50 p-0.5">
              {(["forward", "reverse"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
                    mode === m
                      ? "bg-moss text-moss-contrast shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "forward" ? "From my cost" : "From a shelf price"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {mode === "forward"
                ? "You know what it costs to make — we'll find the shelf price."
                : "You know the shelf price you need to hit — we'll tell you if you can afford it."}
            </p>
          </div>

          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              label="Your cost per unit"
              hint="what one unit costs you to make"
              prefix="$"
              value={cogs}
              step={0.01}
              min={0}
              onChange={setCogs}
            />
            {mode === "forward" ? (
              <NumberField
                label="Margin you want"
                hint="your cut, as a % of your selling price"
                suffix="%"
                value={targetMargin}
                step={0.5}
                min={0}
                max={99}
                onChange={setTargetMargin}
              />
            ) : (
              <NumberField
                label="Shelf price"
                hint="what the shopper pays"
                prefix="$"
                value={shelfInput}
                step={0.01}
                min={0}
                onChange={setShelfInput}
              />
            )}
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
              Who are you selling to?
              <InfoHint label="Where do these figures come from?">
                <p className="font-medium text-foreground">Community estimates</p>
                <p className="mt-1 text-muted-foreground">
                  Figures come from brands who&apos;ve sold to these retailers — they are not
                  confirmed by the retailers or distributors themselves. Treat them as a realistic
                  starting point and adjust to your own deal.
                </p>
              </InfoHint>
            </p>
            <RetailerPicker retailers={retailers} channels={channels} value={sel} onChange={setSel} />
            {retailer && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {retailer.stores != null && (
                  <Badge variant="neutral" size="sm">{retailer.stores.toLocaleString()} stores</Badge>
                )}
                {retailer.distributorFamily && (
                  <Badge variant="neutral" size="sm">via {retailer.distributorFamily}</Badge>
                )}
                {retailer.region && <Badge variant="neutral" size="sm">{retailer.region}</Badge>}
                {retailer.stars != null && retailer.stars >= 4 && (
                  <Badge variant="success" size="sm">open to early brands</Badge>
                )}
              </div>
            )}
          </div>

          {/* Store margin — always shown with provenance */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <NumberField
                label={`${retailer ? retailer.name + "'s" : "Store"} margin`}
                hint="their cut of the shelf price"
                suffix="%"
                value={marginPct}
                step={0.5}
                min={0}
                max={99}
                onChange={setMarginOv}
              />
              {rMargin && (
                <ProvenanceNote
                  provenance={rMargin.provenance}
                  note={
                    rMargin.provenance === "exact" && rMargin.low != null && rMargin.high != null
                      ? `${rMargin.note} Reported as ${rMargin.low}–${rMargin.high}%.`
                      : rMargin.note
                  }
                  peers={channel ? marginPeers(channel.name, retailers, retailer?.slug) : []}
                  peersLabel="What similar stores keep"
                />
              )}
            </div>

            <div>
              <NumberField
                label="Distributor markup"
                hint="what they add on top of your price"
                suffix="%"
                value={markupPct}
                step={0.5}
                min={0}
                disabled={!hasDistributor}
                onChange={setMarkupOv}
              />
              {hasDistributor && rMarkup ? (
                <ProvenanceNote provenance={rMarkup.provenance} note={rMarkup.note} />
              ) : (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No distributor in this chain — you sell straight to the store.
                </p>
              )}
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={hasDistributor}
                  onCheckedChange={(v: boolean) => setDistOv(v)}
                />
                Goes through a distributor
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── COST TO GET ON SHELF ───────────────────────────────────── */}
      <Card>
        <CardContent className="pt-6">
          <label className="flex items-start justify-between gap-4">
            <span>
              <span className="flex items-center gap-2 font-heading text-[15px] font-semibold">
                <WalletIcon className="size-4 text-moss" />
                What it costs to get on shelf
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Most retailers want free product or a fee before they&apos;ll stock you. This is the
                cash and product you need up front.
              </span>
            </span>
            <Switch checked={entryOn} onCheckedChange={setEntryOn} className="mt-1 shrink-0" />
          </label>

          {entryOn && (
            <div className="mt-5 space-y-5">
              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <NumberField
                  label="How many stores?"
                  hint={
                    retailer?.stores != null && storesOv === null
                      ? `${retailer.name} has ${retailer.stores.toLocaleString()} — you may launch in fewer`
                      : "the stores you'll actually launch in"
                  }
                  icon={<StoreIcon className="size-3.5" />}
                  value={stores}
                  step={1}
                  min={0}
                  onChange={setStoresOv}
                />
                <NumberField
                  label="How many products (SKUs)?"
                  hint="fees are usually charged per SKU"
                  icon={<PackageIcon className="size-3.5" />}
                  value={skus}
                  step={1}
                  min={0}
                  onChange={setSkus}
                />
              </div>

              {/* What this retailer charges */}
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-[13px] font-semibold">
                  What {retailer?.name ?? "they"} charge
                </p>
                {rSlot.raw ? (
                  <p className="mt-1 font-mono text-[13px] text-moss">&ldquo;{rSlot.raw}&rdquo;</p>
                ) : null}
                <ProvenanceNote
                  provenance={rSlot.provenance}
                  note={rSlot.note}
                  peers={channel ? slottingPeers(channel.name, retailers, retailer?.slug) : []}
                />

                {entry && entry.unknown && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                    We don&apos;t have terms for this one, and there aren&apos;t enough similar
                    chains to average. Ask the buyer directly.
                  </p>
                )}

                {entry && !entry.unknown && (
                  <>
                    <Separator className="my-4" />

                    {entry.lines.length === 0 ? (
                      <p className="text-sm text-signal">{entry.note}</p>
                    ) : (
                      <>
                        {entry.note && (
                          <p className="mb-3 flex items-start gap-2 text-xs text-muted-foreground">
                            <InfoIcon className="mt-0.5 size-3.5 shrink-0" />
                            {entry.note}
                          </p>
                        )}
                        <ul className="space-y-2.5">
                          {entry.lines.map((l) => (
                            <li key={l.key} className="flex items-baseline justify-between gap-3">
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-1.5 text-[13px] font-medium">
                                  {l.label}
                                  {l.inProduct && (
                                    <Badge variant="info" size="sm">product, not cash</Badge>
                                  )}
                                  {l.assumed && (
                                    <Badge variant="warning" size="sm">quantity assumed</Badge>
                                  )}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {l.detail}
                                </span>
                              </span>
                              <span className="shrink-0 font-mono text-sm tabular-nums">
                                {l.low === l.high ? money0(l.low) : `${money0(l.low)}–${money0(l.high)}`}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <Separator className="my-4" />

                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-[13px] font-semibold">
                            {entry.isRange ? "Total to get on shelf" : "Total to get on shelf"}
                          </span>
                          <span className="font-heading text-2xl font-semibold tabular-nums">
                            {entry.totalLow != null && entry.totalHigh != null && entry.totalLow !== entry.totalHigh
                              ? `${money0(entry.totalLow)}–${money0(entry.totalHigh)}`
                              : money0(entry.total ?? 0)}
                          </span>
                        </div>
                        {entry.productTotal > 0 && entry.cashTotal > 0 && !entry.isRange && (
                          <p className="mt-1 text-right text-xs text-muted-foreground">
                            {money0(entry.cashTotal)} cash + {money0(entry.productTotal)} in product
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

                {retailer?.adtprRaw && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">Also expect ads/promos:</span>{" "}
                    <span className="font-mono">{retailer.adtprRaw}</span>
                  </p>
                )}
              </div>

              {/* Free-fill assumptions, only when they actually matter */}
              {entry?.lines.some((l) => l.key === "free_fill") && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <NumberField
                    label="Units per case"
                    hint="how many units in one case"
                    value={unitsPerCase}
                    step={1}
                    min={1}
                    onChange={setUnitsPerCase}
                  />
                  {entry.lines.find((l) => l.key === "free_fill")?.assumed && (
                    <NumberField
                      label="Free cases per store"
                      hint="assumed — they didn't state a quantity"
                      value={freeCases}
                      step={1}
                      min={0}
                      onChange={setFreeCases}
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── HELP ───────────────────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="mb-3 flex items-center gap-2 font-heading text-[15px] font-semibold">
              <ArrowRightLeftIcon className="size-4 text-moss" />
              Margin ↔ markup
            </p>
            <MarginMarkup />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-3 pt-6 text-xs leading-relaxed text-muted-foreground">
            <p className="font-heading text-[15px] font-semibold text-foreground">
              Where these numbers come from
            </p>
            <p>
              Figures reflect what brands report paying across <strong>219 US retail chains</strong>{" "}
              (about 71,500 stores). They are <strong>community estimates</strong> — not confirmed by
              the retailers or distributors named.
            </p>
            <p>
              A <span className="inline-block size-2 translate-y-px rounded-full bg-moss" /> solid dot
              means the figure is that retailer&apos;s own reported number. A{" "}
              <span className="inline-block size-2 translate-y-px rounded-full border border-dashed border-muted-foreground" />{" "}
              hollow dot means we averaged across similar chains because that retailer hasn&apos;t
              reported one — and we say so every time.
            </p>
            <p>Always confirm the real terms with your buyer before committing.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
