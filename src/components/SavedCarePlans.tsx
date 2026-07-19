'use client';

import { CalendarCheck2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import type { SavedCarePlan } from '@/lib/careBrief';

export function SavedCarePlans({
  saved,
  onRemove,
}: {
  saved: SavedCarePlan[];
  onRemove: (id: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.aside
      layout
      aria-labelledby="saved-plans-heading"
      className="hb-saved-companion rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-center gap-2">
        <CalendarCheck2 className="size-5 text-teal-700" aria-hidden="true" />
        <h2
          id="saved-plans-heading"
          className="text-lg font-semibold tracking-tight text-slate-950"
        >
          My visit plans
        </h2>
      </div>
      <p className="mt-1 text-sm leading-6 text-slate-600">Saved only on this device.</p>
      {saved.length === 0 ? (
        <p className="mt-4 border-y border-dashed border-slate-300 py-4 text-center text-sm leading-6 text-slate-600">
          No saved plans yet. Prepare a visit to keep its checklist here.
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100 border-y border-slate-200">
          <AnimatePresence initial={false}>
            {saved.map((plan) => (
              <motion.li
                layout
                key={plan.id}
                initial={reduceMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, x: 12, height: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between gap-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{plan.title}</p>
                  <p className="text-xs text-slate-500">
                    Saved {new Date(plan.savedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(plan.id)}
                  className="inline-flex size-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                  aria-label={`Remove ${plan.title}`}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </motion.aside>
  );
}
