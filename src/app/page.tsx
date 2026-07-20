'use client';

import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Compass,
  FlaskConical,
  Hospital,
  Pill,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { useCallback, useState } from 'react';

import { CareVisitBrief } from '@/components/CareVisitBrief';
import { DisclaimerModal } from '@/components/DisclaimerModal';
import { LandingIntro } from '@/components/LandingIntro';
import { MedicineCounterCheck } from '@/components/MedicineCounterCheck';
import { PharmacyLocator } from '@/components/PharmacyLocator';
import { SavedCarePlans } from '@/components/SavedCarePlans';
import { VisitNoteAssistant } from '@/components/VisitNoteAssistant';
import { VisitRecommendations } from '@/components/VisitRecommendations';
import { CARE_JOURNEYS, type CareJourneyId } from '@/lib/careJourneys';
import type { DemoScenario } from '@/lib/demoPacks';
import { SAMPLE_PHARMACIES } from '@/lib/pharmacies';
import type { DrugComparison } from '@/lib/types';
import { useSavedCarePlans } from '@/lib/useSavedCarePlans';
import type { VisitNote } from '@/lib/visitNote';

const icons = { pharmacy: Pill, clinic: Building2, laboratory: FlaskConical, discharge: Hospital };
const STEPS = ['Choose visit', 'Check details', 'Prepare plan', 'Find a place'];

const heroCopy = [
  {
    eyebrow: 'A CLEARER START',
    title: 'Choose the kind of care visit you are preparing for.',
    detail: 'Start simple. You can change your path whenever you need to.',
  },
  {
    eyebrow: 'CHECK BEFORE YOU BUY',
    title: 'Make the counter conversation easier.',
    detail: 'Confirm the exact pack and compare only the prices you personally see.',
  },
  {
    eyebrow: 'YOUR WORDS, ORGANIZED',
    title: 'Bring the right questions into the room.',
    detail: 'Turn a temporary note into a practical conversation card, without a diagnosis.',
  },
  {
    eyebrow: 'A CALMER NEXT STEP',
    title: 'Find a nearby place when you are ready.',
    detail: 'Location is used only for this search and is never saved to your plan.',
  },
];

function StepControls({
  step,
  onBack,
  onNext,
  nextLabel,
}: {
  step: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
}) {
  return (
    <div className="mt-6 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
      <button
        type="button"
        onClick={onBack}
        disabled={step === 1}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </button>
      {step < STEPS.length ? (
        <button
          type="button"
          onClick={onNext}
          className="hb-primary-cta inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-3 text-right text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 sm:px-4"
        >
          {nextLabel}
          <ArrowRight className="size-4" aria-hidden="true" />
        </button>
      ) : (
        <span className="inline-flex items-center gap-2 rounded-xl bg-teal-50 px-3 py-2 text-sm font-semibold text-teal-800">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Visit plan ready
        </span>
      )}
    </div>
  );
}

