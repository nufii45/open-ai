'use client';

import { Check, Copy, LoaderCircle, LockKeyhole, MessageSquareText, Mic, Pencil, Square } from 'lucide-react';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

import type { CareJourney } from '@/lib/careJourneys';
import { type VisitNote, VISIT_NOTE_SAFETY_REMINDER } from '@/lib/visitNote';

type Phase = 'idle' | 'loading' | 'ready' | 'error';
type DictationLanguage = 'en-PH' | 'fil-PH';
type SpeechRecognitionResult = { isFinal: boolean; 0: { transcript: string } };
type SpeechRecognitionEvent = { resultIndex: number; results: ArrayLike<SpeechRecognitionResult> };
type BrowserSpeechRecognition = { lang: string; continuous: boolean; interimResults: boolean; maxAlternatives: number; onresult: ((event: SpeechRecognitionEvent) => void) | null; onerror: (() => void) | null; onend: (() => void) | null; start: () => void; stop: () => void };
type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;
type SpeechWindow = Window & typeof globalThis & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };

const PROMPTS = ['What I want to discuss: ', 'When I first noticed it: ', 'Medicines or products I want to mention: ', 'What I want clarified: '];
function subscribeToNothing() { return () => {}; }
function supportsBrowserDictation() {
  if (typeof window === 'undefined') return false;
  const speechWindow = window as SpeechWindow;
  return Boolean(speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition);
}

