'use client';

import {
  Camera,
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  ScanLine,
  ShieldCheck,
  X,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import Image from 'next/image';
import { ChangeEvent, useEffect, useRef, useState } from 'react';

import type { PackScanResult } from '@/lib/packScan';

type Phase = 'idle' | 'ready' | 'scanning' | 'error';

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function PackScan({ onApply }: { onApply: (result: PackScanResult) => void }) {
  const reduceMotion = useReducedMotion();
  const inputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [result, setResult] = useState<PackScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!cameraOpen || !cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
    void videoRef.current.play().catch(() => undefined);
  }, [cameraOpen, cameraStream]);

  useEffect(() => () => stopStream(cameraStream), [cameraStream]);

  function closeCamera() {
    stopStream(cameraStream);
    setCameraStream(null);
    setCameraOpen(false);
  }

  function reset() {
    closeCamera();
    setPhase('idle');
    setImageDataUrl(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function loadImage(dataUrl: string) {
    setImageDataUrl(dataUrl);
    setResult(null);
    setError(null);
    setPhase('ready');
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 3_000_000) {
      setError('Choose a JPG, PNG, or WebP image smaller than 3 MB.');
      setPhase('error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' && loadImage(reader.result);
    reader.onerror = () => {
      setError('We could not read this image.');
      setPhase('error');
    };
    reader.readAsDataURL(file);
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        'Live camera capture is not available in this browser. You can upload a photo instead.',
      );
      setPhase('error');
      return;
    }
    setError(null);
    setCameraOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1600 },
          height: { ideal: 1200 },
        },
        audio: false,
      });
      setCameraStream(stream);
    } catch {
      setCameraOpen(false);
      setError('Camera permission was not granted. You can upload a medicine-box photo instead.');
      setPhase('error');
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setError('The camera is still starting. Please try again in a moment.');
      return;
    }
    const maxWidth = 1400;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      setError('We could not capture this photo.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    loadImage(canvas.toDataURL('image/jpeg', 0.88));
    closeCamera();
  }

  async function scan() {
    if (!imageDataUrl) return;
    setPhase('scanning');
    setError(null);
    try {
      const response = await fetch('/api/pack-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl }),
      });
      const data = (await response.json()) as { result?: PackScanResult; error?: string };
      if (!response.ok || !data.result)
        throw new Error(data.error ?? 'Pack Scan could not read this image.');
      setResult(data.result);
      setPhase('ready');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Pack Scan could not read this image.');
      setPhase('error');
    }
  }

  function updateExtracted<K extends keyof PackScanResult>(key: K, value: PackScanResult[K]) {
    setResult((current) => (current ? { ...current, [key]: value } : current));
  }

  return (
    <section
      aria-labelledby="pack-scan-heading"
      className="mt-5 overflow-hidden rounded-2xl border border-indigo-100 bg-[radial-gradient(circle_at_100%_0%,rgb(199_210_254/0.58),transparent_38%),linear-gradient(135deg,rgb(238_242_255),rgb(255_255_255)_48%,rgb(240_253_250))] p-4 shadow-sm sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-teal-100 shadow-lg shadow-slate-900/15">
            <ScanLine className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-semibold tracking-[0.14em] text-indigo-700">
              AI PACK SCAN · OPTIONAL
            </p>
            <h3
              id="pack-scan-heading"
              className="mt-1 text-base font-semibold tracking-tight text-slate-950"
            >
              Start with the printed package, not a guess
            </h3>
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Capture a medicine box or blister pack. HealthBridge turns visible text into editable
              fields; it does not diagnose, prescribe, or recommend a switch.
            </p>
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
              If you choose to scan, the image is sent to our server&apos;s AI service for this
              extraction request and is not saved by HealthBridge. Manual entry remains available.
            </p>
          </div>
        </div>
        {imageDataUrl ? (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-slate-600 transition hover:bg-white"
          >
            <X className="size-4" aria-hidden="true" />
            Clear
          </button>
        ) : null}
      </div>

      {!imageDataUrl ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => void openCamera()}
            className="group flex min-h-28 items-start gap-3 rounded-2xl border border-slate-900 bg-slate-950 p-4 text-left text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-teal-300 text-slate-950 transition group-hover:scale-105">
              <Camera className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold">Use camera</span>
              <span className="mt-1 block text-xs leading-5 text-slate-300">
                Open your rear camera and frame the package label.
              </span>
            </span>
          </button>
          <input
            ref={inputRef}
            onChange={selectImage}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            id="medicine-pack-image"
          />
          <label
            htmlFor="medicine-pack-image"
            className="group flex min-h-28 cursor-pointer items-start gap-3 rounded-2xl border border-indigo-100 bg-white/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus-within:ring-2 focus-within:ring-teal-600 focus-within:ring-offset-2"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 transition group-hover:scale-105">
              <ImagePlus className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-950">Upload a photo</span>
              <span className="mt-1 block text-xs leading-5 text-slate-600">
                JPG, PNG, or WebP · up to 3 MB. The image is not saved.
              </span>
            </span>
          </label>
        </div>
      ) : (
        <div className="mt-5 grid gap-4 rounded-2xl border border-white bg-white/85 p-3 shadow-sm sm:grid-cols-[8.5rem_minmax(0,1fr)]">
          <Image
            src={imageDataUrl}
            alt="Selected medicine package"
            width={136}
            height={116}
            unoptimized
            className="h-29 w-[8.5rem] rounded-xl object-cover"
          />
          <div className="self-center">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-teal-700">
              Photo ready
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Review the preview, then let AI extract only the printed pack details.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void scan()}
                disabled={phase === 'scanning'}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:bg-slate-400"
              >
                {phase === 'scanning' ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ScanLine className="size-4" aria-hidden="true" />
                )}
                {phase === 'scanning' ? 'Reading printed details…' : 'Scan package details'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Retake
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-teal-700" aria-hidden="true" />
        Use only a product package—never a prescription, ID, or personal document. You stay in
        control of what is applied.
      </div>
      {error ? (
        <p role="alert" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {error}
        </p>
      ) : null}
      {result ? (
        <div className="mt-4 rounded-xl border border-white/80 bg-white/70 p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900">Review the extracted fields</p>
            <span className="text-xs text-slate-500">Editable before use</span>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Keep only details you can read on the physical package.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="text-xs font-semibold text-slate-600">
              Brand
              <input
                value={result.brand ?? ''}
                onChange={(event) => updateExtracted('brand', event.target.value || null)}
                placeholder="Not read"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Ingredient
              <input
                value={result.activeIngredient ?? result.generic ?? ''}
                onChange={(event) =>
                  updateExtracted('activeIngredient', event.target.value || null)
                }
                placeholder="Not read"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Strength
              <input
                value={result.strength ?? ''}
                onChange={(event) => updateExtracted('strength', event.target.value || null)}
                placeholder="Not read"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Form
              <input
                value={result.dosageForm ?? ''}
                onChange={(event) => updateExtracted('dosageForm', event.target.value || null)}
                placeholder="Not read"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
            <label className="text-xs font-semibold text-slate-600">
              Pack quantity
              <input
                type="number"
                min="1"
                value={result.packQuantity ?? ''}
                onChange={(event) =>
                  updateExtracted(
                    'packQuantity',
                    event.target.value ? Number(event.target.value) : null,
                  )
                }
                placeholder="Not read"
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
              />
            </label>
          </div>
        </div>
      ) : null}
      {result ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.25 }}
          className="mt-4 rounded-xl border border-teal-100 bg-white/90 p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <CheckCircle2 className="size-4 text-teal-700" aria-hidden="true" />
              Package details ready for review
            </p>
            <span
              className={`rounded-full px-2 py-1 text-[11px] font-semibold ${result.confidence === 'high' ? 'bg-teal-50 text-teal-800' : 'bg-amber-50 text-amber-800'}`}
            >
              {result.confidence === 'high' ? 'Clear print detected' : 'Review closely'}
            </span>
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-slate-500">Brand / ingredient</dt>
              <dd className="font-medium text-slate-900">
                {result.brand ?? result.generic ?? result.activeIngredient ?? 'Not read'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500">Strength / form / pack</dt>
              <dd className="font-medium text-slate-900">
                {[
                  result.strength,
                  result.dosageForm,
                  result.packQuantity ? `${result.packQuantity} units` : null,
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Not read'}
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-slate-600">{result.notice}</p>
          <button
            type="button"
            onClick={() => onApply(result)}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 text-sm font-semibold text-teal-900 transition hover:bg-teal-100"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Use as editable starting point
          </button>
        </motion.div>
      ) : null}

      {cameraOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Capture medicine package"
          className="fixed inset-0 z-50 flex items-end bg-slate-950/75 p-3 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.24 }}
            className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950 p-3 text-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 px-2 pb-3">
              <div>
                <p className="text-sm font-semibold">Frame the medicine package</p>
                <p className="mt-0.5 text-xs text-slate-300">
                  Keep the name, strength, form, and pack count visible.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCamera}
                className="inline-flex size-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close camera"
              >
                <X className="size-5" aria-hidden="true" />
              </button>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="aspect-[4/3] w-full object-cover"
              />
              <div
                className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-teal-300/90 shadow-[0_0_0_9999px_rgb(2_6_23/0.2)]"
                aria-hidden="true"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-2 pt-3">
              <button
                type="button"
                onClick={closeCamera}
                className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraStream}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-teal-200 disabled:opacity-50"
              >
                <Camera className="size-4" aria-hidden="true" />
                Capture package
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
      <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
    </section>
  );
}
