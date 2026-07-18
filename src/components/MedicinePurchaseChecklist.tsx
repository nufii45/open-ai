'use client';

import { Check, X } from 'lucide-react';
import { formatPHP } from '@/lib/savings';
import type { SavedMedicine } from '@/lib/useSavedMedicines';

type MedicinePurchaseChecklistProps = {
  medicines: SavedMedicine[];
  onPurchaseChange: (id: string, isPurchased: boolean) => void;
  onRemove: (id: string) => void;
};

// This is a purchase-status checklist only. It deliberately does not imply
// adherence, a treatment plan, or that a medicine is suitable for the person.
export function MedicinePurchaseChecklist({
  medicines,
  onPurchaseChange,
  onRemove,
}: MedicinePurchaseChecklistProps) {
  return (
    <ul className="flex flex-col gap-2">
      {medicines.map((medicine) => {
        const checklistLabel = `${medicine.isPurchased ? 'Marked' : 'Mark'} ${medicine.brand} as bought`;

        return (
          <li
            key={medicine.id}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
          >
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={medicine.isPurchased}
                onChange={(event) => onPurchaseChange(medicine.id, event.target.checked)}
                aria-label={checklistLabel}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="flex size-6 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-transparent transition-colors peer-checked:border-teal-600 peer-checked:bg-teal-600 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-slate-500 peer-focus-visible:ring-offset-2"
              >
                <Check className="size-4" strokeWidth={2.5} />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-slate-900">
                  {medicine.brand} → {medicine.generic}
                </span>
                <span className="block text-sm text-emerald-700 tabular-nums">
                  Save {formatPHP(medicine.savings)}
                </span>
                <span className="block text-xs text-slate-500">
                  {medicine.isPurchased ? 'Marked as bought' : 'Not marked as bought'}
                </span>
              </span>
            </label>
            <button
              type="button"
              onClick={() => onRemove(medicine.id)}
              aria-label={`Remove ${medicine.brand} from my medicines`}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
