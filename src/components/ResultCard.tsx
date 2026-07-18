'use client';

import { Check, MapPin, Plus, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { PharmacyLocator } from '@/components/PharmacyLocator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NEAREST_SAMPLE_PHARMACIES } from '@/lib/pharmacies';
import { formatPercent, formatPHP } from '@/lib/savings';
import type { VerifiedLookup } from '@/lib/types';

const SAFETY_NOTE = 'Compare the same strength, form, and pack size. Ask your pharmacist or prescriber before changing medicines.';

type ResultTab = 'compare' | 'impact' | 'pharmacies';

type ResultCardProps = {
  result: VerifiedLookup;
  isSaved: boolean;
  onSave: () => void;
};

export function ResultCard({ result, isSaved, onSave }: ResultCardProps) {
  const { comparison, savings, source } = result;
  const [activeTab, setActiveTab] = useState<ResultTab>('compare');
  const [packsPerMonth, setPacksPerMonth] = useState(1);
  const panelId = `${comparison.id}-panel`;
  const isEstimated = source === 'openai';
  const monthlySavings = savings.savings * packsPerMonth;
  const annualSavings = monthlySavings * 12;
  const priceCheckedOn = new Intl.DateTimeFormat('en-PH', {
    day: 'numeric', month: 'short', year: 'numeric',
  }).format(new Date(`${comparison.checkedOn}T00:00:00`));

  const tabs: Array<{ id: ResultTab; label: string; icon: typeof Sparkles }> = [
    { id: 'compare', label: 'Compare', icon: Sparkles },
    { id: 'impact', label: 'Your impact', icon: Sparkles },
    { id: 'pharmacies', label: 'Pharmacies', icon: MapPin },
  ];

  return (
    <article aria-label={`Savings for ${comparison.brand}`} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(15,23,42,0.35)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
        <Badge className="bg-teal-50 px-2.5 py-1 text-teal-800">{comparison.category}</Badge>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="size-2 rounded-full bg-emerald-500" aria-hidden="true" />
          Verified comparison
          {isEstimated ? <Badge className="bg-amber-50 text-amber-800">Estimated match</Badge> : null}
        </div>
      </div>

      <div className="px-5 pt-5 sm:px-6">
        <div className="grid grid-cols-3 rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Medicine result sections">
          {tabs.map(({ id, label, icon: Icon }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                id={`${comparison.id}-${id}-tab`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                onClick={() => setActiveTab(id)}
                className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors sm:text-sm ${selected ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-950'}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{id === 'impact' ? 'Impact' : label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div id={panelId} role="tabpanel" aria-labelledby={`${comparison.id}-${activeTab}-tab`} className="p-5 sm:p-6">
        {activeTab === 'compare' ? (
          <div className="space-y-6">
            <div className="rounded-2xl bg-emerald-50 px-4 py-5 text-center sm:px-6 sm:py-6">
              <p className="text-sm font-semibold text-emerald-800">Potential saving per matching pack</p>
              <p className="mt-1.5 text-5xl font-extrabold leading-none tracking-[-0.035em] text-emerald-700 tabular-nums sm:text-6xl">{formatPHP(savings.savings)}</p>
              <p className="mt-2.5 text-sm text-emerald-800">{formatPercent(savings.savingsPercent)} lower for {comparison.packQuantity} {comparison.packUnit}</p>
            </div>

            <div>
              <p className="mb-2 text-xs font-medium text-slate-600">Compared products</p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-lg">
                <span className="font-semibold text-slate-950">{comparison.brand}</span>
                <span aria-hidden="true" className="text-slate-400">→</span>
                <span className="font-semibold text-slate-950">{comparison.generic}</span>
              </div>
              <p className="mt-1 text-sm leading-5 text-slate-600">Same active ingredient: <span className="font-medium text-slate-800">{comparison.activeIngredient}</span></p>
            </div>

            <dl className="divide-y divide-slate-200 rounded-xl border border-slate-200 lg:grid lg:grid-cols-2 lg:divide-x lg:divide-y-0">
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0"><dt className="text-xs font-medium text-slate-600">Branded price · {comparison.brand}</dt><dd className="mt-1.5 text-xs leading-5 text-slate-500">{comparison.brandedPriceSource}</dd></div>
                <dd className="shrink-0 text-xl font-semibold text-slate-950 tabular-nums">{formatPHP(comparison.brandedPrice)}</dd>
              </div>
              <div className="flex items-start justify-between gap-4 bg-emerald-50/60 p-4">
                <div className="min-w-0"><dt className="text-xs font-medium text-emerald-800">Generic price · {comparison.generic}</dt><dd className="mt-1.5 text-xs leading-5 text-emerald-800/80">{comparison.genericPriceSource}</dd></div>
                <dd className="shrink-0 text-xl font-semibold text-emerald-800 tabular-nums">{formatPHP(comparison.genericPrice)}</dd>
              </div>
            </dl>

            <dl className="grid grid-cols-3 divide-x divide-slate-200 rounded-xl bg-slate-50 py-3 text-center">
              <div><dt className="text-[11px] uppercase tracking-wide text-slate-500">Strength</dt><dd className="text-sm font-medium text-slate-900">{comparison.strength}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wide text-slate-500">Form</dt><dd className="text-sm font-medium text-slate-900">{comparison.dosageForm}</dd></div>
              <div><dt className="text-[11px] uppercase tracking-wide text-slate-500">Pack</dt><dd className="text-sm font-medium text-slate-900">{comparison.packQuantity} {comparison.packUnit}</dd></div>
            </dl>

            {comparison.indication ? <p className="text-sm text-slate-600">{comparison.indication}</p> : null}
            {comparison.safetyFlag ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{comparison.safetyFlag}</p> : null}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm leading-6 text-slate-700">{SAFETY_NOTE}</p>
              <p className="mt-3 text-xs text-slate-500">Prices checked on {priceCheckedOn}.</p>
            </div>
          </div>
        ) : null}

        {activeTab === 'impact' ? (
          <section aria-labelledby="personal-savings-heading" className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-teal-800">Your personal savings plan</p>
              <h3 id="personal-savings-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">Turn one pack into a yearly impact.</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">Use the number of matching packs you already buy each month.</p>
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50/60 p-4 text-sm font-medium text-teal-950">
              Matching packs per month
              <input type="number" min="1" max="31" step="1" inputMode="numeric" value={packsPerMonth} onChange={(event) => {
                const value = Number(event.target.value);
                setPacksPerMonth(Number.isFinite(value) ? Math.min(31, Math.max(1, Math.round(value))) : 1);
              }} className="h-11 w-20 rounded-lg border border-teal-300 bg-white px-2 text-center text-base tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-teal-600" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-950 p-5 text-white"><p className="text-sm text-slate-300">Potential monthly saving</p><p className="mt-2 text-3xl font-bold tabular-nums">{formatPHP(monthlySavings)}</p></div>
              <div className="rounded-2xl bg-teal-600 p-5 text-white"><p className="text-sm text-teal-50">Potential yearly saving</p><p className="mt-2 text-3xl font-bold tabular-nums">{formatPHP(annualSavings)}</p></div>
            </div>
            <p className="text-xs leading-5 text-slate-500">Based on the packs you already purchase. This is not a dosage or treatment recommendation.</p>
          </section>
        ) : null}

        {activeTab === 'pharmacies' ? <PharmacyLocator pharmacies={NEAREST_SAMPLE_PHARMACIES} /> : null}
      </div>

      <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:px-6">
        <Button type="button" onClick={onSave} disabled={isSaved} aria-pressed={isSaved} className="h-12 w-full bg-teal-600 text-white hover:bg-teal-700 disabled:bg-slate-200 disabled:text-slate-600">
          {isSaved ? <><Check aria-hidden="true" className="size-4" /> Saved to my list</> : <><Plus aria-hidden="true" className="size-4" /> Save verified comparison</>}
        </Button>
      </div>
    </article>
  );
}
