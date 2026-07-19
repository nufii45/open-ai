'use client';

import { ArrowRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

const INTRO_DURATION_MS = 5_600;
const INTRO_EXIT_DURATION_MS = 900;

export function LandingIntro({ onComplete }: { onComplete: () => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const introTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);
  const hasStartedExitRef = useRef(false);
  const beginExit = useCallback(
    (instant = false) => {
      if (hasStartedExitRef.current) return;
      hasStartedExitRef.current = true;
      setIsExiting(true);
      exitTimerRef.current = window.setTimeout(onComplete, instant ? 0 : INTRO_EXIT_DURATION_MS);
    },
    [onComplete],
  );

  useEffect(() => {
    let reducedMotion = false;
    try {
      reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      /* The intro remains usable when media queries are unavailable. */
    }
    introTimerRef.current = window.setTimeout(
      () => beginExit(reducedMotion),
      reducedMotion ? 0 : INTRO_DURATION_MS,
    );
    return () => {
      if (introTimerRef.current !== null) window.clearTimeout(introTimerRef.current);
      if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
    };
  }, [beginExit]);

  return (
    <main
      className={`hb-intro-stage hb-intro-experience relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-12 text-slate-950 transition-opacity duration-900 ease-out ${isExiting ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
    >
      <div className="hb-intro-haze" aria-hidden="true" />
      <button
        type="button"
        onClick={() => beginExit()}
        className="absolute right-5 top-5 z-10 rounded-full border border-slate-300 bg-[#fffaf2]/80 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 sm:right-8 sm:top-8"
      >
        Skip intro
      </button>
      <div className="relative z-10 flex max-w-2xl flex-col items-center text-center">
        <div className="hb-intro-emblem relative w-[15.5rem] sm:w-[18rem]" aria-hidden="true">
          <svg viewBox="0 0 320 230" className="h-auto w-full" fill="none">
            <path
              className="hb-intro-arch"
              d="M65 123C65 56 106 30 160 30C214 30 255 56 255 123"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              className="hb-intro-bridge"
              d="M42 151C74 133 246 133 278 151M48 154H272M48 196H272M67 148V194M104 140V194M141 136V194M179 136V194M216 140V194M253 148V194"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              className="hb-intro-path"
              d="M114 196C127 184 143 178 160 178C177 178 193 184 206 196"
              stroke="#2563eb"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <g className="hb-intro-person hb-intro-person-left" fill="currentColor">
              <circle cx="124" cy="89" r="15" />
              <circle cx="108" cy="80" r="9" />
              <path d="M109 102C114 107 124 110 134 106C137 113 143 120 151 125L155 138H94L98 123C103 117 107 110 109 102Z" />
              <path
                d="M134 94C138 97 142 98 145 98"
                fill="none"
                stroke="#f7f1e8"
                strokeLinecap="round"
                strokeWidth="2.4"
              />
            </g>
            <g className="hb-intro-person hb-intro-person-right" fill="#2563eb">
              <circle cx="196" cy="89" r="15" />
              <path d="M181 87C181 75 191 68 203 72C212 76 216 84 214 93L208 85C200 89 191 89 183 85Z" />
              <path d="M185 102C192 107 202 110 211 106C214 113 220 120 228 125L232 138H169L173 123C179 117 183 110 185 102Z" />
              <path
                d="M186 94C182 97 178 98 175 98"
                fill="none"
                stroke="#f7f1e8"
                strokeLinecap="round"
                strokeWidth="2.4"
              />
            </g>
            <path
              className="hb-intro-dialogue"
              d="M142 56C142 43 153 34 167 34H181C195 34 206 43 206 56C206 70 195 79 181 79H173L162 88L164 79C151 77 142 69 142 56Z"
              fill="#2563eb"
            />
            <path
              className="hb-intro-tick"
              d="M160 56L169 65L188 46"
              stroke="#fffaf2"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div className="hb-intro-wordmark mt-2">
          <h1 className="font-serif text-[clamp(3.75rem,12vw,7.5rem)] leading-none tracking-[-0.065em] text-slate-950">
            Health<span className="text-blue-700">Bridge</span>
          </h1>
          <div className="mt-5 flex items-center justify-center gap-3 text-[10px] font-semibold tracking-[0.28em] text-slate-700 sm:text-xs">
            <span className="h-px w-7 bg-blue-700 sm:w-11" />
            PREPARE · VERIFY · ASK · CONNECT
            <span className="h-px w-7 bg-blue-700 sm:w-11" />
          </div>
          <p className="mt-5 text-sm tracking-[0.04em] text-slate-600 sm:text-base">
            Handa sa bawat pagbisita. Kapanatagan sa bawat desisyon.
          </p>
        </div>
        <div className="hb-intro-actions mt-9 flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={() => beginExit()}
            className="hb-primary-cta inline-flex min-h-12 items-center gap-2 rounded-full bg-slate-950 px-5 text-sm font-semibold text-white shadow-xl shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
          >
            Enter HealthBridge <ArrowRight className="size-4" aria-hidden="true" />
          </button>
          <p className="text-xs leading-5 text-slate-500">
            A calmer start for a real care conversation.
          </p>
        </div>
        <div className="mt-8 h-px w-40 overflow-hidden bg-slate-300" aria-hidden="true">
          <div className="hb-intro-progress h-full bg-blue-700" />
        </div>
      </div>
    </main>
  );
}
