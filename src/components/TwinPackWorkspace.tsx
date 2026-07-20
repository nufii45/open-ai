'use client';

import {
  ArrowRight,
  Check,
  Clipboard,
  FlaskConical,
  Printer,
  RefreshCw,
  ScanLine,
  ShieldCheck,
} from 'lucide-react';
import { useState } from 'react';

import { PackScan } from '@/components/PackScan';
import { PriceEvidenceCapture } from '@/components/PriceEvidenceCapture';
import { PriceImpactCard } from '@/components/PriceImpactCard';
import type { PackScanResult } from '@/lib/packScan';
import { openStyledPrintPreview } from '@/lib/printDocument';
import { compareReviewedPacks } from '@/lib/twinPack';

type PackRole = 'branded' | 'generic';
type Prices = { branded: string; generic: string; reviewed: boolean };
const EMPTY_PRICES: Prices = { branded: '', generic: '', reviewed: false };

const VERIFIED_DEMO_PACKS: readonly [PackScanResult, PackScanResult] = [
  {
    brand: 'Biogesic',
    generic: 'Paracetamol',
    activeIngredient: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packQuantity: 10,
    confidence: 'high',
    notice: 'Demo data. Review the printed package with a pharmacist.',
  },
  {
    brand: null,
    generic: 'Paracetamol',
    activeIngredient: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packQuantity: 10,
    confidence: 'high',
    notice: 'Demo data. Review the printed package with a pharmacist.',
  },
];

const MISMATCH_DEMO_PACKS: readonly [PackScanResult, PackScanResult] = [
  VERIFIED_DEMO_PACKS[0],
  {
    ...VERIFIED_DEMO_PACKS[1],
    strength: '650 mg',
  },
];

function packName(pack: PackScanResult) {
  return pack.brand ?? pack.generic ?? pack.activeIngredient ?? 'Unnamed package';
}
function packIngredient(pack: PackScanResult) {
  return pack.activeIngredient ?? pack.generic ?? '';
}
function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}
function formatCheckedAt(value: string | null) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value ?? Date.now()),
  );
}

