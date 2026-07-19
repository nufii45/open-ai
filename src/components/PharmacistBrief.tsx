'use client';

import { Check, ClipboardCopy, MessageCircleQuestion, Sparkles } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import type { PharmacistBrief as PharmacistBriefContent } from '@/lib/pharmacistBrief';

type BriefState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ready'; source: 'gpt-5.6-terra' | 'template'; brief: PharmacistBriefContent }
  | { status: 'error' };

export function PharmacistBrief({ comparisonId }: { comparisonId: string }) {
  const [state, setState] = useState<BriefState>({ status: 'idle' });
  const [copied, setCopied] = useState(false);

  async function prepareBrief() {
    setState({ status: 'loading' });
    try {
      const response = await fetch('/api/pharmacist-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comparisonId }),
      });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== 'object') throw new Error('Brief unavailable');
      const value = payload as { status?: string; source?: 'gpt-5.6-terra' | 'template'; brief?: PharmacistBriefContent };
      if (value.status !== 'ready' || !value.brief || !value.source) throw new Error('Brief unavailable');
      setState({ status: 'ready', source: value.source, brief: value.brief });
    } catch {
      setState({ status: 'error' });
    }
  }

  async function copyBrief() {
    if (state.status !== 'ready') return;
    const text = [state.brief.summary, state.brief.pharmacistQuestion, ...state.brief.checklist, state.brief.safetyReminder].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2_000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section aria-labelledby="pharmacist-brief-heading" className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white">
          <MessageCircleQuestion className="size-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-teal-900">Ask before you switch</p>
          <h3 id="pharmacist-brief-heading" className="mt-0.5 text-lg font-bold tracking-tight text-slate-950">Prepare a pharmacist-ready question</h3>
          <p className="mt-1 text-sm leading-6 text-slate-700">Turn this verified comparison into a short checklist for your pharmacist. No symptoms or personal health details are collected.</p>
        </div>
      </div>

      {state.status === 'idle' || state.status === 'error' ? (
        <div className="mt-4">
          <Button type="button" onClick={() => void prepareBrief()} className="h-10 w-full bg-teal-700 text-white hover:bg-teal-800">
            <Sparkles className="size-4" aria-hidden="true" /> Prepare my pharmacist question
          </Button>
          {state.status === 'error' ? <p role="status" className="mt-2 text-xs text-slate-600">The brief is unavailable right now. Please use the comparison checklist above when speaking with a pharmacist.</p> : null}
        </div>
      ) : null}

      {state.status === 'loading' ? <p role="status" className="mt-4 text-sm text-slate-700">Preparing your question…</p> : null}

      {state.status === 'ready' ? (
        <div className="mt-4 rounded-xl border border-teal-200 bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-800">{state.source === 'gpt-5.6-terra' ? 'GPT-5.6 assisted brief' : 'Ready-to-use template'}</p>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyBrief()}>
              {copied ? <Check className="size-3.5" aria-hidden="true" /> : <ClipboardCopy className="size-3.5" aria-hidden="true" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-700">{state.brief.summary}</p>
          <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm font-medium leading-6 text-slate-950">“{state.brief.pharmacistQuestion}”</p>
          <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
            {state.brief.checklist.map((item) => <li key={item} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />{item}</li>)}
          </ul>
          <p className="mt-3 text-xs leading-5 text-slate-600">{state.brief.safetyReminder}</p>
        </div>
      ) : null}
    </section>
  );
}
