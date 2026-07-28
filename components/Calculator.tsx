"use client";

import { useEffect, useMemo, useState } from "react";
import {
  forwardWaterfall,
  reverseWaterfall,
  trueMargin,
  marginToMarkup,
  markupToMargin,
  type WaterfallPreset,
  type ReverseResult,
} from "@/lib/calc";
import {
  FALLBACK_PRESETS,
  type ChannelPreset,
  type PresetPayload,
  type TradeDefaults,
} from "@/lib/presets";
import Waterfall from "./Waterfall";
import MarginMarkup from "./MarginMarkup";

type Mode = "forward" | "reverse";

const money = (n: number) => (Number.isFinite(n) ? `$${n.toFixed(2)}` : "—");

export default function Calculator() {
  const [presets, setPresets] = useState<PresetPayload>(FALLBACK_PRESETS);

  const [mode, setMode] = useState<Mode>("forward");
  const [channelSlug, setChannelSlug] = useState("natural");
  const [distSlug, setDistSlug] = useState("unfi");

  const [hasDistributor, setHasDistributor] = useState(true);
  const [distMarkup, setDistMarkup] = useState(12.5);
  const [retailerMargin, setRetailerMargin] = useState(37.5);

  const [cogs, setCogs] = useState(1.8);
  const [targetMargin, setTargetMargin] = useState(40);
  const [shelf, setShelf] = useState(5.4);

  const [trueOn, setTrueOn] = useState(false);
  const [trade, setTrade] = useState<TradeDefaults>(FALLBACK_PRESETS.tradeDefaults);
  const [numStores, setNumStores] = useState(50);
  const [annualUnits, setAnnualUnits] = useState(20000);

  useEffect(() => {
    let alive = true;
    fetch("/api/presets")
      .then((r) => r.json())
      .then((p: PresetPayload) => {
        if (!alive) return;
        setPresets(p);
        setTrade(p.tradeDefaults);
        applyChannel(p.channels, channelSlug);
        applyDistributor(p.distributors, distSlug);
      })
      .catch(() => void 0);
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Store type owns ONLY the retailer margin. The delivery route owns the
  // distributor layer. Keeping them separate means the two controls can never
  // contradict each other.
  function applyChannel(channels: ChannelPreset[], slug: string) {
    const c = channels.find((x) => x.slug === slug);
    if (!c) return;
    setRetailerMargin(c.retailerMarginPct);
  }

  function applyDistributor(dists: { slug: string; hasDistributor: boolean; distributorMarkupPct: number | null }[], slug: string) {
    const d = dists.find((x) => x.slug === slug);
    if (!d) return;
    setHasDistributor(d.hasDistributor);
    setDistMarkup(d.distributorMarkupPct ?? 0);
  }

  function onChannelChange(slug: string) {
    setChannelSlug(slug);
    applyChannel(presets.channels, slug);
  }

  function onDistChange(slug: string) {
    setDistSlug(slug);
    applyDistributor(presets.distributors, slug);
  }

  const preset: WaterfallPreset = {
    distributorMarkupPct: distMarkup,
    retailerMarginPct: retailerMargin,
    hasDistributor,
  };

  const { result, error } = useMemo(() => {
    try {
      if (mode === "forward") {
        return { result: forwardWaterfall({ cogs, manufacturerMarginPct: targetMargin, preset }), error: "" };
      }
      return { result: reverseWaterfall({ shelf, cogs, preset, healthyMarginPct: trade.healthyMarginPct }), error: "" };
    } catch (e) {
      return { result: null, error: (e as Error).message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, cogs, targetMargin, shelf, distMarkup, retailerMargin, hasDistributor, trade.healthyMarginPct]);

  const reverse = mode === "reverse" ? (result as ReverseResult | null) : null;

  const tm = useMemo(() => {
    if (!trueOn || !result) return null;
    return trueMargin(result.wholesale, result.cogs, {
      slottingPerSkuLump: trade.slottingLumpPerSku,
      slottingPerStore: trade.slottingPerStore,
      adTprFee: trade.adTprFee,
      numStores,
      annualUnits,
    });
  }, [trueOn, result, trade, numStores, annualUnits]);

  const middleParty = hasDistributor ? "the distributor" : "the store";

  return (
    <>
      {/* STEP 1 — starting point */}
      <div className="card">
        <p className="section-title">1. Where do you want to start?</p>
        <div className="seg" role="tablist" style={{ marginTop: 4 }}>
          <button className={mode === "forward" ? "active" : ""} onClick={() => setMode("forward")}>
            Start from my cost
          </button>
          <button className={mode === "reverse" ? "active" : ""} onClick={() => setMode("reverse")}>
            Start from a shelf price
          </button>
        </div>
        <p className="seg-desc">
          {mode === "forward"
            ? "You know what it costs to make. We'll show you the shelf price it leads to."
            : "You have a shelf price in mind. We'll work backwards and tell you if you can afford to sell there."}
        </p>
      </div>

      {/* STEP 2 — your product */}
      <div className="card">
        <p className="section-title">2. Your product</p>
        <div className="row">
          <div className="field">
            <label>
              Your cost per unit ($) <span className="hint">what it costs you to make one</span>
            </label>
            <input type="number" step="0.01" min="0" value={cogs} onChange={(e) => setCogs(+e.target.value)} />
          </div>
          {mode === "forward" ? (
            <div className="field">
              <label>
                Profit margin you want (%) <span className="hint">your cut, as a % of your selling price</span>
              </label>
              <input type="number" step="0.5" min="0" max="99" value={targetMargin} onChange={(e) => setTargetMargin(+e.target.value)} />
            </div>
          ) : (
            <div className="field">
              <label>
                Shelf price ($) <span className="hint">what the shopper pays</span>
              </label>
              <input type="number" step="0.01" min="0" value={shelf} onChange={(e) => setShelf(+e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* STEP 3 — where you sell */}
      <div className="card">
        <p className="section-title">3. Where &amp; how you sell</p>
        <p className="section-sub">
          Picking these fills in the typical cuts the distributor and store take. Not sure? Leave the
          defaults — they're realistic starting points.
        </p>
        <div className="row">
          <div className="field">
            <label>
              Type of store <span className="hint">sets the store&apos;s typical margin</span>
            </label>
            <select value={channelSlug} onChange={(e) => onChannelChange(e.target.value)}>
              {presets.channels.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>
              How it reaches the store <span className="hint">sets the distributor&apos;s markup</span>
            </label>
            <select value={distSlug} onChange={(e) => onDistChange(e.target.value)}>
              {presets.distributors.map((d) => (
                <option key={d.slug} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <p className="hint" style={{ marginTop: 4 }}>
              {hasDistributor
                ? "A distributor sits between you and the store and takes a markup."
                : "You sell straight to the store — no distributor in the chain."}
            </p>
          </div>
        </div>

        <details className="adv">
          <summary>Fine-tune the assumptions</summary>
          <p className="adv-note">
            These are pre-filled with typical numbers. Adjust them if you know your real rates.
          </p>
          <div className="row">
            {hasDistributor ? (
              <div className="field">
                <label>
                  Distributor markup (%) <span className="hint">what they add on top of your price</span>
                </label>
                <input type="number" step="0.5" min="0" value={distMarkup} onChange={(e) => setDistMarkup(+e.target.value)} />
              </div>
            ) : (
              <div className="field">
                <label>Distributor markup</label>
                <p className="hint" style={{ marginTop: 6 }}>
                  Not applicable — you sell direct. To add a distributor, pick one under{" "}
                  <em>&ldquo;How it reaches the store.&rdquo;</em>
                </p>
              </div>
            )}
            <div className="field">
              <label>
                Store margin (%) <span className="hint">the store&apos;s cut of the shelf price</span>
              </label>
              <input type="number" step="0.5" min="0" max="99" value={retailerMargin} onChange={(e) => setRetailerMargin(+e.target.value)} />
            </div>
          </div>
        </details>
      </div>

      {/* RESULT */}
      {error ? (
        <div className="card">
          <div className="err">⚠ {error}</div>
        </div>
      ) : result ? (
        <div className="card">
          <p className="section-title">Your price breakdown</p>
          <p className="explainer">
            You sell to <strong>{middleParty}</strong> for <strong>{money(result.wholesale)}</strong> per unit.{" "}
            {hasDistributor && (
              <>The distributor passes it on to the store for <strong>{money(result.distributorSell)}</strong>. </>
            )}
            The store puts it on the shelf at <strong>{money(result.shelf)}</strong> and keeps{" "}
            <strong>{result.retailerMarginPct}%</strong>.
          </p>

          <div className="legend">
            <span><i className="swatch" style={{ background: "#8a8aa0" }} /> Your cost</span>
            <span><i className="swatch" style={{ background: "#5e50ee" }} /> Your profit</span>
            {hasDistributor && <span><i className="swatch" style={{ background: "#8b7ff0" }} /> Distributor&apos;s cut</span>}
            <span><i className="swatch" style={{ background: "#b7aef7" }} /> Store&apos;s cut</span>
          </div>

          <Waterfall result={result} showDistributor={hasDistributor} />

          <div className="stat-grid">
            <Stat k="Your selling price" v={money(result.wholesale)} />
            {hasDistributor && <Stat k="Distributor sells for" v={money(result.distributorSell)} />}
            <Stat k="Shelf price" v={money(result.shelf)} />
            <Stat k="Your profit margin" v={`${result.manufacturerMarginPct.toFixed(1)}%`} />
          </div>

          {reverse && <div className={`verdict ${reverse.verdict}`}>{reverse.message}</div>}
        </div>
      ) : null}

      {/* TRUE MARGIN */}
      <div className="card">
        <label className="toggle" style={{ marginBottom: trueOn ? 6 : 0 }}>
          <input type="checkbox" checked={trueOn} onChange={(e) => setTrueOn(e.target.checked)} />
          <strong>Show my real margin after fees</strong> <span className="hint">(optional)</span>
        </label>
        {!trueOn && (
          <p className="hint" style={{ margin: "6px 0 0" }}>
            Slotting and promo fees quietly eat your margin. Turn this on to see your true first-year margin.
          </p>
        )}

        {trueOn && (
          <>
            <p className="section-sub" style={{ marginTop: 8 }}>
              Enter the fees you&apos;ll pay to get on shelf, plus how many stores and units you expect.
            </p>
            <div className="row">
              <div className="field">
                <label>Slotting — one-time per product ($)</label>
                <input type="number" step="100" min="0" value={trade.slottingLumpPerSku} onChange={(e) => setTrade({ ...trade, slottingLumpPerSku: +e.target.value })} />
              </div>
              <div className="field">
                <label>Slotting — per store ($)</label>
                <input type="number" step="10" min="0" value={trade.slottingPerStore} onChange={(e) => setTrade({ ...trade, slottingPerStore: +e.target.value })} />
              </div>
              <div className="field">
                <label>Ad / promo fees ($)</label>
                <input type="number" step="50" min="0" value={trade.adTprFee} onChange={(e) => setTrade({ ...trade, adTprFee: +e.target.value })} />
              </div>
            </div>
            <div className="row" style={{ marginTop: 16 }}>
              <div className="field">
                <label>Number of stores</label>
                <input type="number" step="1" min="0" value={numStores} onChange={(e) => setNumStores(+e.target.value)} />
              </div>
              <div className="field">
                <label>Units you expect to sell (per year)</label>
                <input type="number" step="100" min="0" value={annualUnits} onChange={(e) => setAnnualUnits(+e.target.value)} />
              </div>
            </div>

            {tm && (
              <div className="stat-grid" style={{ marginTop: 16 }}>
                <Stat k="Margin on paper" v={`${tm.paperMarginPct.toFixed(1)}%`} />
                <Stat k="Fees for the year" v={money(tm.tradeCostTotal)} />
                <Stat k="Profit after fees" v={money(tm.netProfit)} />
                <Stat k="Your TRUE margin" v={Number.isFinite(tm.trueMarginPct) ? `${tm.trueMarginPct.toFixed(1)}%` : "—"} />
              </div>
            )}
          </>
        )}
      </div>

      {/* GLOSSARY */}
      <div className="card">
        <details>
          <summary style={{ cursor: "pointer", fontWeight: 700, fontSize: "0.95rem" }}>
            What do these terms mean?
          </summary>
          <dl className="defs" style={{ marginTop: 12 }}>
            <dt>Cost per unit (COGS)</dt>
            <dd>Everything it costs you to produce one unit.</dd>
            <dt>Your selling price (wholesale)</dt>
            <dd>The price you sell at — to a distributor, or straight to the store.</dd>
            <dt>Distributor markup</dt>
            <dd>What the distributor adds on top of your price before selling to the store.</dd>
            <dt>Store (retailer) margin</dt>
            <dd>The store&apos;s cut, taken as a percentage of the shelf price.</dd>
            <dt>Shelf price</dt>
            <dd>The final price a shopper pays.</dd>
            <dt>Margin vs. markup</dt>
            <dd>Margin is a % of the <em>selling price</em>; markup is a % of the <em>cost</em>. They&apos;re easy to mix up — use the converter below.</dd>
          </dl>
        </details>
      </div>

      <MarginMarkup toMarkup={marginToMarkup} toMargin={markupToMargin} />
    </>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">{v}</div>
    </div>
  );
}
