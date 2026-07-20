'use client';

import { CalendarCheck2, Trash2, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';

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

  useEffect(() => {
    if (!clearOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setClearOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
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

      <AnimatePresence>
        {clearOpen ? (
          <motion.div
            role="presentation"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            onMouseDown={closeClearDialog}
            className="fixed inset-0 z-[70] flex items-end bg-slate-950/55 p-3 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-6"
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="clear-local-data-title"
              initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: reduceMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
              onMouseDown={(event) => event.stopPropagation()}
              className="max-h-[calc(100svh-1.5rem)] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-stone-200 bg-[#fffaf2] text-slate-950 shadow-2xl sm:max-h-[calc(100svh-3rem)]"
            >
              <div className="border-b border-stone-200 bg-[#f0ece4] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                    <Trash2 className="size-5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-red-700">
                      Device privacy
                    </p>
                    <h2
                      id="clear-local-data-title"
                      className="mt-1 text-xl font-bold tracking-tight sm:text-2xl"
                    >
                      Clear local HealthBridge data?
                    </h2>
                  </div>
                </div>
              </div>
              <div className="p-5 sm:p-6">
                <p className="text-sm leading-6 text-slate-600">
                  This removes saved visit plans and temporary browser session data from this
                  device. It cannot be undone, and nothing is deleted from a clinic, pharmacy, or
                  hospital system.
                </p>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={closeClearDialog}
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                  >
                    Keep my data
                  </button>
                  <button
                    type="button"
                    onClick={confirmClear}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Clear local data
                  </button>
                </div>
              </div>
            </motion.section>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
