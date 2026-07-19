import { RefreshCw, SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Transient, non-result states. None of these ever invent a medicine name,
// price, or savings figure.

export function LoadingCard() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <span className="sr-only">Finding a verified local comparison…</span>
      <Skeleton className="h-4 w-40 bg-slate-100" />
      <Skeleton className="h-24 w-full rounded-2xl bg-emerald-50" />
      <Skeleton className="h-5 w-52 bg-slate-100" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-24 w-full bg-slate-100" />
        <Skeleton className="h-24 w-full bg-slate-100" />
      </div>
      <p className="text-center text-sm text-slate-600">Finding a verified local comparison…</p>
    </div>
  );
}

export function NoMatchCard({ query, reason = 'unknown' }: { query: string; reason?: 'draft_evidence' | 'unknown' }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6">
      <span className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
        <SearchX aria-hidden="true" className="size-5" />
      </span>
      <p className="text-base font-semibold text-slate-950">{reason === 'draft_evidence' ? 'Price evidence is being checked' : 'Not yet verified locally'}</p>
      <p className="max-w-md text-sm leading-6 text-slate-600">
        {reason === 'draft_evidence' && query ? (
          <>
            We recognize <span className="font-medium text-slate-900">&ldquo;{query}&rdquo;</span>, but we will not show a savings claim until both matching packs have fresh local price evidence.
          </>
        ) : query ? (
          <>
            We don&apos;t have a verified comparison for{' '}
            <span className="font-medium text-slate-900">&ldquo;{query}&rdquo;</span> yet.
          </>
        ) : (
          <>We don&apos;t have a verified comparison for that yet.</>
        )}
      </p>
      <p className="max-w-md text-sm leading-6 text-slate-600">
        Try a brand like <span className="font-medium">Biogesic</span> or{' '}
        <span className="font-medium">Norvasc</span>, or ask your pharmacist about a generic option. HealthBridge does not recommend changing medicine on its own.
      </p>
    </div>
  );
}

export function ErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6"
    >
      <span className="flex size-10 items-center justify-center rounded-full bg-amber-50 text-amber-800">
        <RefreshCw aria-hidden="true" className="size-5" />
      </span>
      <p className="text-base font-semibold text-slate-950">Something went wrong</p>
      <p className="max-w-md text-sm leading-6 text-slate-600">
        We couldn&apos;t complete that search. Please try again in a moment.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mx-auto inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 transition-[background-color,transform] duration-200 ease-out hover:bg-slate-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:transform-none"
      >
        Try again
      </button>
    </div>
  );
}
