'use client';

import { ArrowRight, Check, Clipboard, RefreshCw, ScanLine, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { PackScan } from '@/components/PackScan';
import { PriceEvidenceCapture } from '@/components/PriceEvidenceCapture';
import { PriceImpactCard } from '@/components/PriceImpactCard';
import type { PackScanResult } from '@/lib/packScan';
import { compareReviewedPacks } from '@/lib/twinPack';

type PackRole = 'branded' | 'generic';
type Prices = { branded: string; generic: string; reviewed: boolean };
const EMPTY_PRICES: Prices = { branded: '', generic: '', reviewed: false };

function packName(pack: PackScanResult) {
  return pack.brand ?? pack.generic ?? pack.activeIngredient ?? 'Unnamed package';
}
function packIngredient(pack: PackScanResult) {
  return pack.activeIngredient ?? pack.generic ?? '';
}
function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export function TwinPackWorkspace() {
  const [firstPack, setFirstPack] = useState<PackScanResult | null>(null);
  const [secondPack, setSecondPack] = useState<PackScanResult | null>(null);
  const [firstRole, setFirstRole] = useState<PackRole>('branded');
  const [prices, setPrices] = useState<Prices>(EMPTY_PRICES);
  const [compared, setCompared] = useState(false);
  const [copied, setCopied] = useState(false);

  const stage = firstPack ? 'second' : 'first';
  const match = firstPack && secondPack ? compareReviewedPacks(firstPack, secondPack) : null;
  const brandedPack = firstRole === 'branded' ? firstPack : secondPack;
  const genericPack = firstRole === 'generic' ? firstPack : secondPack;
  const brandedPrice = Number(prices.branded);
  const genericPrice = Number(prices.generic);
  const canCompare = Boolean(
    match?.matches && prices.reviewed && brandedPrice > 0 && genericPrice > 0,
  );

  function reset() {
    setFirstPack(null);
    setSecondPack(null);
    setPrices(EMPTY_PRICES);
    setCompared(false);
    setCopied(false);
  }
  function applyScan(result: PackScanResult) {
    if (!firstPack) setFirstPack(result);
    else setSecondPack(result);
    setPrices(EMPTY_PRICES);
    setCompared(false);
    setCopied(false);
  }
  function updatePrice(kind: PackRole, value: string) {
    setPrices((current) => ({ ...current, [kind]: value }));
    setCompared(false);
  }
  function applyPrice(kind: PackRole, value: number) {
    updatePrice(kind, value.toFixed(2));
  }
  async function copyQuestion() {
    if (!firstPack || !secondPack || !navigator.clipboard) return;
    const message = match?.matches
      ? `Could you please confirm these are the same ingredient, strength, form, and pack before I compare the prices?\n\n${packName(brandedPack!)}: ${formatPHP(brandedPrice)}\n${packName(genericPack!)}: ${formatPHP(genericPrice)}`
      : `Could you help me confirm these package differences before I compare prices?\n\n${match?.differences.join('\n')}`;
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section
      className="mt-5 rounded-[1.4rem] border border-blue-200 bg-[#f5f7ff] p-4 shadow-sm sm:p-5"
      aria-labelledby="twin-pack-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-blue-100">
            <ScanLine className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-blue-800">
              SCAN → VERIFY → ASK
            </p>
            <h3
              id="twin-pack-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-950"
            >
              Compare two physical packs, not a catalog guess
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              The system only processes the text that's visible in a package. HealthBridge strictly checks the reviewed fields and never confirms that switching medicines is safe.
            </p>
          </div>
        </div>
        {firstPack || secondPack ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-[#fffaf2] px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300"
          >
            <RefreshCw className="size-3.5" aria-hidden="true" />
            Start over
          </button>
        ) : null}
      </div>

      {!secondPack ? (
        <div className="mt-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="flex size-6 items-center justify-center rounded-full bg-blue-800 text-white">
              {stage === 'first' ? '1' : '2'}
            </span>
            {stage === 'first'
              ? 'Scan the first package. Review every extracted field before applying it.'
              : 'Now scan the package you want to compare it with.'}
          </div>
          <PackScan key={stage} onApply={applyScan} />
        </div>
      ) : null}

      {firstPack && secondPack ? (
        <>
          <div className="mt-5 rounded-2xl border border-stone-300 bg-[#fffaf2] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
                  Two-pack review
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Choose the labels yourself, then review the visible details below.
                </p>
              </div>
              <div className="inline-flex rounded-lg border border-stone-300 bg-white p-1">
                <button
                  type="button"
                  onClick={() => {
                    setFirstRole('branded');
                    setCompared(false);
                  }}
                  aria-pressed={firstRole === 'branded'}
                  className={`min-h-9 rounded-md px-3 text-xs font-semibold ${firstRole === 'branded' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}
                >
                  Pack 1 is branded
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFirstRole('generic');
                    setCompared(false);
                  }}
                  aria-pressed={firstRole === 'generic'}
                  className={`min-h-9 rounded-md px-3 text-xs font-semibold ${firstRole === 'generic' ? 'bg-blue-800 text-white' : 'text-slate-600'}`}
                >
                  Pack 1 is generic
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                {
                  title: firstRole === 'branded' ? 'Branded pack' : 'Generic pack',
                  pack: firstPack,
                },
                {
                  title: firstRole === 'generic' ? 'Branded pack' : 'Generic pack',
                  pack: secondPack,
                },
              ].map(({ title, pack }) => (
                <div key={title} className="rounded-xl border border-stone-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {title}
                  </p>
                  <p className="mt-1 font-semibold text-slate-950">{packName(pack)}</p>
                  <dl className="mt-3 space-y-1.5 text-xs leading-5 text-slate-600">
                    <div className="flex justify-between gap-3">
                      <dt>Ingredient</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {packIngredient(pack) || 'Not read'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Strength</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {pack.strength ?? 'Not read'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Form</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {pack.dosageForm ?? 'Not read'}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt>Pack</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {pack.packQuantity ?? 'Not read'}
                      </dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </div>

          {match?.matches ? (
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-blue-950">
                <Check className="size-4" aria-hidden="true" />
                Visible fields match
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Ingredient, strength, form, and pack quantity match in the fields you reviewed. You
                can now compare the prices you observed.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-950">Do not compare prices yet</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-amber-900">
                {match?.differences.map((difference) => (
                  <li key={difference}>{difference}</li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => void copyQuestion()}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950"
              >
                <Clipboard className="size-3.5" aria-hidden="true" />
                {copied ? 'Copied question' : 'Copy pharmacist question'}
              </button>
            </div>
          )}

          {match?.matches ? (
            <div className="mt-4 rounded-2xl border border-stone-300 bg-[#fffaf2] p-4">
              <p className="text-sm font-semibold text-slate-950">Prices you personally observed</p>
              <p className="mt-1 text-xs leading-5 text-slate-600">
                Capture a shelf label or receipt to prefill a PHP amount, or enter it yourself.
                Nothing is treated as a market price.
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">
                  Branded price (₱)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={prices.branded}
                    onChange={(event) => updatePrice('branded', event.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  />
                </label>
                <label className="text-sm font-medium text-slate-700">
                  Generic price (₱)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={prices.generic}
                    onChange={(event) => updatePrice('generic', event.target.value)}
                    className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                  />
                </label>
              </div>
              <PriceEvidenceCapture onApply={applyPrice} />
              <label className="mt-4 flex items-start gap-3 rounded-xl bg-[#f0ece4] p-3 text-sm leading-5 text-slate-700">
                <input
                  type="checkbox"
                  checked={prices.reviewed}
                  onChange={(event) => {
                    setPrices((current) => ({ ...current, reviewed: event.target.checked }));
                    setCompared(false);
                  }}
                  className="mt-0.5 size-4 accent-blue-700"
                />
                I reviewed the two physical packs and these are the prices I personally observed for
                them.
              </label>
              <button
                type="button"
                onClick={() => setCompared(true)}
                disabled={!canCompare}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-blue-950 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                Compare observed prices <ArrowRight className="size-4" aria-hidden="true" />
              </button>
              {prices.reviewed && !canCompare ? (
                <p className="mt-2 text-xs text-amber-800">
                  Enter positive prices for both packs before comparing.
                </p>
              ) : null}
            </div>
          ) : null}
          {compared && match?.matches ? (
            <>
              <PriceImpactCard
                brandedPrice={brandedPrice}
                genericPrice={genericPrice}
                checkedAt={new Date().toISOString()}
              />
              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
                  Pharmacist-ready question
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-950">
                  Could you please confirm these are the same ingredient, strength, form, and pack
                  before I compare the prices?
                </p>
                <button
                  type="button"
                  onClick={() => void copyQuestion()}
                  className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 text-xs font-semibold text-blue-950"
                >
                  <Clipboard className="size-3.5" aria-hidden="true" />
                  {copied ? 'Copied question' : 'Copy question'}
                </button>
              </div>
            </>
          ) : null}
        </>
      ) : null}
      <p className="mt-4 flex gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-blue-800" aria-hidden="true" />
        HealthBridge extracts text from packages; it does not diagnose, prescribe, or tell you to
        change medicine.
      </p>
    </section>
  );
}