export function TwinPackWorkspace() {
  const [firstPack, setFirstPack] = useState<PackScanResult | null>(null);
  const [secondPack, setSecondPack] = useState<PackScanResult | null>(null);
  const [firstRole, setFirstRole] = useState<PackRole>('branded');
  const [prices, setPrices] = useState<Prices>(EMPTY_PRICES);
  const [compared, setCompared] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [packsPerMonth, setPacksPerMonth] = useState('');
  const [copiedQuestion, setCopiedQuestion] = useState(false);
  const [copiedProof, setCopiedProof] = useState(false);
  const [printError, setPrintError] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  const stage = firstPack ? 'second' : 'first';
  const match = firstPack && secondPack ? compareReviewedPacks(firstPack, secondPack) : null;
  const brandedPack = firstRole === 'branded' ? firstPack : secondPack;
  const genericPack = firstRole === 'generic' ? firstPack : secondPack;
  const brandedPrice = Number(prices.branded);
  const genericPrice = Number(prices.generic);
  const packsPerMonthValue = Number(packsPerMonth);
  const priceDifference = Math.round((brandedPrice - genericPrice) * 100) / 100;
  const monthlyDifference =
    packsPerMonthValue > 0 && priceDifference > 0
      ? Math.round(priceDifference * packsPerMonthValue * 100) / 100
      : null;
  const canCompare = Boolean(
    match?.matches && prices.reviewed && brandedPrice > 0 && genericPrice > 0,
  );
  const activeStep = firstPack && secondPack ? 3 : firstPack ? 2 : 1;

  function reset() {
    setFirstPack(null);
    setSecondPack(null);
    setPrices(EMPTY_PRICES);
    setCompared(false);
    setCheckedAt(null);
    setPacksPerMonth('');
    setCopiedQuestion(false);
    setCopiedProof(false);
    setPrintError(false);
    setDemoMode(false);
  }
  function loadDemo(kind: 'verified' | 'mismatch') {
    const [first, second] = kind === 'verified' ? VERIFIED_DEMO_PACKS : MISMATCH_DEMO_PACKS;
    setFirstPack(first);
    setSecondPack(second);
    setFirstRole('branded');
    setPrices(
      kind === 'verified' ? { branded: '46.00', generic: '15.00', reviewed: true } : EMPTY_PRICES,
    );
    setCompared(false);
    setCheckedAt(null);
    setPacksPerMonth('');
    setCopiedQuestion(false);
    setCopiedProof(false);
    setPrintError(false);
    setDemoMode(true);
  }
  function applyScan(result: PackScanResult) {
    if (!firstPack) setFirstPack(result);
    else setSecondPack(result);
    setPrices(EMPTY_PRICES);
    setCompared(false);
    setCheckedAt(null);
    setPacksPerMonth('');
    setCopiedQuestion(false);
    setCopiedProof(false);
    setPrintError(false);
    setDemoMode(false);
  }
  function updatePrice(kind: PackRole, value: string) {
    setPrices((current) => ({ ...current, [kind]: value }));
    setCompared(false);
    setCheckedAt(null);
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
      setCopiedQuestion(true);
    } catch {
      setCopiedQuestion(false);
    }
  }

  async function copyCounterProof() {
    if (!match?.matches || !brandedPack || !genericPack || !navigator.clipboard) return;
    const checkedLabel = formatCheckedAt(checkedAt);
    const monthlyLine =
      monthlyDifference !== null
        ? `\nPotential difference for ${packsPerMonthValue} matching pack${packsPerMonthValue === 1 ? '' : 's'} per month: ${formatPHP(monthlyDifference)}.`
        : '';
    const proof = `HEALTHBRIDGE COUNTER PROOF\nObserved: ${checkedLabel}\n\nExact-pack check\nIngredient: ${packIngredient(brandedPack)}\nStrength: ${brandedPack.strength}\nForm: ${brandedPack.dosageForm}\nPack quantity: ${brandedPack.packQuantity}\n\n${packName(brandedPack)}: ${formatPHP(brandedPrice)}\n${packName(genericPack)}: ${formatPHP(genericPrice)}\nDifference for this exact pack: ${formatPHP(priceDifference)}.${monthlyLine}\n\nPlease confirm the ingredient, strength, form, and pack before I compare these prices. HealthBridge does not recommend changing medicine.`;
    try {
      await navigator.clipboard.writeText(proof);
      setCopiedProof(true);
    } catch {
      setCopiedProof(false);
    }
  }

  function exportCounterProof() {
    if (!match?.matches || !brandedPack || !genericPack) return;
    const monthlyLine =
      monthlyDifference !== null
        ? `Potential difference for ${packsPerMonthValue} matching pack${packsPerMonthValue === 1 ? '' : 's'} per month: ${formatPHP(monthlyDifference)}.`
        : 'No monthly quantity was entered.';
    const opened = openStyledPrintPreview({
      eyebrow: 'HealthBridge · Counter Proof',
      title: 'Observed price comparison',
      subtitle: `Checked ${formatCheckedAt(checkedAt)}. This is not a market price quote.`,
      sections: [
        {
          heading: 'Exact-pack check',
          lines: [
            `Ingredient: ${packIngredient(brandedPack)}`,
            `Strength: ${brandedPack.strength}`,
            `Form: ${brandedPack.dosageForm}`,
            `Pack quantity: ${brandedPack.packQuantity}`,
          ],
        },
        {
          heading: 'Prices personally observed',
          lines: [
            `${packName(brandedPack)}: ${formatPHP(brandedPrice)}`,
            `${packName(genericPack)}: ${formatPHP(genericPrice)}`,
            `Difference for this exact pack: ${formatPHP(priceDifference)}.`,
            monthlyLine,
          ],
        },
        {
          heading: 'Question for the pharmacist',
          lines: [
            'Could you please confirm these are the same ingredient, strength, form, and pack before I compare the prices?',
          ],
        },
      ],
      footer:
        'HealthBridge helps prepare a pharmacist conversation. It does not diagnose, prescribe, or recommend changing medicine.',
    });
    setPrintError(!opened);
  }

  function compareObservedPrices() {
    setCheckedAt(new Date().toISOString());
    setCompared(true);
    setCopiedQuestion(false);
    setCopiedProof(false);
    setPrintError(false);
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
              The system only processes the text that is visible in a package. HealthBridge strictly
              checks the reviewed fields and never confirms that switching medicines is safe.
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
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => loadDemo('verified')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 text-xs font-semibold text-blue-950 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <FlaskConical className="size-3.5" aria-hidden="true" />
              Try verified demo
            </button>
            <button
              type="button"
              onClick={() => loadDemo('mismatch')}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700"
            >
              See mismatch demo
            </button>
          </div>
        )}
      </div>

      {!firstPack && !secondPack ? (
        <p className="mt-3 rounded-xl border border-blue-100 bg-white/75 px-3 py-2 text-xs leading-5 text-slate-600">
          Demo packs are local sample data: no camera, upload, or AI request is made.
        </p>
      ) : null}

      {demoMode ? (
        <p className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs leading-5 text-indigo-950">
          Demo mode: the packs and PHP amounts below are illustrative local sample data, not market
          prices or a purchase recommendation.
        </p>
      ) : null}

      <ol
        aria-label="Two-pack comparison progress"
        className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-blue-100 bg-white/75 p-2"
      >
        {[
          { label: 'Scan first pack', detail: 'Capture the visible label' },
          { label: 'Scan second pack', detail: 'Add the comparison pack' },
          { label: 'Review & compare', detail: 'Confirm fields and prices' },
        ].map((item, index) => {
          const step = index + 1;
          const complete = step < activeStep;
          const active = step === activeStep;
          return (
            <li
              key={item.label}
              className={`rounded-xl px-2.5 py-2.5 sm:px-3 ${active ? 'bg-blue-800 text-white shadow-sm' : complete ? 'bg-blue-50 text-blue-950' : 'text-slate-400'}`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[11px] font-bold ${active ? 'bg-white text-blue-800' : complete ? 'bg-blue-800 text-white' : 'border border-slate-300 bg-white text-slate-500'}`}
              >
                {complete ? <Check className="size-3.5" aria-hidden="true" /> : step}
              </span>
              <p className="mt-1.5 text-[11px] font-semibold leading-4 sm:text-xs">{item.label}</p>
              <p
                className={`mt-0.5 hidden text-[10px] leading-4 sm:block ${active ? 'text-blue-100' : 'text-slate-500'}`}
              >
                {item.detail}
              </p>
            </li>
          );
        })}
      </ol>

      {!secondPack ? (
        <div className="mt-4">
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50/80 px-3 py-2.5 text-xs leading-5 text-blue-950">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-800 text-white">
              {activeStep}
            </span>
            <span>
              <strong>Step {activeStep} of 3.</strong>{' '}
              {stage === 'first'
                ? 'Scan the first package, then review every extracted field before applying it.'
                : 'Now scan the package you want to compare it with.'}
            </span>
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
              <p className="mt-3 border-t border-amber-200 pt-3 text-xs leading-5 text-amber-900">
                A similar product name is not enough for a savings claim. These may be different
                product variants, so confirm the exact pack with a pharmacist before comparing
                prices.
              </p>
              <button
                type="button"
                onClick={() => void copyQuestion()}
                className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 text-xs font-semibold text-amber-950"
              >
                <Clipboard className="size-3.5" aria-hidden="true" />
                {copiedQuestion ? 'Copied question' : 'Copy pharmacist question'}
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
              <label className="mt-4 block text-sm font-medium text-slate-700">
                Matching packs you expect to buy per month{' '}
                <span className="font-normal text-slate-500">(optional)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  value={packsPerMonth}
                  onChange={(event) => setPacksPerMonth(event.target.value)}
                  placeholder="For example, 2"
                  className="mt-1 h-11 w-full rounded-lg border border-stone-300 bg-white px-3 font-normal outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"
                />
              </label>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                This only multiplies the difference from the prices you entered. It does not suggest
                how much medicine to buy or take.
              </p>
              <label className="mt-4 flex items-start gap-3 rounded-xl bg-[#f0ece4] p-3 text-sm leading-5 text-slate-700">
                <input
                  type="checkbox"
                  checked={prices.reviewed}
                  onChange={(event) => {
                    setPrices((current) => ({ ...current, reviewed: event.target.checked }));
                    setCompared(false);
                    setCheckedAt(null);
                  }}
                  className="mt-0.5 size-4 accent-blue-700"
                />
                I reviewed the two physical packs and these are the prices I personally observed for
                them.
              </label>
              <button
                type="button"
                onClick={compareObservedPrices}
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
                checkedAt={checkedAt}
              />
              <section
                className="mt-4 overflow-hidden rounded-2xl border border-blue-200 bg-[#fffaf2]"
                aria-labelledby="counter-proof-heading"
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
                      Counter Proof
                    </p>
                    <h4
                      id="counter-proof-heading"
                      className="mt-1 text-base font-bold text-slate-950"
                    >
                      A record of the exact packs and prices you checked
                    </h4>
                  </div>
                  <span className="rounded-full border border-blue-200 bg-[#fffaf2] px-2.5 py-1 text-xs font-semibold text-blue-900">
                    User-observed
                  </span>
                </div>
                <div className="grid divide-y divide-stone-200 text-sm sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Branded pack
                    </p>
                    <p className="mt-1 font-semibold text-slate-950">{packName(brandedPack!)}</p>
                    <p className="mt-1 text-sm font-medium text-blue-900">
                      {formatPHP(brandedPrice)}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Generic pack
                    </p>
                    <p className="mt-1 font-semibold text-slate-950">{packName(genericPack!)}</p>
                    <p className="mt-1 text-sm font-medium text-blue-900">
                      {formatPHP(genericPrice)}
                    </p>
                  </div>
                </div>
                <div className="border-t border-stone-200 bg-[#f0ece4] p-4">
                  <dl className="grid gap-3 text-xs leading-5 sm:grid-cols-4">
                    <div>
                      <dt className="font-medium text-slate-500">Ingredient</dt>
                      <dd className="font-semibold text-slate-800">
                        {packIngredient(brandedPack!)}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Strength</dt>
                      <dd className="font-semibold text-slate-800">{brandedPack!.strength}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Form</dt>
                      <dd className="font-semibold text-slate-800">{brandedPack!.dosageForm}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-slate-500">Pack</dt>
                      <dd className="font-semibold text-slate-800">{brandedPack!.packQuantity}</dd>
                    </div>
                  </dl>
                  {monthlyDifference !== null ? (
                    <p className="mt-4 rounded-xl border border-blue-200 bg-[#fffaf2] px-3 py-2 text-sm font-medium text-blue-950">
                      {formatPHP(monthlyDifference)} potential difference for {packsPerMonthValue}{' '}
                      matching pack{packsPerMonthValue === 1 ? '' : 's'} per month.
                    </p>
                  ) : null}
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-stone-300 pt-3">
                    <p className="text-xs leading-5 text-slate-600">
                      Show this to a pharmacist to confirm the four pack details before making a
                      choice.
                    </p>
                    <button
                      type="button"
                      onClick={() => void copyCounterProof()}
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-blue-300 bg-white px-3 text-sm font-semibold text-blue-950 transition hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                    >
                      <Clipboard className="size-4" aria-hidden="true" />
                      {copiedProof ? 'Copied proof' : 'Copy Counter Proof'}
                    </button>
                    <button
                      type="button"
                      onClick={exportCounterProof}
                      className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
                    >
                      <Printer className="size-4" aria-hidden="true" />
                      Export styled PDF
                    </button>
                  </div>
                  {printError ? (
                    <p role="alert" className="mt-3 text-xs leading-5 text-amber-800">
                      Your browser blocked the PDF preview. Allow pop-ups for HealthBridge, then try
                      again.
                    </p>
                  ) : null}
                </div>
              </section>
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
                  {copiedQuestion ? 'Copied question' : 'Copy question'}
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
