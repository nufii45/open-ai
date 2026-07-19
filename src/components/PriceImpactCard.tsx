'use client';

import { ArrowDownRight, Equal, ShieldCheck } from 'lucide-react';

type PriceImpactCardProps = {
  brandedPrice: number;
  genericPrice: number;
  checkedAt: string | null;
};

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export function PriceImpactCard({ brandedPrice, genericPrice, checkedAt }: PriceImpactCardProps) {
  const difference = Math.round((brandedPrice - genericPrice) * 100) / 100;
  const percent = brandedPrice > 0 ? Math.round((difference / brandedPrice) * 100) : 0;
  const genericWidth =
    brandedPrice > 0 ? Math.max(8, Math.min(100, (genericPrice / brandedPrice) * 100)) : 100;
  const checkedLabel = checkedAt
    ? new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(
        new Date(checkedAt),
      )
    : 'just now';
  const lower = difference > 0;

  return (
    <section
      className="hb-price-impact-card mt-5 overflow-hidden rounded-[1.3rem] border border-blue-200 bg-[#fffaf2]"
      aria-labelledby="price-impact-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
            Your observed price impact
          </p>
          <h3
            id="price-impact-heading"
            className="mt-1 text-lg font-bold tracking-tight text-slate-950"
          >
            Compare the exact pack, side by side
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-[#fffaf2] px-2.5 py-1 text-xs font-semibold text-blue-900">
          <ShieldCheck className="size-3.5" aria-hidden="true" />
          Pack matched
        </span>
      </div>
      <div className="grid divide-y divide-stone-200 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Brand price you saw
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            {formatPHP(brandedPrice)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-full rounded-full bg-slate-700" />
          </div>
        </div>
        <div className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Generic price you saw
          </p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-blue-800">
            {formatPHP(genericPrice)}
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-700 transition-[width] duration-500"
              style={{ width: `${genericWidth}%` }}
            />
          </div>
        </div>
      </div>
      <div className="bg-[#f0ece4] px-4 py-4">
        {lower ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Potential difference for this exact pack
              </p>
              <p className="mt-1 flex items-center gap-2 text-4xl font-bold tracking-tight text-blue-800">
                <ArrowDownRight className="size-7" aria-hidden="true" />
                {formatPHP(difference)}
              </p>
              <p className="mt-1 text-sm font-medium text-blue-900">
                {percent}% lower based only on the two prices you entered.
              </p>
            </div>
            <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-semibold text-white">
              Observed, not a market quote
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Equal className="mt-0.5 size-5 shrink-0 text-slate-700" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                No lower generic price in this comparison
              </p>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                These are the prices you observed for this matched pack. Confirm details and
                availability with a pharmacist.
              </p>
            </div>
          </div>
        )}
        <p className="mt-3 border-t border-stone-300 pt-3 text-xs leading-5 text-slate-500">
          Checked {checkedLabel}. Pharmacy prices can vary by branch and date; HealthBridge does not
          recommend changing medicine.
        </p>
      </div>
    </section>
  );
}
