'use client';

import { ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useDisclaimer } from '@/lib/useDisclaimer';

export function DisclaimerModal() {
  const { accepted, accept } = useDisclaimer();

  if (accepted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="disclaimer-title"
        aria-describedby="disclaimer-body"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex size-11 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
          <ShieldAlert className="size-6" />
        </div>
        <h2 id="disclaimer-title" className="mt-4 text-lg font-bold tracking-tight text-slate-950">
          Before you start
        </h2>
        <p id="disclaimer-body" className="mt-2 text-sm leading-relaxed text-slate-600">
          HealthBridge helps you prepare questions and practical checklists for a pharmacy, clinic,
          laboratory, or discharge visit. It is not medical advice and does not diagnose, prescribe,
          interpret results, or replace your care team.
        </p>
        <Button className="mt-6 h-9 w-full" onClick={accept}>
          I understand — continue
        </Button>
      </div>
    </div>
  );
}
