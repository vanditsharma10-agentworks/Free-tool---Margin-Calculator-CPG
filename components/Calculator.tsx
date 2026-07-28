"use client";

import * as React from "react";
import {
  ArrowRightLeftIcon, InfoIcon, PackageIcon, StoreIcon, TriangleAlertIcon, WalletIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

/** Small uppercase section marker used down the input column. */
function SectionLabel({ children, step }: { children: React.ReactNode; step: number }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-moss/12 font-mono text-[10px] font-semibold text-moss">
        {step}
      </span>
      <span className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {children}
      </span>
    </div>
  );
}

function Panel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-xl border bg-card p-4 sm:p-5", className)}>{children}</section>
  );
}

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
  // Your own cost to sell direct (%). No sheet data exists for this — it's the
  // brand's own figure — so it starts at a clearly-labeled placeholder.
  const [directPct, setDirectPct] = React.useState(15);

  const [entryOn, setEntryOn] = React.useState(true);
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

  // The middle waterfall layer is either a distributor's markup or, when you
  // sell direct, your own cost to get product to the store. Both feed the same
  // slot — selling direct is not free, so we pass the self-distribution cost
  // instead of zero.
  const middleMarkup = hasDistributor ? markupPct : directPct;

  const preset: WaterfallPreset = {
    distributorMarkupPct: middleMarkup,
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
    <>
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
        {/* ══ INPUTS ══════════════════════════════════════════════════ */}
        <div className="order-2 space-y-4 lg:order-1">
          {/* 1 — starting point + product */}
          <Panel>
            <SectionLabel step={1}>Your product</SectionLabel>

            <div className="inline-flex rounded-full border bg-muted/50 p-0.5">
              {(["forward", "reverse"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-all",
                    mode === m
                      ? "bg-moss text-moss-contrast shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "forward" ? "Start from my cost" : "Start from a shelf price"}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {mode === "forward"
                ? "You know what it costs to make — we'll find the shelf price."
                : "You know the shelf price you need — we'll say if you can afford it."}
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
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
          </Panel>

          {/* 2 — who you're selling to */}
          <Panel>
            <div className="flex items-center justify-between gap-2">
              <SectionLabel step={2}>Who you&apos;re selling to</SectionLabel>
              <InfoHint label="Where do these figures come from?">
                <p className="font-medium text-foreground">Community estimates</p>
                <p className="mt-1 text-muted-foreground">
                  Figures come from brands who&apos;ve sold to these retailers — not confirmed by the
                  retailers or distributors themselves. A realistic starting point; adjust to your
                  own deal.
                </p>
              </InfoHint>
            </div>

            <RetailerPicker retailers={retailers} channels={channels} value={sel} onChange={setSel} />

            {retailer && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
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

            <Separator className="my-4" />

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <NumberField
                  label={retailer ? `${retailer.name}'s margin` : "Store margin"}
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
                {hasDistributor ? (
                  <>
                    <NumberField
                      label="Distributor markup"
                      hint="what they add on top of your price"
                      suffix="%"
                      value={markupPct}
                      step={0.5}
                      min={0}
                      onChange={setMarkupOv}
                    />
                    {rMarkup && (
                      <ProvenanceNote provenance={rMarkup.provenance} note={rMarkup.note} />
                    )}
                  </>
                ) : (
                  <>
                    <NumberField
                      label="Your cost to sell direct"
                      hint="warehousing, freight, delivery, broker — your cost to reach the store"
                      suffix="%"
                      value={directPct}
                      step={0.5}
                      min={0}
                      onChange={setDirectPct}
                    />
                    <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-1 size-2 shrink-0 rounded-full border border-dashed border-warning" />
                      <span>
                        <span className="font-medium text-foreground">Your own figure — </span>
                        selling direct isn&apos;t free. We have no data for this, so enter your real
                        cost to get product to the store. Replaces the distributor&apos;s cut.
                      </span>
                    </p>
                  </>
                )}
                <label className="mt-2.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch checked={hasDistributor} onCheckedChange={(v: boolean) => setDistOv(v)} />
                  Goes through a distributor
                </label>
              </div>
            </div>
          </Panel>

          {/* 3 — getting on shelf */}
          <Panel>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <SectionLabel step={3}>Getting on shelf</SectionLabel>
                <p className="-mt-1 text-xs text-muted-foreground">
                  Most retailers want free product or a fee before they&apos;ll stock you.
                </p>
              </div>
              <Switch checked={entryOn} onCheckedChange={setEntryOn} className="mt-0.5 shrink-0" />
            </div>

            {entryOn && (
              <div className="mt-4 space-y-4">
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
          </Panel>
        </div>

        {/* ══ PREVIEW ═════════════════════════════════════════════════ */}
        <div className="order-1 lg:sticky lg:top-5 lg:order-2">
          <div className="overflow-hidden rounded-xl border border-moss/25 bg-card shadow-sm ring-1 ring-moss/5">
            {/* headline */}
            <div className="bg-linear-to-br from-moss/[0.09] via-moss/[0.04] to-transparent px-5 pt-5 pb-5">
              {error ? (
                <p className="flex items-center gap-2 text-sm text-destructive">
                  <TriangleAlertIcon className="size-4" /> {error}
                </p>
              ) : result ? (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                        {mode === "forward" ? "Shelf price" : "You'd sell at"}
                      </p>
                      <p className="mt-1 font-heading text-[44px] leading-none font-semibold tracking-tight tabular-nums">
                        {mode === "forward" ? money(result.shelf) : money(result.wholesale)}
                      </p>
                    </div>
                    <div className="shrink-0 rounded-lg border bg-card/70 px-3 py-2 text-right backdrop-blur">
                      <p className="text-[10px] tracking-wide text-muted-foreground uppercase">
                        Your margin
                      </p>
                      <p
                        className={cn(
                          "font-heading text-lg leading-tight font-semibold tabular-nums",
                          result.manufacturerMarginPct < 0 ? "text-destructive" : "text-foreground"
                        )}
                      >
                        {Number.isFinite(result.manufacturerMarginPct)
                          ? `${result.manufacturerMarginPct.toFixed(1)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Waterfall
                      result={result}
                      middleLabel={hasDistributor ? "Distributor" : "Your distribution cost"}
                    />
                  </div>

                  <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
                    You sell to <strong className="text-foreground">{middleman}</strong> at{" "}
                    <strong className="text-foreground tabular-nums">{money(result.wholesale)}</strong>.{" "}
                    {hasDistributor ? (
                      <>
                        They pass it on at{" "}
                        <strong className="text-foreground tabular-nums">
                          {money(result.distributorSell)}
                        </strong>
                        .{" "}
                      </>
                    ) : (
                      result.distributorCut > 0 && (
                        <>
                          Covering your own distribution adds{" "}
                          <strong className="text-foreground tabular-nums">
                            {money(result.distributorCut)}
                          </strong>
                          , so it lands at{" "}
                          <strong className="text-foreground tabular-nums">
                            {money(result.distributorSell)}
                          </strong>
                          .{" "}
                        </>
                      )
                    )}
                    <strong className="text-foreground">{whoLabel}</strong> shelves it at{" "}
                    <strong className="text-foreground tabular-nums">{money(result.shelf)}</strong>{" "}
                    and keeps <strong className="text-foreground">{marginPct}%</strong>.
                  </p>

                  {reverse && (
                    <div
                      className={cn(
                        "mt-4 rounded-lg border px-3.5 py-2.5 text-[13px] leading-relaxed",
                        reverse.verdict === "healthy" && "border-signal/30 bg-signal/10 text-signal",
                        reverse.verdict === "tight" && "border-warning/30 bg-warning/10 text-warning",
                        reverse.verdict === "unaffordable" &&
                          "border-destructive/30 bg-destructive/10 text-destructive"
                      )}
                    >
                      {reverse.message}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* entry cost */}
            {entryOn && (
              <div className="border-t px-5 py-4">
                <div className="flex items-center gap-2">
                  <WalletIcon className="size-3.5 text-moss" />
                  <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                    Cost to get on shelf
                  </p>
                </div>

                {rSlot.raw && (
                  <p className="mt-2.5 rounded-lg bg-muted/50 px-3 py-2 font-mono text-[12px] text-moss">
                    “{rSlot.raw}”
                  </p>
                )}

                <ProvenanceNote
                  provenance={rSlot.provenance}
                  note={rSlot.note}
                  peers={channel ? slottingPeers(channel.name, retailers, retailer?.slug) : []}
                />

                {entry && entry.unknown && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
                    <TriangleAlertIcon className="mt-0.5 size-3.5 shrink-0" />
                    No terms reported, and too few similar chains to average. Ask the buyer.
                  </p>
                )}

                {entry && !entry.unknown && (
                  <>
                    {entry.lines.length === 0 ? (
                      <p className="mt-3 text-[13px] text-signal">{entry.note}</p>
                    ) : (
                      <>
                        {entry.note && (
                          <p className="mt-3 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
                            <InfoIcon className="mt-0.5 size-3 shrink-0" />
                            {entry.note}
                          </p>
                        )}

                        <ul className="mt-3 space-y-2.5">
                          {entry.lines.map((l) => (
                            <li key={l.key} className="flex items-baseline justify-between gap-3">
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium">
                                  {l.label}
                                  {l.inProduct && (
                                    <Badge variant="info" size="sm">product</Badge>
                                  )}
                                  {l.assumed && (
                                    <Badge variant="warning" size="sm">assumed</Badge>
                                  )}
                                </span>
                                <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                  {l.detail}
                                </span>
                              </span>
                              <span className="shrink-0 font-mono text-[13px] tabular-nums">
                                {l.low === l.high
                                  ? money0(l.low)
                                  : `${money0(l.low)}–${money0(l.high)}`}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3.5 flex items-baseline justify-between gap-3 border-t pt-3">
                          <span className="text-[12px] font-semibold">Total to get on shelf</span>
                          <span className="font-heading text-xl font-semibold tabular-nums">
                            {entry.totalLow != null &&
                            entry.totalHigh != null &&
                            entry.totalLow !== entry.totalHigh
                              ? `${money0(entry.totalLow)}–${money0(entry.totalHigh)}`
                              : money0(entry.total ?? 0)}
                          </span>
                        </div>
                        {entry.productTotal > 0 && entry.cashTotal > 0 && !entry.isRange && (
                          <p className="mt-1 text-right text-[11px] text-muted-foreground">
                            {money0(entry.cashTotal)} cash + {money0(entry.productTotal)} in product
                          </p>
                        )}
                      </>
                    )}
                  </>
                )}

                {retailer?.adtprRaw && (
                  <p className="mt-3.5 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground">
                    <span className="font-medium text-foreground">Also expect ads/promos:</span>{" "}
                    <span className="font-mono">{retailer.adtprRaw}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ FOOTER HELP ═══════════════════════════════════════════════ */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Panel>
          <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            <ArrowRightLeftIcon className="size-3.5 text-moss" />
            Margin ↔ markup
          </p>
          <MarginMarkup />
        </Panel>

        <Panel className="bg-muted/30">
          <p className="mb-3 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            Where these numbers come from
          </p>
          <div className="space-y-2.5 text-xs leading-relaxed text-muted-foreground">
            <p>
              Figures reflect what brands report paying across{" "}
              <strong className="text-foreground">219 US retail chains</strong> (about 71,500
              stores). They are <strong className="text-foreground">community estimates</strong> —
              not confirmed by the retailers or distributors named.
            </p>
            <p>
              A <span className="inline-block size-2 translate-y-px rounded-full bg-moss" /> solid
              dot means the figure is that retailer&apos;s own reported number. A{" "}
              <span className="inline-block size-2 translate-y-px rounded-full border border-dashed border-muted-foreground" />{" "}
              hollow dot means we averaged across similar chains because that retailer hasn&apos;t
              reported one — and we say so every time.
            </p>
            <p>Always confirm the real terms with your buyer before committing.</p>
          </div>
        </Panel>
      </div>
    </>
  );
}
