'use client';

import { useCallback, useSyncExternalStore } from 'react';

import type { SavedCarePlan } from '@/lib/careBrief';

const STORAGE_KEY = 'healthbridge:care-plans.v1';
const CHANGE_EVENT = 'healthbridge:care-plans-changed';
const EMPTY: SavedCarePlan[] = [];

let cachedRaw: string | null = null;
let cachedValue: SavedCarePlan[] = EMPTY;

function parse(raw: string | null): SavedCarePlan[] {
  if (!raw) return EMPTY;
  try {
    const rows: unknown = JSON.parse(raw);
    if (!Array.isArray(rows)) return EMPTY;
    return rows.flatMap((row): SavedCarePlan[] => {
      if (!row || typeof row !== 'object') return [];
      const item = row as Partial<SavedCarePlan>;
      if (typeof item.id !== 'string' || typeof item.title !== 'string' || typeof item.savedAt !== 'string') return [];
      return [{ id: item.id, title: item.title, savedAt: item.savedAt }];
    });
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): SavedCarePlan[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    cachedValue = parse(raw);
    return cachedValue;
  } catch {
    return EMPTY;
  }
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(next: SavedCarePlan[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Private browsing or full storage should not break the visit planner.
  }
}

export function useSavedCarePlans() {
  const saved = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
  const save = useCallback((plan: SavedCarePlan) => {
    if (getSnapshot().some((item) => item.id === plan.id)) return;
    write([...getSnapshot(), plan]);
  }, []);
  const remove = useCallback((id: string) => write(getSnapshot().filter((item) => item.id !== id)), []);
  const isSaved = useCallback((id: string) => saved.some((item) => item.id === id), [saved]);
  return { saved, save, remove, isSaved };
}
