'use client';

import { Check, Clipboard, Lightbulb } from 'lucide-react';
import { useState } from 'react';

import type { CareJourney } from '@/lib/careJourneys';
import { VISIT_RECOMMENDATIONS } from '@/lib/visitRecommendations';

export function VisitRecommendations({
  journey,
  personalizedQuestion,
}: {
  journey: CareJourney;
  personalizedQuestion?: string | null;
}) {
  const recommendations = VISIT_RECOMMENDATIONS[journey.id] ?? [];
  const [activeId, setActiveId] = useState(recommendations[0]?.id ?? '');

  if (!recommendations.length) return null;
  const active =
    recommendations.find((recommendation) => recommendation.id === activeId) ?? recommendations[0];

  return (
    <section
      className="mt-5 overflow-hidden rounded-2xl border border-blue-200 bg-[#fffaf2]"
      aria-labelledby="visit-recommendations-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-blue-100 bg-blue-50 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-800 text-white">
            <Lightbulb className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">
              Recommended preparation
            </p>
            <h3
              id="visit-recommendations-heading"
              className="mt-1 text-base font-bold text-slate-950"
            >
              A practical next move for this visit
            </h3>
          </div>
        </div>
        <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-blue-900">
          Not medical advice
        </span>
      </div>
      <div className="p-4">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Preparation options">
          {recommendations.map((recommendation) => (
            <button
              key={recommendation.id}
              type="button"
              role="tab"
              aria-selected={active.id === recommendation.id}
              onClick={() => setActiveId(recommendation.id)}
              className={`min-h-9 rounded-lg border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${active.id === recommendation.id ? 'border-blue-800 bg-blue-800 text-white' : 'border-stone-300 bg-white text-slate-700 hover:border-blue-300'}`}
            >
              {recommendation.label}
            </button>
          ))}
        </div>
        <h4 className="mt-4 text-lg font-bold tracking-tight text-slate-950">{active.title}</h4>
        <p className="mt-1 text-sm leading-6 text-slate-600">{active.description}</p>
        <ul className="mt-4 space-y-2">
          {active.actions.map((action) => (
            <li key={action} className="flex gap-2 text-sm leading-6 text-slate-700">
              <Check className="mt-1 size-4 shrink-0 text-blue-800" aria-hidden="true" />
              {action}
            </li>
          ))}
        </ul>
        <div className="mt-4 rounded-xl bg-[#e6e7f8] p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-900">
            {personalizedQuestion ? 'Question from your note' : 'Ask this'}
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-950">
            {personalizedQuestion ?? active.question}
          </p>
          {personalizedQuestion ? (
            <p className="mt-2 text-xs leading-5 text-blue-950/75">
              Personalized by GPT-5.6 from your temporary note. Review it before asking.
            </p>
          ) : null}
        </div>
      </div>
      <p className="flex gap-2 border-t border-stone-200 px-4 py-3 text-xs leading-5 text-slate-500">
        <Clipboard className="mt-0.5 size-4 shrink-0 text-blue-800" aria-hidden="true" />
        These suggestions organize a visit conversation. They do not assess symptoms or replace
        care-team instructions.
      </p>
    </section>
  );
}
