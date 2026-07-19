'use client';

import {
  Check,
  ClipboardCheck,
  Copy,
  Languages,
  LoaderCircle,
  Share2,
  UsersRound,
} from 'lucide-react';
import { useState } from 'react';

import type { CareJourney } from '@/lib/careJourneys';
import {
  CARE_SAFETY_REMINDER,
  type CareBriefResponse,
  type RelayAudience,
  type RelayLanguage,
} from '@/lib/careBrief';

type BriefPhase = 'idle' | 'loading' | 'ready' | 'error';

const audienceOptions: Array<{ value: RelayAudience; label: string }> = [
  { value: 'self', label: 'For myself' },
  { value: 'caregiver', label: 'Helping someone' },
];
const languageOptions: Array<{ value: RelayLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'fil', label: 'Filipino' },
];

export function CareVisitBrief({
  journey,
  onSave,
  saved,
}: {
  journey: CareJourney;
  onSave: () => void;
  saved: boolean;
}) {
  const [phase, setPhase] = useState<BriefPhase>('idle');
  const [brief, setBrief] = useState<CareBriefResponse | null>(null);
  const [audience, setAudience] = useState<RelayAudience>('self');
  const [language, setLanguage] = useState<RelayLanguage>('en');
  const [copied, setCopied] = useState(false);

  function resetChoice() {
    setBrief(null);
    setPhase('idle');
    setCopied(false);
  }
  function changeAudience(value: RelayAudience) {
    setAudience(value);
    resetChoice();
  }
  function changeLanguage(value: RelayLanguage) {
    setLanguage(value);
    resetChoice();
  }

  async function prepare() {
    setPhase('loading');
    try {
      const response = await fetch('/api/care-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ journeyId: journey.id, audience, language }),
      });
      const data = (await response.json()) as CareBriefResponse;
      if (
        !response.ok ||
        !data.summary ||
        !data.primaryQuestion ||
        !Array.isArray(data.checklist) ||
        !data.relay?.openingLine
      )
        throw new Error();
      setBrief(data);
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }

  function shareText() {
    if (!brief) return '';
    return `${brief.relay.openingLine}\n\n${brief.primaryQuestion}\n\nBring or confirm:\n${brief.checklist.map((item) => `- ${item}`).join('\n')}\n\n${CARE_SAFETY_REMINDER}`;
  }

  async function copy() {
    if (!brief || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(shareText());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (!brief || !navigator.share) return;
    try {
      await navigator.share({ title: `HealthBridge — ${journey.title}`, text: shareText() });
    } catch {
      /* Native share can be cancelled. */
    }
  }

  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  return (
    <section
      className="hb-stage-panel rounded-[1.5rem] border border-stone-300 bg-[#f8f1e7] p-5 shadow-sm sm:p-6"
      aria-labelledby="brief-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-blue-800">
            STEP 3 · CARE RELAY
          </p>
          <h2 id="brief-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
            Prepare a handoff card
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
            A grounded opening for yourself or a family member—without entering health details.
          </p>
        </div>
        <span className="rounded-full border border-blue-200 bg-[#e6e7f8] px-3 py-1 text-xs font-medium text-blue-900">
          No medical details needed
        </span>
      </div>

      <div className="mt-5 grid gap-4 rounded-2xl border border-stone-200 bg-[#f2eadf] p-4 sm:grid-cols-2">
        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <UsersRound className="size-4 text-blue-800" aria-hidden="true" />
            Who is this for?
          </legend>
          <div className="mt-2 flex rounded-xl border border-stone-300 bg-[#fbf8f2] p-1">
            {audienceOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeAudience(option.value)}
                aria-pressed={audience === option.value}
                className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${audience === option.value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-stone-100'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Languages className="size-4 text-blue-800" aria-hidden="true" />
            Preferred language
          </legend>
          <div className="mt-2 flex rounded-xl border border-stone-300 bg-[#fbf8f2] p-1">
            {languageOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => changeLanguage(option.value)}
                aria-pressed={language === option.value}
                className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${language === option.value ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-stone-100'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {!brief ? (
        <div className="mt-4 border-l-2 border-blue-800 bg-[#fbf8f2] p-5">
          <p className="text-sm leading-6 text-slate-700">
            HealthBridge creates one respectful opening line for this{' '}
            {journey.shortTitle.toLowerCase()} visit, then attaches a controlled checklist
            underneath.
          </p>
          <button
            type="button"
            onClick={() => void prepare()}
            disabled={phase === 'loading'}
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:bg-slate-400"
          >
            {phase === 'loading' ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <ClipboardCheck className="size-4" aria-hidden="true" />
            )}
            {phase === 'loading' ? 'Creating your relay' : 'Create Care Relay'}
          </button>
          {phase === 'error' ? (
            <p role="alert" className="mt-3 text-sm text-amber-800">
              We could not create a card right now. Please try again.
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <div className="hb-relay-card overflow-hidden rounded-2xl text-white">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">
                Care Relay · {brief.relay.language === 'fil' ? 'Filipino' : 'English'}
              </p>
              <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200">
                {brief.relay.audience === 'caregiver' ? 'Caregiver handoff' : 'Personal card'}
              </span>
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Say this at the {journey.id === 'pharmacy' ? 'counter' : 'visit'}
              </p>
              <p className="mt-2 text-lg font-semibold leading-7 tracking-tight">
                “{brief.relay.openingLine}”
              </p>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-700">{brief.summary}</p>
          <div className="rounded-2xl border border-blue-200 bg-[#e6e7f8] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
              Canonical question to ask
            </p>
            <p className="mt-1 text-base font-semibold text-slate-950">{brief.primaryQuestion}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Bring or confirm</p>
            <ul className="mt-2 space-y-2">
              {brief.checklist.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-6 text-slate-700">
                  <Check className="mt-1 size-4 shrink-0 text-blue-700" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void copy()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-[#fbf8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <Copy className="size-4" aria-hidden="true" />
              {copied ? 'Copied' : 'Copy card'}
            </button>
            {canShare ? (
              <button
                type="button"
                onClick={() => void share()}
                className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-[#fbf8f2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
              >
                <Share2 className="size-4" aria-hidden="true" />
                Share relay
              </button>
            ) : null}
            <button
              type="button"
              onClick={onSave}
              disabled={saved}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-800 px-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:bg-blue-100 disabled:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
            >
              <ClipboardCheck className="size-4" aria-hidden="true" />
              {saved ? 'Saved to my plans' : 'Save my plan'}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            {brief.relay.source === 'ai'
              ? 'GPT-5.6 adapted the opening line; the checklist remains controlled by HealthBridge.'
              : 'Using the built-in safe relay template.'}
          </p>
        </div>
      )}
      <p className="mt-5 border-t border-stone-300 pt-4 text-xs leading-5 text-slate-500">
        {CARE_SAFETY_REMINDER}
      </p>
    </section>
  );
}
