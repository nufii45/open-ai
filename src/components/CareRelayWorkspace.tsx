'use client';

import {
  Check,
  ClipboardCheck,
  Copy,
  FileText,
  Languages,
  Printer,
  Share2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UsersRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { CareJourney } from '@/lib/careJourneys';
import { CARE_SAFETY_REMINDER } from '@/lib/careBrief';
import {
  CARE_RELAY_PRIVACY_NOTICE,
  CARE_RELAY_SAFETY_LIMITS,
  CARE_RELAY_STORAGE_KEY,
  DEFAULT_CARE_RELAY_DRAFT,
  type CareRelayDraft,
  careRelayChecklist,
  careRelayOpeningLine,
  careRelayQuestions,
  readCareRelayDraft,
} from '@/lib/careRelay';
import { openStyledPrintPreview } from '@/lib/printDocument';

type QuestionState = { id: string; text: string };

function loadDraft() {
  if (typeof window === 'undefined') return DEFAULT_CARE_RELAY_DRAFT;
  try {
    return readCareRelayDraft(
      JSON.parse(window.localStorage.getItem(CARE_RELAY_STORAGE_KEY) ?? 'null'),
    );
  } catch {
    return DEFAULT_CARE_RELAY_DRAFT;
  }
}

function makeQuestions(
  journey: CareJourney,
  language: CareRelayDraft['language'],
): QuestionState[] {
  return careRelayQuestions(journey, language).map((text, index) => ({
    id: `${journey.id}-${language}-${index}`,
    text,
  }));
}

export function CareRelayWorkspace({
  journey,
  onSave,
  saved,
}: {
  journey: CareJourney;
  onSave: () => void;
  saved: boolean;
}) {
  const [draft, setDraft] = useState<CareRelayDraft>(loadDraft);
  const [questions, setQuestions] = useState<QuestionState[]>(() =>
    makeQuestions(journey, loadDraft().language),
  );
  const [copied, setCopied] = useState(false);
  const [printError, setPrintError] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(CARE_RELAY_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Storage is optional. The card remains usable for this browser session.
    }
  }, [draft]);

  const openingLine = useMemo(() => careRelayOpeningLine(journey, draft), [draft, journey]);
  const checklist = useMemo(() => careRelayChecklist(journey, draft), [draft, journey]);
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator;

  function updateDraft(next: Partial<CareRelayDraft>) {
    setDraft((current) => ({ ...current, ...next }));
    setCopied(false);
  }

  function changeLanguage(language: CareRelayDraft['language']) {
    updateDraft({ language });
    setQuestions(makeQuestions(journey, language));
  }

  function resetQuestions() {
    setQuestions(makeQuestions(journey, draft.language));
  }

  function relayText() {
    return [
      `HealthBridge Care Relay · ${journey.title}`,
      '',
      'Opening line',
      openingLine,
      '',
      'Questions to ask',
      ...questions.map((question) => `- ${question.text}`),
      '',
      'Bring or confirm',
      ...checklist.map((item) => `- ${item}`),
      '',
      CARE_RELAY_SAFETY_LIMITS,
      CARE_SAFETY_REMINDER,
    ].join('\n');
  }

  async function copyRelay() {
    if (!navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(relayText());
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  async function shareRelay() {
    if (!navigator.share) return;
    try {
      await navigator.share({ title: `HealthBridge · ${journey.title}`, text: relayText() });
    } catch {
      // A cancelled native share sheet does not require an error state.
    }
  }

  function printRelay() {
    const opened = openStyledPrintPreview({
      eyebrow: `HealthBridge · ${journey.shortTitle}`,
      title: 'Care Relay',
      subtitle:
        draft.audience === 'caregiver'
          ? 'Prepared for a caregiver handoff.'
          : 'Prepared for your care conversation.',
      sections: [
        { heading: 'Opening line', lines: [openingLine] },
        { heading: 'Questions to ask', lines: questions.map((question) => question.text) },
        { heading: 'Bring or confirm', lines: [...checklist] },
      ],
      footer: `${CARE_RELAY_SAFETY_LIMITS} ${CARE_SAFETY_REMINDER}`,
    });
    setPrintError(!opened);
  }

  return (
    <section
      aria-labelledby="care-relay-heading"
      className="rounded-[1.5rem] border border-stone-300 bg-[#f8f1e7] p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-800">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-teal-800">
              STEP 2 · CARE RELAY
            </p>
            <h2
              id="care-relay-heading"
              className="mt-1 text-xl font-bold tracking-tight text-slate-950"
            >
              Prepare the practical handoff
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              A short, editable card for a real conversation—not a medical assessment.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900">
          <FileText className="size-3.5" aria-hidden="true" />
          Saved on this device
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <fieldset className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">Who is this for?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ['self', 'For myself'],
              ['caregiver', 'Helping someone'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => updateDraft({ audience: value as CareRelayDraft['audience'] })}
                aria-pressed={draft.audience === value}
                className={`min-h-11 rounded-xl border px-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${draft.audience === value ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-stone-300 text-slate-600 hover:border-teal-300'}`}
              >
                {value === 'caregiver' ? (
                  <UsersRound className="mr-1.5 inline size-3.5" aria-hidden="true" />
                ) : null}
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4">
          <legend className="px-1 text-sm font-semibold text-slate-800">Relay language</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[
              ['en', 'English'],
              ['fil', 'Filipino'],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeLanguage(value as CareRelayDraft['language'])}
                aria-pressed={draft.language === value}
                className={`min-h-11 rounded-xl border px-3 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${draft.language === value ? 'border-teal-700 bg-teal-50 text-teal-950' : 'border-stone-300 text-slate-600 hover:border-teal-300'}`}
              >
                <Languages className="mr-1.5 inline size-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {journey.id === 'clinic' ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-800">
            Appointment type
            <select
              value={draft.clinicVisit}
              onChange={(event) =>
                updateDraft({ clinicVisit: event.target.value as CareRelayDraft['clinicVisit'] })
              }
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            >
              <option value="new">New appointment</option>
              <option value="follow-up">Follow-up appointment</option>
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-800">
            Reason category
            <select
              value={draft.clinicReason}
              onChange={(event) =>
                updateDraft({ clinicReason: event.target.value as CareRelayDraft['clinicReason'] })
              }
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            >
              <option value="new concern">New concern</option>
              <option value="follow-up concern">Follow-up concern</option>
              <option value="results discussion">Results discussion</option>
              <option value="paperwork or referral">Paperwork or referral</option>
            </select>
          </label>
        </div>
      ) : null}

      {journey.id === 'laboratory' ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex min-h-24 cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm leading-5 text-slate-700">
            <input
              type="checkbox"
              checked={draft.hasLaboratoryRequest}
              onChange={(event) => updateDraft({ hasLaboratoryRequest: event.target.checked })}
              className="mt-0.5 size-4 accent-teal-700"
            />
            <span>
              <strong className="block text-slate-900">I have the test request or order</strong>
              Confirm any preparation details directly with the laboratory.
            </span>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-800">
            Result handoff plan
            <select
              value={draft.laboratoryRelease}
              onChange={(event) =>
                updateDraft({
                  laboratoryRelease: event.target.value as CareRelayDraft['laboratoryRelease'],
                })
              }
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            >
              <option value="ask at the laboratory">Ask at the laboratory</option>
              <option value="collect in person">Collect in person</option>
              <option value="send to my clinic">Send to my clinic</option>
            </select>
          </label>
        </div>
      ) : null}

      {journey.id === 'discharge' ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-800">
            Support
            <select
              value={draft.dischargeSupport}
              onChange={(event) =>
                updateDraft({
                  dischargeSupport: event.target.value as CareRelayDraft['dischargeSupport'],
                })
              }
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            >
              <option>I am leaving on my own</option>
              <option>A family member or caregiver is helping</option>
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-800">
            Paperwork
            <select
              value={draft.paperworkHolder}
              onChange={(event) =>
                updateDraft({
                  paperworkHolder: event.target.value as CareRelayDraft['paperworkHolder'],
                })
              }
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            >
              <option>I will keep the paperwork</option>
              <option>My helper will keep the paperwork</option>
            </select>
          </label>
          <label className="rounded-2xl border border-stone-200 bg-[#fffaf2] p-4 text-sm font-semibold text-slate-800">
            Follow-up
            <select
              value={draft.followUpStatus}
              onChange={(event) =>
                updateDraft({
                  followUpStatus: event.target.value as CareRelayDraft['followUpStatus'],
                })
              }
              className="mt-2 h-11 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
            >
              <option>I will confirm the follow-up details</option>
              <option>I have the follow-up details</option>
            </select>
          </label>
        </div>
      ) : null}

      <article className="mt-5 rounded-[1.35rem] border border-teal-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-800">
              Your Care Relay
            </p>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-800">{openingLine}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900">
            <Check className="size-3.5" aria-hidden="true" /> Ready to review
          </span>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-[#f8f1e7] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-950">Questions to ask</p>
              <button
                type="button"
                onClick={resetQuestions}
                className="text-xs font-semibold text-teal-800 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
              >
                Restore
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {questions.map((question) => (
                <div key={question.id} className="flex gap-2">
                  <textarea
                    aria-label="Question to ask"
                    value={question.text}
                    rows={2}
                    onChange={(event) =>
                      setQuestions((current) =>
                        current.map((item) =>
                          item.id === question.id
                            ? { ...item, text: event.target.value.slice(0, 220) }
                            : item,
                        ),
                      )
                    }
                    className="min-w-0 flex-1 resize-y rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm leading-5 text-slate-700 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700/15"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setQuestions((current) => current.filter((item) => item.id !== question.id))
                    }
                    className="size-10 shrink-0 rounded-lg border border-stone-300 bg-white text-slate-500 transition hover:border-red-300 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                    aria-label="Remove question"
                  >
                    <Trash2 className="mx-auto size-4" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl bg-[#f8f1e7] p-4">
            <p className="text-sm font-semibold text-slate-950">Bring or confirm</p>
            <ul className="mt-3 space-y-2">
              {checklist.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-5 text-slate-700">
                  <Check className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-[#fffaf2] p-4 text-xs leading-5 text-slate-600 sm:grid-cols-2">
          <p>
            <Sparkles className="mr-1 inline size-3.5 text-teal-700" aria-hidden="true" />
            <strong className="text-slate-800">HealthBridge did:</strong> selected controlled,
            practical prompts for this visit and language.
          </p>
          <p>
            <ShieldCheck className="mr-1 inline size-3.5 text-teal-700" aria-hidden="true" />
            <strong className="text-slate-800">You must confirm:</strong> instructions, preparation,
            follow-up, and any decision with the care team.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => void copyRelay()}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <Copy className="size-4" aria-hidden="true" />
            {copied ? 'Copied relay' : 'Copy relay'}
          </button>
          {canShare ? (
            <button
              type="button"
              onClick={() => void shareRelay()}
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
            >
              <Share2 className="size-4" aria-hidden="true" />
              Share
            </button>
          ) : null}
          <button
            type="button"
            onClick={printRelay}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <Printer className="size-4" aria-hidden="true" />
            Print / PDF
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saved}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-800 px-3 text-sm font-semibold text-white transition hover:bg-teal-900 disabled:bg-teal-100 disabled:text-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
          >
            <ClipboardCheck className="size-4" aria-hidden="true" />
            {saved ? 'Saved to my plans' : 'Save my plan'}
          </button>
        </div>
        {printError ? (
          <p role="alert" className="mt-3 text-xs text-amber-800">
            Your browser blocked the print preview. Allow pop-ups for HealthBridge, then try again.
          </p>
        ) : null}
      </article>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-5 text-slate-600">
        <p>{CARE_RELAY_PRIVACY_NOTICE}</p>
        <p className="mt-1">{CARE_RELAY_SAFETY_LIMITS}</p>
        <p className="mt-1">
          Want to turn your own temporary note into questions? Continue to the next step;
          HealthBridge asks for explicit AI consent first.
        </p>
      </div>
    </section>
  );
}
