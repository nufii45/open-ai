"use client";

import { useState } from "react";

import { DisclaimerModal } from "@/components/DisclaimerModal";
import { ResultCard } from "@/components/ResultCard";
import { SavedMedicines } from "@/components/SavedMedicines";
import { SearchForm } from "@/components/SearchForm";
import { ErrorCard, LoadingCard, NoMatchCard } from "@/components/StateCards";
import { lookupLocal } from "@/lib/lookup";
import { useSavedMedicines } from "@/lib/useSavedMedicines";
import type { LookupOutcome, VerifiedLookup } from "@/lib/types";

type SearchPhase = "idle" | "loading" | "verified" | "not_verified" | "error";

export default function Home() {
  const [query, setQuery] = useState("");
  const [phase, setPhase] = useState<SearchPhase>("idle");
  const [outcome, setOutcome] = useState<LookupOutcome | null>(null);
  const [showEmptyError, setShowEmptyError] = useState(false);
  const { saved, save, remove, isSaved } = useSavedMedicines();

  async function search(rawQuery: string) {
    const trimmedQuery = rawQuery.trim();
    setQuery(rawQuery);

    if (!trimmedQuery) {
      setShowEmptyError(true);
      setOutcome(null);
      setPhase("idle");
      return;
    }

    setShowEmptyError(false);
    setOutcome(null);
    setPhase("loading");

    // Allows the loading state to paint before the deterministic local lookup.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    try {
      const nextOutcome = lookupLocal(trimmedQuery);
      setOutcome(nextOutcome);
      setPhase(nextOutcome.status);
    } catch {
      setPhase("error");
    }
  }

  function saveComparison(result: VerifiedLookup) {
    const { comparison, savings } = result;
    save({
      id: comparison.id,
      brand: comparison.brand,
      generic: comparison.generic,
      savings: savings.savings,
    });
  }

  const verifiedResult = outcome?.status === "verified" ? outcome : null;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:py-12">
      <DisclaimerModal />
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-lg font-bold text-white">
            H
          </div>
          <div>
            <p className="text-lg font-bold tracking-tight text-slate-950">HealthBridge</p>
            <p className="text-sm text-slate-600">Verified medicine price comparisons</p>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
          <section className="space-y-6">
            <SearchForm
              query={query}
              onQueryChange={setQuery}
              onSearch={search}
              isLoading={phase === "loading"}
              showEmptyError={showEmptyError}
            />

            {phase === "loading" ? <LoadingCard /> : null}
            {phase === "not_verified" ? <NoMatchCard query={outcome?.status === "not_verified" ? outcome.query : query} /> : null}
            {phase === "error" ? <ErrorCard onRetry={() => void search(query)} /> : null}
            {verifiedResult ? (
              <ResultCard
                result={verifiedResult}
                isSaved={isSaved(verifiedResult.comparison.id)}
                onSave={() => saveComparison(verifiedResult)}
              />
            ) : null}
          </section>

          <SavedMedicines saved={saved} onRemove={remove} />
        </div>
      </div>
    </main>
  );
}
