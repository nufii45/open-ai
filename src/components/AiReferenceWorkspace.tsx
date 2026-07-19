'use client';

import { Check, Clipboard, PhilippinePeso, ShieldCheck } from 'lucide-react';
import { useState } from 'react';

import { PriceEvidenceCapture } from '@/components/PriceEvidenceCapture';
import { PriceImpactCard } from '@/components/PriceImpactCard';
import type { AiMedicineCandidate } from '@/lib/aiMedicineSearch';

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

function isPositiveNumber(value: string) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

export function AiReferenceWorkspace({
  candidate,
  sourceUrls,
}: {
  candidate: AiMedicineCandidate;
  sourceUrls: string[];
}) {
  const [observed, setObserved] = useState<ObservedForm>(EMPTY_OBSERVED);
  const [showImpact, setShowImpact] = useState(false);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateObserved<K extends keyof ObservedForm>(key: K, value: ObservedForm[K]) {
    setObserved((current) => ({ ...current, [key]: value }));
    setShowImpact(false);
    setCheckedAt(null);
    setError(null);
  }

  function applyPriceEvidence(kind: 'branded' | 'generic', price: number) {
    updateObserved(kind === 'branded' ? 'brandedPrice' : 'genericPrice', price.toFixed(2));
  }

  function analyseObservedPrices() {
    const complete =
      observed.strength.trim() &&
      observed.dosageForm.trim() &&
      isPositiveNumber(observed.packQuantity) &&
      isPositiveNumber(observed.brandedPrice) &&
      isPositiveNumber(observed.genericPrice) &&
      observed.confirmedSamePack;

    if (!complete) {
      setError('Complete the physical pack and price fields, then confirm they are like-for-like.');
      return;
    }

    setError(null);
    setCheckedAt(new Date().toISOString());
    setShowImpact(true);
  }

  async function copyCheck() {
    if (!navigator.clipboard) return;
    const card = `HealthBridge possible product identity\n\nProduct: ${candidate.name}\nPossible ingredient: ${candidate.possibleGeneric ?? 'Not listed'}\n\nPlease help me confirm the ingredient, strength, form, and pack on this physical product before I compare prices or make a purchase decision.`;
    try {
      await navigator.clipboard.writeText(card);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="mt-5" aria-labelledby="ai-reference-pack-heading">
      <div className="overflow-hidden rounded-2xl border border-teal-100">
        <div className="bg-teal-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">
            Possible reference pack from official sources
          </p>
          <p
            id="ai-reference-pack-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-950"
          >
            {candidate.name}
            {candidate.possibleGeneric ? (
              <>
                <span className="text-slate-400"> → </span>
                {candidate.possibleGeneric}
              </>
            ) : null}
          </p>
        </div>
        <dl className="grid divide-y divide-slate-100 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="p-4">
            <dt className="text-xs font-medium text-slate-500">Possible active ingredient</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              {candidate.possibleGeneric ?? 'Confirm on the physical pack'}
            </dd>
          </div>
          <div className="p-4">
            <dt className="text-xs font-medium text-slate-500">Strength &amp; form</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              Read from the physical pack
            </dd>
          </div>
          <div className="p-4 sm:col-span-2">
            <dt className="text-xs font-medium text-slate-500">Pack to confirm</dt>
            <dd className="mt-1 text-sm font-semibold text-slate-900">
              Read the quantity on the physical pack
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-white px-4 py-3">
          <p className="flex max-w-md gap-2 text-xs leading-5 text-slate-600">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
            GPT-5.6 found a possible identity; it did not verify the exact pack or recommend a
            switch.
          </p>
          <button
            type="button"
            onClick={() => void copyCheck()}
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
              First copy the exact strength, form, and pack from the product. Then enter prices you
              personally see. These values are not stored or treated as market prices.
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ObservedInput
            label="Observed strength"
            value={observed.strength}
            onChange={(value) => updateObserved('strength', value)}
            placeholder="e.g. 500 mg"
          />
          <ObservedInput
            label="Observed form"
            value={observed.dosageForm}
            onChange={(value) => updateObserved('dosageForm', value)}
            placeholder="e.g. Tablet"
          />
          <ObservedInput
            label="Observed pack quantity"
            type="number"
            value={observed.packQuantity}
            onChange={(value) => updateObserved('packQuantity', value)}
            placeholder="e.g. 10"
          />
          <span className="hidden sm:block" aria-hidden="true" />
          <ObservedInput
            label="Branded price you see (₱)"
            type="number"
            value={observed.brandedPrice}
            onChange={(value) => updateObserved('brandedPrice', value)}
            placeholder="e.g. 50.00"
          />
          <ObservedInput
            label="Generic price you see (₱)"
            type="number"
            value={observed.genericPrice}
            onChange={(value) => updateObserved('genericPrice', value)}
            placeholder="e.g. 20.00"
          />
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
          onClick={analyseObservedPrices}
          className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
        >
          <Check className="size-4" aria-hidden="true" />
          Analyze observed prices
        </button>
        {error ? (
          <p role="alert" className="mt-3 text-sm text-amber-800">
            {error}
          </p>
        ) : null}
      </div>

      <PriceEvidenceCapture onApply={applyPriceEvidence} />
      {showImpact ? (
        <PriceImpactCard
          brandedPrice={Number(observed.brandedPrice)}
          genericPrice={Number(observed.genericPrice)}
          checkedAt={checkedAt}
        />
      ) : null}
      {sourceUrls.length ? (
        <p className="mt-4 text-xs leading-5 text-slate-500">
          Identity source:{' '}
          <a
            href={sourceUrls[0]}
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-teal-800 underline underline-offset-2"
          >
            official record
          </a>
          . Confirm the physical Philippine pack with a pharmacist before you purchase or change
          anything.
        </p>
      ) : null}
    </section>
  );
}

function ObservedInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: 'text' | 'number';
}) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        min={type === 'number' ? '0.01' : undefined}
        step={type === 'number' ? '0.01' : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-1 h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
      />
    </label>
  );
}
