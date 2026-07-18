'use client';

import { useCallback, useState } from 'react';
import { ResultCard } from '@/components/ResultCard';
import { SavedMedicines } from '@/components/SavedMedicines';
import { SearchForm } from '@/components/SearchForm';
import { ErrorCard, LoadingCard, NoMatchCard } from '@/components/StateCards';
import { BrandMark } from '@/components/BrandMark';
import { lookupLocal, toVerifiedLookup } from '@/lib/lookup';
import { isValidComparison } from '@/lib/savings';
import type { DrugComparison, MatchSource, VerifiedLookup } from '@/lib/types';
import { useSavedMedicines } from '@/lib/useSavedMedicines';

type Phase = 'idle' | 'loading' | 'verified' | 'not_verified' | 'error';

// Narrow an untrusted /api/lookup payload. The client NEVER trusts a savings
// number from the route: it re-runs the verified gate on the returned record
// and recomputes savings locally, so a malformed or unverified response can
// only ever fall through to the "not verified" state.
function readVerifiedRecord(payload: unknown): { record: DrugComparison; source: MatchSource } | null {
  if (!payload || typeof payload !== 'object') return null;
  const data = payload as { status?: unknown; source?: unknown; comparison?: unknown };
  if (data.status !== 'verified') return null;
  const record = data.comparison as DrugComparison | undefined;
  if (!record || !isValidComparison(record)) return null;
  const source: MatchSource = data.source === 'openai' ? 'openai' : 'curated';
  return { record, source };
}

export default function Home() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [query, setQuery] = useState('');
  const [lastQuery, setLastQuery] = useState('');
  const [result, setResult] = useState<VerifiedLookup | null>(null);
  const [showEmptyError, setShowEmptyError] = useState(false);

  const { saved, save, remove, setPurchased, isSaved } = useSavedMedicines();

  const runSearch = useCallback(async (raw: string) => {
    const q = raw.trim();
    if (!q) {
      setShowEmptyError(true);
      setPhase('idle');
      setResult(null);
      return;
    }
    setShowEmptyError(false);
    setLastQuery(q);
    setPhase('loading');
    setResult(null);

    // Let the button's non-blocking comparison state paint before a curated
    // local lookup completes in the same event turn.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    // 1) Local-first: curated hero searches resolve instantly, offline.
    const local = lookupLocal(q);
    if (local.status === 'verified') {
      setResult(local);
      setPhase('verified');
      return;
    }

    // 2) Fall back to the server route (owned by the backend team). Prices are
    //    re-validated client-side before anything renders.
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`, {
        headers: { accept: 'application/json' },
      });
      if (res.status >= 500) {
        setPhase('error');
        return;
      }
      if (!res.ok) {
        setPhase('not_verified');
        return;
      }
      const verified = readVerifiedRecord(await res.json());
      if (verified) {
        setResult(toVerifiedLookup(verified.record, verified.source));
        setPhase('verified');
      } else {
        setPhase('not_verified');
      }
    } catch {
      // Route unavailable (still being built) or offline — stay useful and
      // safe by treating it as "not verified locally", never an invented result.
      setPhase('not_verified');
    }
  }, []);

  const handleSave = useCallback(() => {
    if (!result) return;
    save({
      id: result.comparison.id,
      brand: result.comparison.brand,
      generic: result.comparison.generic,
      savings: result.savings.savings,
      isPurchased: false,
    });
  }, [result, save]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 py-6 sm:py-10 lg:max-w-6xl lg:px-8 lg:py-12">
      <header className="mb-9 lg:mb-12 lg:flex lg:items-end lg:justify-between lg:gap-8">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-teal-600 text-white shadow-sm">
            <BrandMark />
          </span>
          <span className="text-base font-semibold tracking-tight text-slate-900">HealthBridge</span>
        </div>
        <p className="mt-1.5 text-sm text-slate-600">Clear, verified medicine price comparisons.</p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start lg:gap-x-12">
        <div>
          <SearchForm
            query={query}
            onQueryChange={setQuery}
            onSearch={runSearch}
            isLoading={phase === 'loading'}
            showEmptyError={showEmptyError}
          />

          <section aria-live="polite" aria-atomic="true" className="mt-7 lg:mt-8">
            {phase === 'loading' ? <LoadingCard /> : null}
            {phase === 'not_verified' ? <NoMatchCard query={lastQuery} /> : null}
            {phase === 'error' ? <ErrorCard onRetry={() => runSearch(lastQuery)} /> : null}
            {phase === 'verified' && result ? (
              <div className="motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:duration-200">
                <ResultCard
                  result={result}
                  isSaved={isSaved(result.comparison.id)}
                  onSave={handleSave}
                />
              </div>
            ) : null}
          </section>
        </div>

        <aside className="lg:sticky lg:top-8">
          <SavedMedicines saved={saved} onPurchaseChange={setPurchased} onRemove={remove} />
        </aside>
      </div>
    </main>
  );
}