function ProgressRail({
  step,
  onStepChange,
}: {
  step: number;
  onStepChange: (step: number) => void;
}) {
  return (
    <nav
      aria-label="Visit preparation progress"
      className="hb-progress-rail overflow-hidden rounded-[1.35rem] border border-stone-300 bg-[#f8f1e7]/95 p-1.5 shadow-sm sm:p-3"
    >
      <div className="grid grid-cols-4 gap-1">
        {STEPS.map((label, index) => {
          const indexStep = index + 1;
          const active = indexStep === step;
          const done = indexStep < step;
          return (
            <button
              key={label}
              type="button"
              onClick={() => indexStep <= step && onStepChange(indexStep)}
              disabled={indexStep > step}
              aria-current={active ? 'step' : undefined}
              className={`relative min-h-14 border-l px-1.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 first:border-l-0 sm:min-h-15 sm:px-2.5 ${active ? 'text-slate-950' : done ? 'text-slate-700 hover:bg-[#eee6da]' : 'cursor-not-allowed text-slate-400'}`}
            >
              <span
                className={`flex size-6 items-center justify-center rounded-full text-[10px] font-bold ${active ? 'bg-blue-800 text-white shadow-sm shadow-blue-900/25' : done ? 'bg-slate-950 text-[#f8f1e7]' : 'border border-stone-300 bg-[#fbf8f2] text-slate-500'}`}
              >
                {done ? (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                ) : (
                  String(indexStep).padStart(2, '0')
                )}
              </span>
              <span className="mt-1.5 block text-[10px] font-semibold leading-3 sm:text-xs sm:leading-4">
                {label}
              </span>
              {active ? (
                <motion.span
                  layoutId="active-step-rule"
                  className="absolute bottom-0 left-1.5 right-1.5 h-0.5 bg-blue-800 sm:left-2.5 sm:right-2.5"
                  transition={{ type: 'spring', stiffness: 330, damping: 30 }}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion();
  const [introComplete, setIntroComplete] = useState(false);
  const [selectedId, setSelectedId] = useState<CareJourneyId>('pharmacy');
  const [selectedMedicine, setSelectedMedicine] = useState<DrugComparison | null>(null);
  const [preparedVisitNote, setPreparedVisitNote] = useState<VisitNote | null>(null);
  const [step, setStep] = useState(1);
  const [demo, setDemo] = useState<DemoScenario | null>(null);
  const { saved, save, remove, clear, isSaved } = useSavedCarePlans();
  const selected = CARE_JOURNEYS.find((journey) => journey.id === selectedId)!;
  const planId = `${selected.id}:${selectedMedicine?.id ?? 'visit'}`;
  const aiPersonalizedQuestion =
    preparedVisitNote?.source === 'ai' ? preparedVisitNote.questions[0] : null;
  const finishIntro = useCallback(() => setIntroComplete(true), []);
  const hero = heroCopy[step - 1];

  if (!introComplete) return <LandingIntro onComplete={finishIntro} />;

  function chooseJourney(id: CareJourneyId) {
    setSelectedId(id);
    setSelectedMedicine(null);
    setPreparedVisitNote(null);
  }

  // Drops a judge straight into the pharmacy comparison with local seeded packs.
  function startDemo(scenario: DemoScenario) {
    setDemo(scenario);
    setSelectedId('pharmacy');
    setStep(2);
  }

  function clearLocalSession() {
    clear();
    window.localStorage.removeItem('healthbridge.saved.v1');
    window.sessionStorage.clear();
    window.location.reload();
  }

  return (
    <>
      <DisclaimerModal />
      <main className="hb-app-shell min-h-[100svh] overflow-x-clip px-3 py-4 text-slate-950 sm:min-h-screen sm:px-6 sm:py-5 lg:py-8">
        <div className="mx-auto w-full max-w-7xl">
          <motion.header
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 flex items-center justify-between gap-3 sm:mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="hb-brand-mark flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[15px] border border-slate-200 bg-[#fffaf2] p-1 shadow-lg shadow-slate-900/15">
                <Image
                  src="/brand/healthbridge-mark.png"
                  alt=""
                  width={44}
                  height={44}
                  priority
                  className="size-full object-contain"
                />
              </div>
              <div>
                <p className="text-lg font-bold tracking-tight text-slate-950">HealthBridge</p>
                <p className="text-xs text-slate-500">Care visit preparation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startDemo('match')}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-slate-300 bg-white/90 px-3 text-xs font-semibold text-slate-800 shadow-sm backdrop-blur transition hover:border-teal-400 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
              <PlayCircle className="size-4" aria-hidden="true" />
              Try the demo
            </button>
          </motion.header>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
            <div className="min-w-0 space-y-5">
              <motion.section
                layout
                initial={reduceMotion ? false : { opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
                className="hb-hero-surface relative min-h-60 overflow-hidden rounded-[1.5rem] px-5 py-6 text-white shadow-xl shadow-slate-900/15 sm:min-h-64 sm:px-8 sm:py-7"
              >
                <div
                  className="hb-hero-aura pointer-events-none absolute -right-16 -top-24 size-72 rounded-full"
                  aria-hidden="true"
                />
                <div
                  className="pointer-events-none absolute -bottom-24 left-1/3 size-60 rounded-full bg-indigo-400/10 blur-3xl"
                  aria-hidden="true"
                />
                <div
                  className="hb-depth-scene pointer-events-none absolute bottom-3 right-4 hidden h-48 w-60 md:block"
                  aria-hidden="true"
                >
                  <div className="hb-depth-orbit hb-depth-orbit-one" />
                  <div className="hb-depth-orbit hb-depth-orbit-two" />
                  <div className="hb-depth-card hb-depth-card-back">
                    <span>Private</span>
                    <strong>by design</strong>
                  </div>
                  <div className="hb-depth-card hb-depth-card-front">
                    <span>HealthBridge</span>
                    <strong>Care, clarified</strong>
                    <i />
                  </div>
                  <div className="hb-depth-pulse" />
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
                    className="relative flex h-full max-w-xl flex-col justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-teal-200">
                        {hero.eyebrow}
                      </p>
                      <h1 className="mt-3 max-w-[21ch] text-3xl font-bold leading-[0.98] tracking-[-0.045em] sm:text-4xl">
                        {hero.title}
                      </h1>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                        {hero.detail}
                      </p>
                    </div>
                    {step === 1 ? (
                      <div className="mt-5 flex flex-wrap gap-2.5">
                        <button
                          type="button"
                          onClick={() => startDemo('match')}
                          className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-teal-300 px-4 text-sm font-bold text-slate-950 shadow-lg shadow-teal-300/20 transition hover:-translate-y-0.5 hover:bg-teal-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        >
                          <PlayCircle className="size-5" aria-hidden="true" />
                          Try the demo
                        </button>
                        <button
                          type="button"
                          onClick={() => startDemo('mismatch')}
                          className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          <ShieldAlert className="size-5" aria-hidden="true" />
                          See a blocked comparison
                        </button>
                      </div>
                    ) : null}
                    <div className="mt-6 flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-300">
                        <span className="size-2 rounded-full bg-teal-300 shadow-[0_0_0_5px_rgb(94_234_212/0.1)]" />
                        {demo ? 'Local demo data · no network' : 'Private by default'}
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-teal-100">
                        Step {step} of {STEPS.length}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </motion.section>

              <ProgressRail step={step} onStepChange={setStep} />

              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={reduceMotion ? false : { opacity: 0, y: 14, filter: 'blur(3px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -8, filter: 'blur(2px)' }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  {step === 1 ? (
                    <section
                      aria-labelledby="journeys-heading"
                      className="hb-field-guide rounded-[1.5rem] border border-stone-300 bg-[#f8f1e7] p-5 shadow-sm sm:p-6"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e6e7f8] text-blue-800">
                          <Compass className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="text-xs font-semibold tracking-[0.14em] text-blue-800">
                            STEP 1 · YOUR PATH
                          </p>
                          <h2
                            id="journeys-heading"
                            className="mt-1 text-xl font-bold tracking-tight"
                          >
                            What are you preparing for?
                          </h2>
                          <p className="mt-1 text-sm leading-6 text-slate-600">
                            Choose one focused path. It keeps the rest of your visit plan simple.
                          </p>
                        </div>
                      </div>
                      <motion.div
                        initial="hidden"
                        animate="show"
                        variants={{
                          hidden: {},
                          show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
                        }}
                        className="mt-5 grid gap-3 sm:grid-cols-2"
                      >
                        {CARE_JOURNEYS.map((journey) => {
                          const Icon = icons[journey.id];
                          const active = journey.id === selectedId;
                          return (
                            <motion.button
                              variants={{
                                hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
                                show: { opacity: 1, y: 0 },
                              }}
                              key={journey.id}
                              type="button"
                              onClick={() => chooseJourney(journey.id)}
                              aria-pressed={active}
                              className={`hb-path-card relative rounded-2xl border p-4 text-left transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${active ? 'border-blue-700 bg-[#e6e7f8] shadow-sm shadow-blue-950/5' : 'border-stone-300 bg-[#fbf8f2] hover:border-blue-300 hover:shadow-md hover:shadow-slate-900/5'}`}
                            >
                              {journey.id === 'pharmacy' && !active ? (
                                <span className="absolute right-3 top-3 rounded-full bg-slate-950 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                                  Popular
                                </span>
                              ) : null}
                              {active ? (
                                <CheckCircle2
                                  className="absolute right-3 top-3 size-5 text-blue-800"
                                  aria-label="Selected"
                                />
                              ) : null}
                              <Icon
                                className={`size-5 ${active ? 'text-blue-800' : 'text-slate-600'}`}
                                aria-hidden="true"
                              />
                              <h3 className="mt-4 font-semibold text-slate-950">{journey.title}</h3>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                {journey.description}
                              </p>
                            </motion.button>
                          );
                        })}
                      </motion.div>
                      <StepControls
                        step={step}
                        onBack={() => setStep(1)}
                        onNext={() => setStep(2)}
                        nextLabel="Continue to details"
                      />
                    </section>
                  ) : null}

                  {step === 2 ? (
                    <section>
                      {selected.id === 'pharmacy' ? (
                        <MedicineCounterCheck
                          onSelect={setSelectedMedicine}
                          demo={demo}
                          onExitDemo={() => setDemo(null)}
                        />
                      ) : (
                        <section className="rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-sm backdrop-blur sm:p-6">
                          <div className="flex items-start gap-3">
                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <ShieldCheck className="size-5" aria-hidden="true" />
                            </span>
                            <div>
                              <p className="text-xs font-semibold tracking-[0.14em] text-teal-700">
                                STEP 2 · PRACTICAL DETAILS
                              </p>
                              <h2 className="mt-1 text-xl font-bold tracking-tight">
                                Gather the details that help the visit go smoothly
                              </h2>
                              <p className="mt-1 text-sm leading-6 text-slate-600">
                                For your {selected.shortTitle.toLowerCase()} visit, keep this short
                                checklist handy.
                              </p>
                            </div>
                          </div>
                          <motion.ul
                            initial="hidden"
                            animate="show"
                            variants={{
                              hidden: {},
                              show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06 } },
                            }}
                            className="mt-5 space-y-3"
                          >
                            {selected.preparation.map((item, index) => (
                              <motion.li
                                variants={{
                                  hidden: { opacity: 0, x: reduceMotion ? 0 : -10 },
                                  show: { opacity: 1, x: 0 },
                                }}
                                key={item}
                                className="flex gap-3 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"
                              >
                                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-teal-700 shadow-sm">
                                  {index + 1}
                                </span>
                                {item}
                              </motion.li>
                            ))}
                          </motion.ul>
                          <VisitRecommendations
                            journey={selected}
                            personalizedQuestion={aiPersonalizedQuestion}
                          />
                        </section>
                      )}
                      <StepControls
                        step={step}
                        onBack={() => setStep(1)}
                        onNext={() => setStep(3)}
                        nextLabel="Prepare my plan"
                      />
                    </section>
                  ) : null}

                  {step === 3 ? (
                    <section className="space-y-5">
                      <VisitNoteAssistant journey={selected} onPrepared={setPreparedVisitNote} />
                      <CareVisitBrief
                        journey={selected}
                        saved={isSaved(planId)}
                        personalizedQuestion={aiPersonalizedQuestion}
                        onSave={() =>
                          save({
                            id: planId,
                            title: selectedMedicine
                              ? `${selected.title} · ${selectedMedicine.brand}`
                              : selected.title,
                            savedAt: new Date().toISOString(),
                          })
                        }
                      />
                      <StepControls
                        step={step}
                        onBack={() => setStep(2)}
                        onNext={() => setStep(4)}
                        nextLabel="Find nearby places"
                      />
                    </section>
                  ) : null}

                  {step === 4 ? (
                    <section>
                      <PharmacyLocator
                        key={selected.id}
                        pharmacies={SAMPLE_PHARMACIES}
                        category={selected.locationCategory}
                      />
                      <StepControls
                        step={step}
                        onBack={() => setStep(3)}
                        onNext={() => setStep(4)}
                        nextLabel="Done"
                      />
                    </section>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="lg:sticky lg:top-6"
            >
              <SavedCarePlans saved={saved} onRemove={remove} onClear={clearLocalSession} />
              <div className="mt-4 hidden rounded-2xl border border-white/70 bg-white/55 p-4 text-xs leading-5 text-slate-500 backdrop-blur lg:block">
                <p className="font-semibold text-slate-700">Designed for a real conversation</p>
                <p className="mt-1">
                  HealthBridge organizes what you want to ask. It does not diagnose or tell you to
                  change medicine.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </>
  );
}
