'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const INTRO_DURATION_MS = 4_200;
const INTRO_EXIT_DURATION_MS = 650;

export function LandingIntro({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const introTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const hasStartedExitRef = useRef(false);

  const beginExit = useCallback((instant = false) => {
    if (hasStartedExitRef.current) return;

    hasStartedExitRef.current = true;
    setIsExiting(true);
    exitTimerRef.current = window.setTimeout(onComplete, instant ? 0 : INTRO_EXIT_DURATION_MS);
  }, [onComplete]);

  useEffect(() => {
    let reducedMotion = false;

    try {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      // The intro remains usable when storage or media queries are unavailable.
    }

    introTimerRef.current = window.setTimeout(() => {
      beginExit(reducedMotion);
    }, reducedMotion ? 0 : INTRO_DURATION_MS);

    return () => {
      if (introTimerRef.current !== null) window.clearTimeout(introTimerRef.current);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    };
  }, [beginExit]);

  function skip() {
    beginExit();
  }

  return (
    <main className={`hb-intro-stage relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6 text-white transition-opacity duration-700 ease-out ${isExiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
      <div className="hb-orbit hb-orbit-one" aria-hidden="true" />
      <div className="hb-orbit hb-orbit-two" aria-hidden="true" />
      <button type="button" onClick={skip} className="absolute right-6 top-6 z-10 rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
        Skip intro
      </button>
      <div className="relative z-10 flex max-w-xl flex-col items-center text-center">
        <div className="hb-intro-logo flex size-20 items-center justify-center rounded-[28px] bg-[#f8f1e7] text-3xl font-black text-slate-950 shadow-2xl shadow-blue-950/30">H</div>
        <div className="hb-intro-copy mt-7">
          <h1 className="text-5xl font-bold leading-[0.95] tracking-[-0.06em] sm:text-6xl">Feel ready before you go.</h1>
          <p className="mt-5 text-base leading-7 text-slate-300 sm:text-lg">Prepare practical questions and checklists for your next care visit.</p>
        </div>
        <button type="button" onClick={skip} className="hb-intro-copy mt-9 inline-flex items-center gap-2 rounded-full bg-[#dbeafe] px-5 py-3 text-sm font-semibold text-slate-950 transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300">
          Enter HealthBridge <ArrowRight className="size-4" aria-hidden="true" />
        </button>
        <div className="mt-10 h-1 w-40 overflow-hidden rounded-full bg-white/15" aria-hidden="true">
          <div className="hb-intro-progress h-full rounded-full bg-blue-300" />
        </div>
      </div>
    </main>
  );
}
