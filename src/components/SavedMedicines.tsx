'use client';

import { formatPHP } from '@/lib/savings';
import type { SavedMedicine } from '@/lib/useSavedMedicines';
import { MedicinePurchaseChecklist } from '@/components/MedicinePurchaseChecklist';

type SavedMedicinesProps = {
  saved: SavedMedicine[];
  onPurchaseChange: (id: string, isPurchased: boolean) => void;
  onRemove: (id: string) => void;
};

// "My medicines" — the list a person builds up while comparing. Each row shows
// the name and its verified savings, with a remove control. Empty state guides
// the first save.
export function SavedMedicines({ saved, onPurchaseChange, onRemove }: SavedMedicinesProps) {
  const total = saved.reduce((sum, m) => sum + m.savings, 0);

  return (
    <section
      aria-labelledby="saved-heading"
      className="mt-8 lg:sticky lg:top-6 lg:mt-0 lg:rounded-xl lg:border lg:border-slate-200 lg:bg-white lg:p-5 lg:shadow-sm"
    >
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
        <>
          <p className="mb-2 text-xs leading-5 text-slate-600">
            Mark a medicine as bought once you have purchased it. This does not replace advice from
            a pharmacist or prescriber.
          </p>
          <MedicinePurchaseChecklist
            medicines={saved}
            onPurchaseChange={onPurchaseChange}
            onRemove={onRemove}
          />
        </>
      )}
    </section>
  );
}
