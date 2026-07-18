'use client';

import { ArrowLeft, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { useCallback, useState } from 'react';

import { DisclaimerModal } from '@/components/DisclaimerModal';
import { LandingIntro } from '@/components/LandingIntro';
import { ResultCard } from '@/components/ResultCard';
import { SavedMedicines } from '@/components/SavedMedicines';
import { SearchForm } from '@/components/SearchForm';
import { ErrorCard, LoadingCard, NoMatchCard } from '@/components/StateCards';
import { lookupLocal } from '@/lib/lookup';
import { useSavedMedicines } from '@/lib/useSavedMedicines';
import type { LookupOutcome, VerifiedLookup } from '@/lib/types';

type SearchPhase = 'idle' | 'loading' | 'verified' | 'not_verified' | 'error';

const trustPoints = [
  { icon: ShieldCheck, title: 'Like-for-like', text: 'Same ingredient, strength, form, and pack.' },
  { icon: Sparkles, title: 'Show your impact', text: 'Turn a pack saving into a personal plan.' },
  { icon: WalletCards, title: 'Keep your list', text: 'Save verified comparisons on this device.' },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<SearchPhase>('idle');
  const [outcome, setOutcome] = useState<LookupOutcome | null>(null);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const { saved, save, remove, setPurchased, isSaved } = useSavedMedicines();

  async function search(rawQuery: string) {
    const trimmedQuery = rawQuery.trim();
    setQuery(rawQuery);

    if (!trimmedQuery) {
      setShowEmptyError(true);
      setOutcome(null);
      setPhase('idle');
      return;
    }

    setShowEmptyError(false);
    setOutcome(null);
    setPhase('loading');
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    try {
      const nextOutcome = lookupLocal(trimmedQuery);
      setOutcome(nextOutcome);
      setPhase(nextOutcome.status);
    } catch {
      setPhase('error');
    }
  }

  function saveComparison(result: VerifiedLookup) {
    const { comparison, savings } = result;
    save({
      id: comparison.id,
      brand: comparison.brand,
      generic: comparison.generic,
      savings: savings.savings,
      isPurchased: false,
    });
  }

  const verifiedResult = outcome?.status === 'verified' ? outcome : null;
  const isLanding = phase === 'idle' && !outcome;
  const finishIntro = useCallback(() => setIntroComplete(true), []);

  function startNewComparison() {
    setQuery('');
    setOutcome(null);
    setShowEmptyError(false);
    setPhase('idle');
  }

  if (!introComplete) {
    return <LandingIntro onComplete={finishIntro} />;
  }

  return (
    <>
      <DisclaimerModal />
      <main className="min-h-screen bg-[#f5f5f7] px-4 py-5 text-slate-950 sm:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-6xl">
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-[14px] bg-slate-950 text-lg font-bold text-white shadow-lg shadow-slate-900/20">H</div>
              <div>
                <p className="text-lg font-bold tracking-tight">HealthBridge</p>
                <p className="text-xs text-slate-500">Verified medicine comparisons</p>
              </div>
            </div>
            <p className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 sm:block">Built for thoughtful choices</p>
          </header>

          {isLanding ? (
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-10 text-white shadow-2xl shadow-slate-900/20 sm:px-10 sm:py-14">
                <div className="pointer-events-none absolute -right-24 -top-28 size-80 rounded-full bg-teal-400/25 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-40 left-1/3 size-96 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="relative max-w-2xl">
                  <p className="mb-4 text-sm font-semibold tracking-wide text-teal-200">KNOW THE DIFFERENCE</p>
                  <h1 className="max-w-[14ch] text-5xl font-bold leading-[0.96] tracking-[-0.055em] sm:text-6xl">Your medicine. A clearer choice.</h1>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Compare a trusted brand with a like-for-like generic, see the evidence behind the saving, and keep what matters to you.</p>
                  <div className="mt-8 rounded-2xl border border-white/15 bg-white p-4 text-slate-950 shadow-xl shadow-black/10 sm:p-5">
                    <SearchForm query={query} onQueryChange={setQuery} onSearch={search} isLoading={false} showEmptyError={showEmptyError} compact />
                  </div>
                </div>
              </section>
              <div className="space-y-4">
                {trustPoints.map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <Icon className="size-5 text-teal-700" aria-hidden="true" />
                    <h2 className="mt-4 font-semibold tracking-tight">{title}</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
                  </div>
                ))}
                <SavedMedicines saved={saved} onPurchaseChange={setPurchased} onRemove={remove} />
              </div>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
              <section className="space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-950">New comparison</p>
                      <p className="text-xs text-slate-500">Search another verified medicine.</p>
                    </div>
                    <button type="button" onClick={startNewComparison} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
                      <ArrowLeft className="size-4" aria-hidden="true" /> Home
                    </button>
                  </div>
                  <SearchForm query={query} onQueryChange={setQuery} onSearch={search} isLoading={phase === 'loading'} showEmptyError={showEmptyError} compact />
                </div>
                {phase === 'loading' ? <LoadingCard /> : null}
                {phase === 'not_verified' ? <NoMatchCard query={outcome?.status === 'not_verified' ? outcome.query : query} /> : null}
                {phase === 'error' ? <ErrorCard onRetry={() => void search(query)} /> : null}
                {verifiedResult ? <ResultCard result={verifiedResult} isSaved={isSaved(verifiedResult.comparison.id)} onSave={() => saveComparison(verifiedResult)} /> : null}
              </section>
              <SavedMedicines saved={saved} onPurchaseChange={setPurchased} onRemove={remove} />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
