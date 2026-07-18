'use client';

import { useCallback, useSyncExternalStore } from 'react';

// One-time medical disclaimer acceptance, backed by localStorage via
// useSyncExternalStore so React stays in sync without setState-in-effect.
// Versioned key so a future copy change can force the modal to reappear.

const STORAGE_KEY = 'healthbridge.disclaimer.v1';
const CHANGE_EVENT = 'healthbridge:disclaimer-changed';
const ACCEPTED_VALUE = 'accepted';

// Remembers acceptance for the current session even when localStorage.setItem
// throws (private mode). getSnapshot checks this before touching storage so a
// failed write still dismisses the modal instead of leaving it stuck on screen.
let sessionAccepted = false;

function getSnapshot(): boolean {
  if (sessionAccepted) return true;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === ACCEPTED_VALUE;
  } catch {
    return sessionAccepted; // storage unavailable (private mode)
  }
}

function getServerSnapshot(): boolean {
  return false;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useDisclaimer() {
  const accepted = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const accept = useCallback(() => {
    // Set the session flag first so the dispatched event always re-reads as
    // accepted, then attempt to persist. The event fires outside the try block
    // so a thrown write still dismisses the modal.
    sessionAccepted = true;
    try {
      window.localStorage.setItem(STORAGE_KEY, ACCEPTED_VALUE);
    } catch {
      // Storage unavailable — session flag keeps the modal dismissed this visit.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return { accepted, accept };
}
