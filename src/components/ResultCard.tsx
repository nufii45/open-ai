'use client';

import { Check, Plus } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PharmacyLocator } from '@/components/PharmacyLocator';
import { NEAREST_SAMPLE_PHARMACIES } from '@/lib/pharmacies';
import { formatPercent, formatPHP } from '@/lib/savings';
import type { VerifiedLookup } from '@/lib/types';

const SAFETY_NOTE =
  'Compare the same strength, form, and pack size. Ask your pharmacist or prescriber before changing medicines.';

type ResultCardProps = {
  result: VerifiedLookup;
  isSaved: boolean;
  onSave: () => void;
};

export function ResultCard({ result, isSaved, onSave }: ResultCardProps) {
  const { comparison, savings, source } = result;
  const [packsPerMonth, setPacksPerMonth] = useState(1);
  const isEstimated = source === 'openai';
  const monthlySavings = savings.savings * packsPerMonth;
  const annualSavings = monthlySavings * 12;
  const priceCheckedOn = new Intl.DateTimeFormat('en-PH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${comparison.checkedOn}T00:00:00`));

  return (
    <article
      aria-label={`Savings for ${comparison.brand}`}
      className="flex flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      {/* Provenance is quiet, but visible before the savings claim. */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge className="bg-teal-50 px-2.5 py-1 text-teal-800">{comparison.category}</Badge>
        {isEstimated ? (
          <Badge
            title="Matched with AI help — confirm with your pharmacist."
            className="bg-amber-50 px-2.5 py-1 text-amber-800"
          >
            Estimated
          </Badge>
        ) : null}
      </div>

      {/* ── SAVINGS: the largest, boldest element on the screen ── */}
      <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center sm:px-6 sm:py-6">
        <p className="text-sm font-semibold text-emerald-800">Potential saving per matching pack</p>
        <p className="mt-1.5 text-5xl font-extrabold leading-none tracking-[-0.035em] text-emerald-700 tabular-nums sm:text-6xl">
          {formatPHP(savings.savings)}
        </p>
        <p className="mt-2.5 text-sm text-emerald-800">
          {formatPercent(savings.savingsPercent)} lower for {comparison.packQuantity}{' '}
          {comparison.packUnit}
        </p>
      </div>

      <section
        aria-labelledby="personal-savings-heading"
        className="rounded-xl border border-teal-200 bg-teal-50/60 p-4"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 id="personal-savings-heading" className="text-sm font-semibold text-teal-950">
              Make the saving personal
            </h3>
            <p className="mt-1 text-sm leading-5 text-teal-900/80">
              How many matching packs do you already buy each month?
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-teal-950">
            <span className="sr-only">Matching packs per month</span>
            <input
              type="number"
              min="1"
              max="31"
              step="1"
              inputMode="numeric"
              value={packsPerMonth}
              onChange={(event) => {
                const value = Number(event.target.value);
                setPacksPerMonth(Number.isFinite(value) ? Math.min(31, Math.max(1, Math.round(value))) : 1);
              }}
              className="h-10 w-16 rounded-lg border border-teal-300 bg-white px-2 text-center tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            />
            packs/month
          </label>
        </div>
        <div className="mt-4 grid grid-cols-2 divide-x divide-teal-200 rounded-lg border border-teal-200 bg-white">
          <div className="p-3">
            <p className="text-xs font-medium text-slate-600">Potential monthly saving</p>
            <p className="mt-1 text-xl font-bold text-teal-800 tabular-nums">{formatPHP(monthlySavings)}</p>
          </div>
          <div className="p-3">
            <p className="text-xs font-medium text-slate-600">Potential yearly saving</p>
            <p className="mt-1 text-xl font-bold text-teal-800 tabular-nums">{formatPHP(annualSavings)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs leading-5 text-teal-900/80">
          Based on the packs you already purchase. This is not a dosage or treatment recommendation.
        </p>
      </section>

      {/* Brand → generic */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-600">Compared products</p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg">
          <span className="font-semibold text-slate-950">{comparison.brand}</span>
          <span aria-hidden="true" className="text-slate-400">
            →
          </span>
          <span className="font-semibold text-slate-950">{comparison.generic}</span>
        </div>
        <p className="mt-1 text-sm leading-5 text-slate-600">
          Same active ingredient: <span className="font-medium text-slate-800">{comparison.activeIngredient}</span>
        </p>
      </div>

      {/* A single comparison surface keeps the two price sources easy to scan. */}
      <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <div className="flex items-start justify-between gap-4 p-4">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-slate-600">Branded price · {comparison.brand}</dt>
            <dd className="mt-1.5 text-xs leading-5 text-slate-500">{comparison.brandedPriceSource}</dd>
          </div>
          <dd className="shrink-0 text-xl font-semibold text-slate-950 tabular-nums">
            {formatPHP(comparison.brandedPrice)}
          </dd>
        </div>
        <div className="flex items-start justify-between gap-4 bg-emerald-50/60 p-4">
          <div className="min-w-0">
            <dt className="text-xs font-medium text-emerald-800">Generic price · {comparison.generic}</dt>
            <dd className="mt-1.5 text-xs leading-5 text-emerald-800/80">{comparison.genericPriceSource}</dd>
          </div>
          <dd className="shrink-0 text-xl font-semibold text-emerald-800 tabular-nums">
            {formatPHP(comparison.genericPrice)}
          </dd>
        </div>
      </dl>

      {/* Dosage note (strength / form / pack) */}
      <dl className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3 text-center">
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">Strength</dt>
          <dd className="text-sm font-medium text-slate-900">{comparison.strength}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">Form</dt>
          <dd className="text-sm font-medium text-slate-900">{comparison.dosageForm}</dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-wide text-slate-500">Pack</dt>
          <dd className="text-sm font-medium text-slate-900">
            {comparison.packQuantity} {comparison.packUnit}
          </dd>
        </div>
      </dl>

      {/* Optional reviewed detail + safety flag */}
      {comparison.indication ? (
        <p className="text-sm text-slate-600">{comparison.indication}</p>
      ) : null}
      {comparison.safetyFlag ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {comparison.safetyFlag}
        </p>
      ) : null}

      {/* Required safety note + provenance caption */}
      <div className="border-t border-slate-200 pt-4">
        <p className="text-sm leading-6 text-slate-700">{SAFETY_NOTE}</p>
        <p className="mt-3 text-xs text-slate-500">Prices checked on {priceCheckedOn}.</p>
      </div>

      {/* Save to my list */}
      <Button
        type="button"
        onClick={onSave}
        disabled={isSaved}
        aria-pressed={isSaved}
        className="h-12 w-full bg-teal-600 text-white shadow-sm transition-[background-color,transform] duration-200 ease-out hover:bg-teal-700 active:scale-[0.99] focus-visible:border-teal-600 focus-visible:ring-teal-600/30 disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 motion-reduce:transition-none motion-reduce:transform-none"
      >
        {isSaved ? (
          <>
            <Check aria-hidden="true" className="size-4" /> Saved to my list
          </>
        ) : (
          <>
            <Plus aria-hidden="true" className="size-4" /> Save to my list
          </>
        )}
      </Button>

      <PharmacyLocator pharmacies={NEAREST_SAMPLE_PHARMACIES} />
    </article>
  );
}
