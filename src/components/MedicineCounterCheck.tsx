'use client';

import {
  AlertTriangle,
  BadgeCheck as Sparkles,
  Check,
  Clipboard,
  Database,
  LoaderCircle,
  PhilippinePeso,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useRef, useState } from 'react';

import { findCatalogCandidate } from '@/lib/lookup';
import { PriceEvidenceCapture } from '@/components/PriceEvidenceCapture';
import { PriceImpactCard } from '@/components/PriceImpactCard';
import { TwinPackWorkspace } from '@/components/TwinPackWorkspace';
import { AiReferenceWorkspace } from '@/components/AiReferenceWorkspace';
import type { AiMedicineCandidate } from '@/lib/aiMedicineSearch';
import { PHILIPPINE_FDA_DRUG_SEARCH_URL, type RxNormReference } from '@/lib/medicineSources';
import type { DrugComparison } from '@/lib/types';

const EXAMPLES = ['Biogesic', 'Norvasc', 'Lipitor'];
type Phase = 'idle' | 'loading' | 'ready' | 'error';
type CompanionResponse = {
  packMatch: { status: 'match' | 'mismatch'; differences: string[] };
  impact: { savings: number; percent: number; status: 'saves' | 'no_saving' } | null;
  copy: { explanation: string; pharmacistQuestion: string; source: 'ai' | 'template' };
};
type DrugInfoResponse = { indication: string; warning: string; source: 'live' | 'cached' };
type IdentityMatch = {
  brand: string | null;
  generic: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
};
type IdentityResponse = { matches: IdentityMatch[]; notice: string; source: string };
type RxNormResponse = { matches: RxNormReference[]; notice: string; source: string };
type AiSearchResponse = {
  matches: AiMedicineCandidate[];
  sourceUrls: string[];
  source: 'gpt-5.6-terra-web-search' | 'unavailable';
  notice: string;
};
type ObservedForm = {
  strength: string;
  dosageForm: string;
  packQuantity: string;
  brandedPrice: string;
  genericPrice: string;
  confirmedSamePack: boolean;
};
const EMPTY_OBSERVED: ObservedForm = {
  strength: '',
  dosageForm: '',
  packQuantity: '',
  brandedPrice: '',
  genericPrice: '',
  confirmedSamePack: false,
};

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export function MedicineCounterCheck({
  onSelect,
}: {
  onSelect: (medicine: DrugComparison | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<DrugComparison | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [observed, setObserved] = useState<ObservedForm>(EMPTY_OBSERVED);
  const [phase, setPhase] = useState<Phase>('idle');
  const [companion, setCompanion] = useState<CompanionResponse | null>(null);
  const [drugInfo, setDrugInfo] = useState<DrugInfoResponse | null>(null);
  const [drugInfoPhase, setDrugInfoPhase] = useState<Phase>('idle');
  const [identity, setIdentity] = useState<IdentityResponse | null>(null);
  const [identityPhase, setIdentityPhase] = useState<Phase>('idle');
  const [rxNorm, setRxNorm] = useState<RxNormResponse | null>(null);
  const [aiSearch, setAiSearch] = useState<AiSearchResponse | null>(null);
  const [aiReference, setAiReference] = useState<AiMedicineCandidate | null>(null);
  const [aiSearchPhase, setAiSearchPhase] = useState<Phase>('idle');
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiSearchRequestRef = useRef(0);

  function search(value = query) {
    const match = findCatalogCandidate(value);
    aiSearchRequestRef.current += 1;
    setQuery(value);
    setResult(match);
    setSearched(true);
    setCopied(false);
    setObserved(EMPTY_OBSERVED);
    setCompanion(null);
    setDrugInfo(null);
    setDrugInfoPhase('idle');
    setIdentity(null);
    setIdentityPhase('idle');
    setRxNorm(null);
    setAiSearch(null);
    setAiReference(null);
    setAiSearchPhase('idle');
    setCheckedAt(null);
    setPhase('idle');
    onSelect(match);
    // The curated catalog stays instant and offline for the primary demo path.
    // For an unknown typed name, automatically ask the constrained GPT-5.6
    // reference search for identity candidates only. It never creates a price
    // comparison or recommends a medicine change.
    if (!match && value.trim()) void searchWithAi(value);
  }

  function updateObserved<K extends keyof ObservedForm>(key: K, value: ObservedForm[K]) {
    setObserved((current) => ({ ...current, [key]: value }));
    setCompanion(null);
    setCheckedAt(null);
    setPhase('idle');
  }

  function applyPriceEvidence(kind: 'branded' | 'generic', price: number) {
    updateObserved(kind === 'branded' ? 'brandedPrice' : 'genericPrice', price.toFixed(2));
  }

  async function copyCard() {
    if (!result || !navigator.clipboard) return;
    const card = `HealthBridge pharmacy check\n\nBrand: ${result.brand}\nGeneric: ${result.generic}\nIngredient: ${result.activeIngredient}\nStrength: ${result.strength}\nForm: ${result.dosageForm}\nPack: ${result.packQuantity} ${result.packUnit}\n\nPlease help me confirm these match before I purchase or change anything.`;
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function copyCounterCard() {
    if (!result || !companion || companion.packMatch.status !== 'match' || !navigator.clipboard)
      return;
    const impact =
      companion.impact?.status === 'saves'
        ? `\nObserved price difference: ${formatPHP(companion.impact.savings)} (${companion.impact.percent}% lower)`
        : '';
    const card = `HealthBridge Counter Card\n\nPack reviewed\nBrand: ${result.brand}\nGeneric: ${result.generic}\nIngredient: ${result.activeIngredient}\nStrength: ${result.strength}\nForm: ${result.dosageForm}\nPack: ${result.packQuantity} ${result.packUnit}\n\nPrices I observed\nBrand: ${formatPHP(Number(observed.brandedPrice))}\nGeneric: ${formatPHP(Number(observed.genericPrice))}${impact}\nChecked: ${checkedAt ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(checkedAt)) : 'just now'}\n\nAsk a pharmacist: ${companion.copy.pharmacistQuestion}\n\nHealthBridge does not recommend changing medicine. Please confirm the exact pack with a pharmacist.`;
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function analyseObservedPrices() {
    if (!result) return;
    setPhase('loading');
    try {
      const response = await fetch('/api/medicine-companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comparisonId: result.id,
          observed: {
            strength: observed.strength,
            dosageForm: observed.dosageForm,
            packQuantity: Number(observed.packQuantity),
            brandedPrice: Number(observed.brandedPrice),
            genericPrice: Number(observed.genericPrice),
            confirmedSamePack: observed.confirmedSamePack,
          },
        }),
      });
      const data = (await response.json()) as CompanionResponse | { error?: string };
      if (!response.ok || !('packMatch' in data))
        throw new Error('error' in data ? data.error : 'We could not check those observed prices.');
      setCompanion(data);
      setCheckedAt(new Date().toISOString());
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }

  async function loadDrugInfo() {
    if (!result) return;
    setDrugInfoPhase('loading');
    try {
      const response = await fetch(`/api/drug-info?generic=${encodeURIComponent(result.generic)}`);
      const data = (await response.json()) as DrugInfoResponse;
      if (!response.ok || !data.indication || !data.warning) throw new Error();
      setDrugInfo(data);
      setDrugInfoPhase('ready');
    } catch {
      setDrugInfoPhase('error');
    }
  }

  async function searchPublicLabelData() {
    if (!query.trim()) return;
    setIdentityPhase('loading');
    try {
      const encodedQuery = encodeURIComponent(query.trim());
      const [identityResponse, rxNormResponse] = await Promise.all([
        fetch(`/api/medicine-identity?query=${encodedQuery}`),
        fetch(`/api/rxnorm-lookup?query=${encodedQuery}`),
      ]);
      const [identityData, rxNormData] = await Promise.all([
        identityResponse.json() as Promise<IdentityResponse>,
        rxNormResponse.json() as Promise<RxNormResponse>,
      ]);
      if (!identityResponse.ok && !rxNormResponse.ok) throw new Error();
      setIdentity(identityResponse.ok && Array.isArray(identityData.matches) ? identityData : null);
      setRxNorm(rxNormResponse.ok && Array.isArray(rxNormData.matches) ? rxNormData : null);
      setIdentityPhase('ready');
    } catch {
      setIdentityPhase('error');
    }
  }

  async function searchWithAi(value = query) {
    const searchQuery = value.trim();
    if (!searchQuery) return;
    const requestId = ++aiSearchRequestRef.current;
    setAiSearchPhase('loading');
    try {
      const response = await fetch('/api/ai-medicine-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = (await response.json()) as AiSearchResponse;
      if (!response.ok || !Array.isArray(data.matches) || !Array.isArray(data.sourceUrls))
        throw new Error();
      if (requestId !== aiSearchRequestRef.current) return;
      setAiSearch(data);
      setAiSearchPhase('ready');
    } catch {
      if (requestId !== aiSearchRequestRef.current) return;
      setAiSearchPhase('error');
    }
  }

  const canUseAiSearch = searched && !result && aiSearchPhase !== 'idle';

  return (
    <section
      aria-labelledby="medicine-check-heading"
      className="hb-counter-workspace rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          <Search className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">
            STEP 2 · MEDICINE + PRICE CHECK
          </p>
          <h2
            id="medicine-check-heading"
            className="mt-1 text-xl font-bold tracking-tight text-slate-950"
          >
            Check the pack, then your observed prices
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            HealthBridge verifies the pack details and calculates only from prices you enter. It
            never invents a price or recommends a switch.
          </p>
        </div>
      </div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          search();
        }}
        className="mt-5"
      >
        <label htmlFor="medicine-check" className="sr-only">
          Medicine brand or generic
        </label>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            id="medicine-check"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Biogesic or paracetamol"
            className="h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 text-base shadow-sm outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/10"
          />
          <button
            type="submit"
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <Search className="size-4" aria-hidden="true" />
            Check
          </button>
        </div>
      </form>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Try:</span>
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => search(example)}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            {example}
          </button>
        ))}
      </div>
      <TwinPackWorkspace />

      {result ? (
        <>
          <div className="mt-5 overflow-hidden rounded-2xl border border-teal-100">
            <div className="bg-teal-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
                Reference pack from HealthBridge
              </p>
              <p className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                {result.brand} <span className="text-slate-400">→</span> {result.generic}
              </p>
            </div>
            <dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
              <div className="p-4">
                <dt className="text-xs font-medium text-slate-500">Active ingredient</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {result.activeIngredient}
                </dd>
              </div>
              <div className="p-4">
                <dt className="text-xs font-medium text-slate-500">Strength &amp; form</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {result.strength} · {result.dosageForm}
                </dd>
              </div>
              <div className="p-4 sm:col-span-2">
                <dt className="text-xs font-medium text-slate-500">Pack to confirm</dt>
                <dd className="mt-1 text-sm font-semibold text-slate-900">
                  {result.packQuantity} {result.packUnit}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
              <p className="flex max-w-md gap-2 text-xs leading-5 text-slate-600">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
                Ask the pharmacist to confirm all four fields. HealthBridge does not tell you to
                change medicine.
              </p>
              <button
                type="button"
                onClick={() => void copyCard()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
              >
                <Clipboard className="size-4" aria-hidden="true" />
                {copied ? (
                  <>
                    <Check className="size-4 text-teal-700" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  'Copy check'
                )}
              </button>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm">
                <PhilippinePeso className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="font-semibold text-slate-950">Your observed price check</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Enter the price you personally see for the exact reference pack. These values are
                  not stored or treated as market prices.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                Observed strength
                <input
                  value={observed.strength}
                  onChange={(event) => updateObserved('strength', event.target.value)}
                  placeholder={result.strength}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Observed form
                <input
                  value={observed.dosageForm}
                  onChange={(event) => updateObserved('dosageForm', event.target.value)}
                  placeholder={result.dosageForm}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Observed pack quantity
                <input
                  type="number"
                  min="1"
                  value={observed.packQuantity}
                  onChange={(event) => updateObserved('packQuantity', event.target.value)}
                  placeholder={String(result.packQuantity)}
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </label>
              <span className="hidden sm:block" aria-hidden="true" />
              <label className="text-sm font-medium text-slate-700">
                Branded price you see (₱)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={observed.brandedPrice}
                  onChange={(event) => updateObserved('brandedPrice', event.target.value)}
                  placeholder="e.g. 50.00"
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Generic price you see (₱)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={observed.genericPrice}
                  onChange={(event) => updateObserved('genericPrice', event.target.value)}
                  placeholder="e.g. 20.00"
                  className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                />
              </label>
            </div>
            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-3 text-sm leading-5 text-slate-700">
              <input
                type="checkbox"
                checked={observed.confirmedSamePack}
                onChange={(event) => updateObserved('confirmedSamePack', event.target.checked)}
                className="mt-0.5 size-4 accent-teal-600"
              />
              I checked that both prices are for the same ingredient, strength, form, and pack.
            </label>
            <button
              type="button"
              onClick={() => void analyseObservedPrices()}
              disabled={phase === 'loading'}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:bg-slate-400"
            >
              {phase === 'loading' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {phase === 'loading' ? 'Checking your pack' : 'Analyze observed prices'}
            </button>
            {phase === 'error' ? (
              <p role="alert" className="mt-3 text-sm text-amber-800">
                Complete all fields with positive prices, then try again.
              </p>
            ) : null}
          </div>

          <PriceEvidenceCapture onApply={applyPriceEvidence} />
          <section
            className="mt-5 rounded-2xl border border-slate-200 bg-white p-4"
            aria-labelledby="label-context-heading"
          >
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-teal-700">
                <Database className="size-4" aria-hidden="true" />
              </span>
              <div>
                <h3 id="label-context-heading" className="font-semibold text-slate-950">
                  Optional public label context
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  View a short US FDA label reference for the ingredient. It is informational only
                  and does not assess symptoms or tell you what to take.
                </p>
              </div>
            </div>
            {!drugInfo ? (
              <>
                <button
                  type="button"
                  onClick={() => void loadDrugInfo()}
                  disabled={drugInfoPhase === 'loading'}
                  className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:text-slate-400"
                >
                  {drugInfoPhase === 'loading' ? (
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Database className="size-4" aria-hidden="true" />
                  )}
                  {drugInfoPhase === 'loading' ? 'Loading label' : 'View label reference'}
                </button>
                {drugInfoPhase === 'error' ? (
                  <p role="alert" className="mt-3 text-sm text-amber-800">
                    Label context is unavailable right now. You can still use the pack check above.
                  </p>
                ) : null}
              </>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Label purpose / use
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">{drugInfo.indication}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                    Label warning
                  </p>
                  <p className="mt-1 text-sm leading-6 text-amber-900">{drugInfo.warning}</p>
                </div>
                <p className="sm:col-span-2 text-xs text-slate-500">
                  Source:{' '}
                  {drugInfo.source === 'live'
                    ? 'openFDA live label data'
                    : 'HealthBridge cached label reference'}
                  . Confirm Philippine labeling with a pharmacist.
                </p>
              </div>
            )}
          </section>

          {companion ? (
            <div
              className={`mt-5 rounded-2xl border p-5 ${companion.packMatch.status === 'match' ? 'border-teal-100 bg-teal-50' : 'border-amber-200 bg-amber-50'}`}
            >
              {companion.packMatch.status === 'match' ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
                    Confirmed observed pack
                  </p>
                  {companion.impact?.status === 'saves' ? (
                    <>
                      <p className="mt-2 text-sm font-medium text-teal-900">
                        Potential difference for this pack
                      </p>
                      <p className="mt-1 text-4xl font-bold tracking-tight text-teal-800">
                        {formatPHP(companion.impact.savings)}
                      </p>
                      <p className="mt-1 text-sm text-teal-900">
                        {companion.impact.percent}% lower based on your entered prices.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-teal-900">
                      The generic is not lower based on the prices you entered.
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                    <AlertTriangle className="size-4" aria-hidden="true" />
                    Do not compare prices yet
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-900">
                    {companion.packMatch.differences.map((difference) => (
                      <li key={difference}>{difference}</li>
                    ))}
                  </ul>
                </>
              )}
              <div className="mt-4 border-t border-black/5 pt-4">
                <p className="text-sm leading-6 text-slate-700">{companion.copy.explanation}</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">
                  Ask: {companion.copy.pharmacistQuestion}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {companion.copy.source === 'ai'
                    ? 'GPT-5.6 explained your entered values; HealthBridge calculated the pack match and math.'
                    : 'Using the built-in safe explanation.'}
                </p>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
      {searched && !result ? (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm leading-6 text-amber-900"
        >
          <p>
            We do not have a local match for “{query.trim() || 'that medicine'}” yet. Search public
            medicine references for a possible identity, then confirm the ingredient, strength,
            form, and pack on the Philippine box with a pharmacist.
          </p>
          <button
            type="button"
            onClick={() => void searchPublicLabelData()}
            disabled={identityPhase === 'loading' || !query.trim()}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:bg-slate-400"
          >
            {identityPhase === 'loading' ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Database className="size-4" aria-hidden="true" />
            )}
            {identityPhase === 'loading' ? 'Searching references' : 'Search medicine references'}
          </button>
          {identityPhase === 'error' ? (
            <p role="alert" className="mt-3 text-sm">
              Reference search is unavailable. Bring the box or prescription to the pharmacist
              instead.
            </p>
          ) : null}
          {identity ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-white p-3 text-slate-700">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                Possible openFDA label matches
              </p>
              {identity.matches.length ? (
                <ul className="mt-2 space-y-2">
                  {identity.matches.map((match, index) => (
                    <li
                      key={`${match.brand}-${match.generic}-${index}`}
                      className="rounded-lg bg-slate-50 p-3"
                    >
                      <p className="font-semibold text-slate-950">
                        {match.brand ?? 'Unnamed brand'} <span className="text-slate-400">→</span>{' '}
                        {match.generic ?? 'Generic not listed'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-600">
                        {[match.dosageForm, match.manufacturer].filter(Boolean).join(' · ') ||
                          'Form and manufacturer not listed'}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">
                  No public label match was found. This does not prove the medicine is unavailable.
                </p>
              )}
              <p className="mt-3 text-xs leading-5 text-slate-500">{identity.notice}</p>
            </div>
          ) : null}
        </div>
      ) : null}
      {canUseAiSearch ? (
        <section
          className="mt-4 rounded-2xl border border-teal-100 bg-teal-50 p-4"
          aria-labelledby="ai-search-heading"
        >
          <p
            id="ai-search-heading"
            className="text-xs font-semibold uppercase tracking-wide text-teal-800"
          >
            GPT-5.6 · official-reference search
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-700">
            This typed name is outside the local reference catalog, so HealthBridge is checking
            official sources for a possible identity. It will not generate a price, dosage, or
            switching advice.
          </p>
          {!aiSearch ? (
            <>
              <button
                type="button"
                onClick={() => void searchWithAi()}
                disabled={aiSearchPhase === 'loading'}
                className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:bg-slate-400"
              >
                {aiSearchPhase === 'loading' ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Sparkles className="size-4" aria-hidden="true" />
                )}
                {aiSearchPhase === 'loading'
                  ? 'Searching official sources'
                  : 'Retry official-source search'}
              </button>
              {aiSearchPhase === 'error' ? (
                <p role="alert" className="mt-3 text-sm text-amber-800">
                  AI search is unavailable right now. Use the official Philippine FDA portal or ask
                  a pharmacist.
                </p>
              ) : null}
            </>
          ) : (
            <div className="mt-4 rounded-xl bg-white p-3">
              <p className="text-sm leading-6 text-slate-700">{aiSearch.notice}</p>
              {aiSearch.matches.length ? (
                <ul className="mt-3 space-y-2">
                  {aiSearch.matches.map((match, index) => (
                    <li key={`${match.name}-${index}`} className="rounded-lg bg-slate-50 p-3">
                      <p className="font-semibold text-slate-950">{match.name}</p>
                      {match.possibleGeneric ? (
                        <p className="mt-1 text-sm text-slate-700">
                          Possible ingredient: {match.possibleGeneric}
                        </p>
                      ) : null}
                      <p className="mt-1 text-xs leading-5 text-slate-500">{match.reason}</p>
                      <button
                        type="button"
                        onClick={() => setAiReference(match)}
                        className="mt-3 inline-flex min-h-9 items-center rounded-lg border border-teal-200 bg-white px-3 text-xs font-semibold text-teal-800 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                      >
                        Use as reference pack
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {aiSearch.sourceUrls.length ? (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Official sources checked
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {aiSearch.sourceUrls.map((url) => (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Open source
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
      {aiReference && aiSearch ? (
        <AiReferenceWorkspace candidate={aiReference} sourceUrls={aiSearch.sourceUrls} />
      ) : null}
      {rxNorm ? (
        <section
          className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-slate-700"
          aria-labelledby="rxnorm-heading"
        >
          <p
            id="rxnorm-heading"
            className="text-xs font-semibold uppercase tracking-wide text-slate-600"
          >
            NLM RxNorm name candidates
          </p>
          {rxNorm.matches.length ? (
            <ul className="mt-2 space-y-2">
              {rxNorm.matches.map((match) => (
                <li key={match.rxcui} className="rounded-xl bg-white p-3">
                  <p className="font-semibold text-slate-950">{match.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    RxCUI {match.rxcui} · candidate name only
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm">
              No RxNorm candidate was found. This does not prove the medicine is unavailable.
            </p>
          )}
          <p className="mt-3 text-xs leading-5 text-slate-500">{rxNorm.notice}</p>
        </section>
      ) : null}
      {result ? (
        <a
          href={PHILIPPINE_FDA_DRUG_SEARCH_URL}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
          Open official Philippine FDA record search
        </a>
      ) : null}
      {result && companion?.packMatch.status === 'match' ? (
        <section
          className="mt-5 overflow-hidden rounded-2xl border border-blue-200 bg-[#fffaf2] shadow-sm"
          aria-labelledby="counter-card-heading"
        >
          <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
              Counter card · reviewed by you
            </p>
            <h3
              id="counter-card-heading"
              className="mt-1 text-lg font-bold tracking-tight text-slate-950"
            >
              Ready to ask before you decide
            </h3>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Exact pack
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {result.activeIngredient} · {result.strength} · {result.dosageForm}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {result.packQuantity} {result.packUnit}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prices you observed
              </p>
              <p className="mt-1 text-sm text-slate-700">
                Brand {formatPHP(Number(observed.brandedPrice))} · Generic{' '}
                {formatPHP(Number(observed.genericPrice))}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Checked{' '}
                {checkedAt
                  ? new Intl.DateTimeFormat('en-PH', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(checkedAt))
                  : 'just now'}
              </p>
            </div>
          </div>
          <div className="border-t border-stone-200 bg-[#f0ece4] px-4 py-3">
            <p className="text-sm font-semibold text-slate-950">
              Ask: {companion.copy.pharmacistQuestion}
            </p>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-xl text-xs leading-5 text-slate-600">
                Your photos and prices are not saved. HealthBridge does not recommend changing
                medicine—confirm the exact pack with a pharmacist.
              </p>
              <button
                type="button"
                onClick={() => void copyCounterCard()}
                className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <Clipboard className="size-4" aria-hidden="true" />
                {copied ? 'Copied card' : 'Copy counter card'}
              </button>
            </div>
          </div>
        </section>
      ) : null}
      {result && companion?.packMatch.status === 'match' ? (
        <PriceImpactCard
          brandedPrice={Number(observed.brandedPrice)}
          genericPrice={Number(observed.genericPrice)}
          checkedAt={checkedAt}
        />
      ) : null}
      <p className="mt-4 text-xs leading-5 text-slate-500">
        Observed prices are for your comparison only. Pharmacy prices can vary by branch and date.
      </p>
    </section>
  );
}
