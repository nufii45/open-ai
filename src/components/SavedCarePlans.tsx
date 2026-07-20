'use client';

import { CalendarCheck2, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import type { SavedCarePlan } from '@/lib/careBrief';

export function SavedCarePlans({
  saved,
  onRemove,
  onClear,
}: {
  saved: SavedCarePlan[];
  onRemove: (id: string) => void;
  onClear: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [clearOpen, setClearOpen] = useState(false);
  const clearDialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = clearDialogRef.current;
    if (!dialog) return;
    if (clearOpen && !dialog.open) dialog.showModal();
    if (!clearOpen && dialog.open) dialog.close();
  }, [clearOpen]);

  function closeClearDialog() {
    setClearOpen(false);
  }

  function confirmClear() {
    setClearOpen(false);
    onClear();
  }

  return (
    <>
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
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm leading-6 text-slate-600">Saved only on this device.</p>
          <button
            type="button"
            onClick={() => setClearOpen(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700"
          >
            <Trash2 className="size-3.5" aria-hidden="true" />
            Clear local data
          </button>
        </div>
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

      <dialog
        ref={clearDialogRef}
        onClose={closeClearDialog}
        aria-labelledby="clear-local-data-title"
        className="w-[calc(100%-2rem)] max-w-md rounded-[1.5rem] border border-stone-200 bg-[#fffaf2] p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/55"
      >
        <div className="border-b border-stone-200 bg-[#f0ece4] p-5">
          <div className="flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
              <Trash2 className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                Device privacy
              </p>
              <h2 id="clear-local-data-title" className="mt-1 text-xl font-bold tracking-tight">
                Clear local HealthBridge data?
              </h2>
            </div>
          </div>
        </div>
        <div className="p-5">
          <p className="text-sm leading-6 text-slate-600">
            This removes saved visit plans and temporary browser session data from this device. It
            cannot be undone, and nothing is deleted from a clinic, pharmacy, or hospital system.
          </p>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeClearDialog}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              Keep my data
            </button>
            <button
              type="button"
              onClick={confirmClear}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Clear local data
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
