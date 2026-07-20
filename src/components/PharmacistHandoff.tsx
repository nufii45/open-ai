'use client';

import { Check, Share2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import type { CounterProofSection } from '@/lib/counterProof';
import { NOT_MEDICAL_ADVICE } from '@/lib/counterProof';

export function PharmacistHandoff({
  open,
  onClose,
  sections,
  text,
}: {
  open: boolean;
  onClose: () => void;
  sections: CounterProofSection[];
  text: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shared, setShared] = useState(false);

  // ponytail: <dialog> handles the backdrop, focus trap, and Esc. No portal, no library.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function close() {
    setShared(false);
    onClose();
  }

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: 'HealthBridge Counter Proof', text });
      else await navigator.clipboard.writeText(text);
      setShared(true);
    } catch {
      setShared(false);
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      aria-labelledby="pharmacist-handoff-heading"
      className="m-0 h-full max-h-none w-full max-w-none bg-[#fffaf2] p-0 text-slate-950 backdrop:bg-slate-950/70"
    >
      <div className="flex min-h-full flex-col">
        <div className="flex items-start justify-between gap-3 border-b-2 border-slate-950 bg-slate-950 px-4 py-4 text-white sm:px-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] text-teal-200">HEALTHBRIDGE</p>
            <h2 id="pharmacist-handoff-heading" className="mt-1 text-2xl font-bold sm:text-3xl">
              For the pharmacist
            </h2>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
          >
            <X className="size-6" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-4 py-6 sm:px-8">
          {sections.map((section) => (
            <section key={section.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-800">
                {section.heading}
              </h3>
              <ul className="mt-2 space-y-1.5">
                {section.lines.map((line) => (
                  <li
                    key={line}
                    className="text-lg font-semibold leading-7 text-slate-950 sm:text-xl"
                  >
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className="border-t border-stone-300 pt-4 text-sm leading-6 text-slate-600">
            {NOT_MEDICAL_ADVICE}
          </p>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-3 border-t border-stone-300 bg-[#f0ece4] px-4 py-4 sm:px-8">
          <button
            type="button"
            onClick={() => void share()}
            className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-base font-semibold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            {shared ? (
              <Check className="size-5" aria-hidden="true" />
            ) : (
              <Share2 className="size-5" aria-hidden="true" />
            )}
            {shared ? 'Summary copied' : 'Share this summary'}
          </button>
          <button
            type="button"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-stone-400 bg-white px-5 text-base font-semibold text-slate-700 transition hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </dialog>
  );
}
