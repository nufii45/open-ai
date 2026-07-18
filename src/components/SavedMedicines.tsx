'use client';

import { X } from 'lucide-react';
import { formatPHP } from '@/lib/savings';
import type { SavedMedicine } from '@/lib/useSavedMedicines';

type SavedMedicinesProps = {
  saved: SavedMedicine[];
  onRemove: (id: string) => void;
};

// "My medicines" — the list a person builds up while comparing. Each row shows
// the name and its verified savings, with a remove control. Empty state guides
// the first save.
export function SavedMedicines({ saved, onRemove }: SavedMedicinesProps) {
  const total = saved.reduce((sum, m) => sum + m.savings, 0);

  return (
    <section aria-labelledby="saved-heading" className="mt-8 lg:mt-0 lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:p-5 lg:shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 id="saved-heading" className="text-lg font-semibold text-slate-900">
          My medicines
        </h2>
        {saved.length > 0 ? (
          <span className="text-sm font-medium text-emerald-800">
            Total potential savings {formatPHP(total)}
          </span>
        ) : null}
      </div>

      {saved.length === 0 ? (
        <p className="border-y border-dashed border-slate-300 py-4 text-center text-sm leading-6 text-slate-600">
          No saved medicines yet. Save a verified comparison to keep it here.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {saved.map((medicine) => (
            <li
              key={medicine.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">
                  {medicine.brand} → {medicine.generic}
                </p>
                <p className="text-sm text-emerald-700 tabular-nums">
                  Save {formatPHP(medicine.savings)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemove(medicine.id)}
                aria-label={`Remove ${medicine.brand} from my medicines`}
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