export function VisitNoteAssistant({ journey }: { journey: CareJourney }) {
  const [note, setNote] = useState('');
  const [consented, setConsented] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<VisitNote | null>(null);
  const [copied, setCopied] = useState(false);
  const [dictationLanguage, setDictationLanguage] = useState<DictationLanguage>('en-PH');
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState(false);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const speechSupported = useSyncExternalStore(subscribeToNothing, supportsBrowserDictation, () => false);

  useEffect(() => () => recognitionRef.current?.stop(), []);

  function resetResult() { setResult(null); setPhase('idle'); setCopied(false); }
  function addPrompt(prompt: string) { setNote((current) => current.trim() ? `${current.trim()}\n${prompt}` : prompt); resetResult(); }
  function appendTranscript(transcript: string) {
    const clean = transcript.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    setNote((current) => `${current.trim()}${current.trim() ? ' ' : ''}${clean}`.slice(0, 1_000));
    resetResult();
  }
  function startDictation() {
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) return;
    setSpeechError(false);
    const recognition = new Recognition();
    recognition.lang = dictationLanguage;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let index = event.resultIndex; index < event.results.length; index += 1) if (event.results[index]?.isFinal) transcript += ` ${event.results[index][0]?.transcript ?? ''}`;
      appendTranscript(transcript);
    };
    recognition.onerror = () => setSpeechError(true);
    recognition.onend = () => { setListening(false); recognitionRef.current = null; };
    recognitionRef.current = recognition;
    try { recognition.start(); setListening(true); } catch { setSpeechError(true); setListening(false); }
  }
  async function prepareNote() {
    if (!consented || note.trim().length < 8) return;
    setPhase('loading'); setCopied(false);
    try {
      const response = await fetch('/api/visit-note', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ journeyId: journey.id, note }) });
      const data = (await response.json()) as VisitNote | { error?: string };
      if (!response.ok || !('summary' in data) || !Array.isArray(data.questions)) throw new Error('Could not prepare note.');
      setResult(data); setPhase('ready');
    } catch { setPhase('error'); }
  }
  async function copy() {
    if (!result || !navigator.clipboard) return;
    const text = `My note for this ${journey.shortTitle.toLowerCase()}\n\n${note.trim()}\n\nQuestions to ask\n${result.questions.map((question) => `- ${question}`).join('\n')}\n\n${VISIT_NOTE_SAFETY_REMINDER}`;
    try { await navigator.clipboard.writeText(text); setCopied(true); } catch { setCopied(false); }
  }

  return <section className="hb-stage-panel rounded-[1.5rem] border border-stone-300 bg-[#f8f1e7] p-5 shadow-sm sm:p-6" aria-labelledby="visit-note-heading">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-800"><MessageSquareText className="size-5" aria-hidden="true" /></span><div><p className="text-xs font-semibold tracking-[0.14em] text-blue-800">OPTIONAL · PRIVATE VISIT NOTE</p><h2 id="visit-note-heading" className="mt-1 text-xl font-bold tracking-tight text-slate-950">Turn your words into questions to ask</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Describe what you want to bring up in plain language. This is not a diagnostic chat; it only helps prepare a conversation.</p></div></div><span className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-[#efe7da] px-3 py-1.5 text-xs font-medium text-slate-600"><LockKeyhole className="size-3.5" aria-hidden="true" />Not saved</span></div>

    {!result ? <>
      <div className="mt-5 flex flex-wrap gap-2">{PROMPTS.map((prompt) => <button key={prompt} type="button" onClick={() => addPrompt(prompt)} className="rounded-full border border-stone-300 bg-[#fffaf2] px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">{prompt.slice(0, -2)}</button>)}</div>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3"><label htmlFor="visit-note" className="block text-sm font-semibold text-slate-800">Your temporary note</label>{speechSupported ? <div className="flex items-center gap-2"><label htmlFor="dictation-language" className="text-xs font-medium text-slate-500">Dictation</label><select id="dictation-language" value={dictationLanguage} onChange={(event) => setDictationLanguage(event.target.value as DictationLanguage)} disabled={listening} className="h-9 rounded-lg border border-stone-300 bg-[#fffaf2] px-2 text-xs font-medium text-slate-700 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-700/15"><option value="en-PH">English</option><option value="fil-PH">Filipino</option></select><button type="button" onClick={listening ? () => recognitionRef.current?.stop() : startDictation} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${listening ? 'bg-red-700 text-white hover:bg-red-800' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>{listening ? <Square className="size-3.5" aria-hidden="true" /> : <Mic className="size-3.5" aria-hidden="true" />}{listening ? 'Stop' : 'Dictate'}</button></div> : null}</div>
      <textarea id="visit-note" value={note} onChange={(event) => { setNote(event.target.value.slice(0, 1_000)); resetResult(); }} rows={5} maxLength={1_000} placeholder="For example: I want to explain what I noticed, when it started, and ask what information matters for my visit." className="mt-2 w-full resize-y rounded-2xl border border-stone-300 bg-[#fffaf2] p-3 text-sm leading-6 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-700 focus:ring-4 focus:ring-blue-700/10" />
      <div className="mt-2 flex justify-between gap-3 text-xs text-slate-500"><span>Do not include your name, address, or identification number.</span><span>{note.length}/1000</span></div>
      {speechSupported ? <p className="mt-2 text-xs leading-5 text-slate-500">Dictation is handled by your browser. Review and edit the transcript before you choose to send it to HealthBridge.</p> : <p className="mt-2 text-xs leading-5 text-slate-500">Dictation is not supported in this browser. You can still type your note.</p>}
      {speechError ? <p role="alert" className="mt-2 text-xs leading-5 text-amber-800">We could not start dictation. Check microphone permission, then try again or type your note.</p> : null}
      <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-stone-200 bg-[#f0ece4] p-3 text-sm leading-5 text-slate-700"><input type="checkbox" checked={consented} onChange={(event) => setConsented(event.target.checked)} className="mt-0.5 size-4 accent-blue-700" />I understand this note is sent to HealthBridge only to create this card. It is not saved in my plan or used for diagnosis.</label>
      <div className="mt-4 flex flex-wrap items-center gap-3"><button type="button" onClick={() => void prepareNote()} disabled={!consented || note.trim().length < 8 || phase === 'loading'} className="hb-primary-cta inline-flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300">{phase === 'loading' ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <MessageSquareText className="size-4" aria-hidden="true" />}{phase === 'loading' ? 'Preparing your note' : 'Prepare my questions'}</button>{!consented && note.trim().length >= 8 ? <span className="text-xs text-slate-500">Consent is required before sending.</span> : null}</div>
      {phase === 'error' ? <p role="alert" className="mt-3 text-sm text-amber-800">We could not prepare your questions. Your note remains only in this browser—please try again or use it directly at your visit.</p> : null}
    </> : <article className="hb-conversation-card mt-5 rounded-[1.3rem] border border-blue-200 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-800">Your conversation card</p><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-700">{result.summary}</p></div><button type="button" onClick={resetResult} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-[#fffaf2] px-3 text-xs font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><Pencil className="size-3.5" aria-hidden="true" />Edit note</button></div>
      <div className="mt-4 rounded-xl border border-stone-200 bg-[#fffaf2] p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your own note</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{note.trim()}</p></div>
      <p className="mt-4 text-sm font-semibold text-slate-950">Questions to ask</p><ul className="mt-2 space-y-2">{result.questions.map((question) => <li key={question} className="flex gap-2 text-sm leading-6 text-slate-700"><Check className="mt-1 size-4 shrink-0 text-blue-800" aria-hidden="true" />{question}</li>)}</ul>
      <button type="button" onClick={() => void copy()} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg border border-stone-300 bg-[#fffaf2] px-3 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><Copy className="size-4" aria-hidden="true" />{copied ? 'Copied' : 'Copy visit card'}</button><p className="mt-3 text-xs text-slate-500">{result.source === 'ai' ? 'GPT-5.6 organized questions from your words; it did not make a medical assessment.' : 'Using the built-in question template.'}</p>
    </article>}
    <p className="mt-5 border-t border-stone-200 pt-4 text-xs leading-5 text-slate-500">If you believe you need urgent or emergency help, contact local emergency services or a qualified professional now instead of waiting for this tool. {VISIT_NOTE_SAFETY_REMINDER}</p>
  </section>;
}
