'use client';

import { Camera, Check, LoaderCircle, ReceiptText, RotateCcw } from 'lucide-react';
import { ChangeEvent, useRef, useState } from 'react';

import type { PriceEvidence } from '@/lib/priceEvidence';

type PriceKind = 'branded' | 'generic';
type Phase = 'idle' | 'reading' | 'ready' | 'error';

function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export function PriceEvidenceCapture({
  onApply,
}: {
  onApply: (kind: PriceKind, price: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [target, setTarget] = useState<PriceKind>('branded');
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<PriceEvidence | null>(null);
  const [error, setError] = useState<string | null>(null);

  function begin(kind: PriceKind) {
    setTarget(kind);
    setResult(null);
    setError(null);
    inputRef.current?.click();
  }
  function readImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3_000_000) {
      setError('Choose a JPG, PNG, or WebP image smaller than 3 MB.');
      setPhase('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result !== 'string') return;
      setPhase('reading');
      setError(null);
      try {
        const response = await fetch('/api/price-label-scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageDataUrl: reader.result }),
        });
        const data = (await response.json()) as { result?: PriceEvidence; error?: string };
        if (!response.ok || !data.result)
          throw new Error(data.error ?? 'We could not read the price label.');
        setResult(data.result);
        setPhase('ready');
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'We could not read the price label.');
        setPhase('error');
      }
    };
    reader.onerror = () => {
      setError('We could not read this image.');
      setPhase('error');
    };
    reader.readAsDataURL(file);
  }
  function apply() {
    if (!result?.price || result.currency !== 'PHP') return;
    onApply(target, result.price);
    setResult(null);
    setPhase('idle');
    setError(null);
  }

  return (
    <section
      className="mt-4 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-4"
      aria-labelledby="price-evidence-heading"
    >
      <input
        ref={inputRef}
        onChange={readImage}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
      />
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-[#fffaf2] text-blue-800">
          <ReceiptText className="size-4" aria-hidden="true" />
        </span>
        <div>
          <p id="price-evidence-heading" className="text-sm font-semibold text-slate-950">
            Optional price-label capture
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-600">
            Use a shelf tag or receipt to prefill a visible Philippine peso price. You review it
            before it is used; the photo is not saved.
          </p>
        </div>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => begin('branded')}
          disabled={phase === 'reading'}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 disabled:opacity-50 ${target === 'branded' ? 'border-blue-800 bg-blue-800 text-white' : 'border-stone-300 bg-[#fffaf2] text-slate-700 hover:border-blue-300'}`}
        >
          <Camera className="size-4" aria-hidden="true" />
          Capture branded price
        </button>
        <button
          type="button"
          onClick={() => begin('generic')}
          disabled={phase === 'reading'}
          className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 disabled:opacity-50 ${target === 'generic' ? 'border-blue-800 bg-blue-800 text-white' : 'border-stone-300 bg-[#fffaf2] text-slate-700 hover:border-blue-300'}`}
        >
          <Camera className="size-4" aria-hidden="true" />
          Capture generic price
        </button>
      </div>
      {phase === 'reading' ? (
        <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
          <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
          Reading the visible price label…
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm leading-6 text-amber-800">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-3 rounded-xl border border-blue-200 bg-[#fffaf2] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-800">
            Review before applying
          </p>
          {result.price && result.currency === 'PHP' ? (
            <>
              <p className="mt-1 text-lg font-bold text-slate-950">{formatPHP(result.price)}</p>
              {result.productText ? (
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Visible text: {result.productText}
                </p>
              ) : null}
              <p className="mt-2 text-xs leading-5 text-slate-500">{result.notice}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={apply}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
                >
                  <Check className="size-3.5" aria-hidden="true" />
                  Use {formatPHP(result.price)}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    setPhase('idle');
                  }}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-[#efe7da]"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Retake
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                No clear Philippine peso price was read. Enter the amount manually instead.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setPhase('idle');
                }}
                className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-[#efe7da]"
              >
                <RotateCcw className="size-3.5" aria-hidden="true" />
                Try another photo
              </button>
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
