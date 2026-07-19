'use client';

import { useCallback, useSyncExternalStore } from 'react';

// Persisted "My medicines" list, backed by localStorage via useSyncExternalStore
// so React stays in sync with the store without setState-in-effect. Small,
// versioned schema so a future shape change can be migrated rather than throwing.

const STORAGE_KEY = 'healthbridge.saved.v1';
const CHANGE_EVENT = 'healthbridge:saved-changed';
const EMPTY: SavedMedicine[] = [];

export type SavedMedicine = {
  id: string;
  brand: string;
  generic: string;
  savings: number; // PHP, from the verified curated record only
  isPurchased: boolean;
};

function parse(raw: string | null): SavedMedicine[] {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.flatMap((row): SavedMedicine[] => {
      if (
        row &&
        typeof row.id === 'string' &&
        typeof row.brand === 'string' &&
        typeof row.generic === 'string' &&
        typeof row.savings === 'number' &&
        Number.isFinite(row.savings)
      ) {
        // v1 saved rows did not include purchase status; retain them as
        // unchecked rather than losing the person's saved comparisons.
        return [
          {
            id: row.id,
            brand: row.brand,
            generic: row.generic,
            savings: row.savings,
            isPurchased: row.isPurchased === true,
          },
        ];
      }
      return [];
    });
  } catch {
    return EMPTY;
  }
}

// Cache the parsed snapshot so getSnapshot returns a stable reference until the
// stored string actually changes (required by useSyncExternalStore).
let cachedRaw: string | null = null;
let cachedValue: SavedMedicine[] = EMPTY;

function getSnapshot(): SavedMedicine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) return cachedValue;
    cachedRaw = raw;
    cachedValue = parse(raw);
    return cachedValue;
  } catch {
    return EMPTY; // storage unavailable (private mode)
  }
}

function getServerSnapshot(): SavedMedicine[] {
  return EMPTY;
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange); // other tabs
  window.addEventListener(CHANGE_EVENT, onChange); // this tab
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function write(next: SavedMedicine[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // Storage unavailable — nothing to persist; UI keeps its current state.
  }
}

export function useSavedMedicines() {
  const saved = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const save = useCallback((medicine: SavedMedicine) => {
    const current = getSnapshot();
    if (current.some((m) => m.id === medicine.id)) return;
    write([...current, medicine]);
  }, []);

  const remove = useCallback((id: string) => {
    write(getSnapshot().filter((m) => m.id !== id));
  }, []);

  const setPurchased = useCallback((id: string, isPurchased: boolean) => {
    write(
      getSnapshot().map((medicine) =>
        medicine.id === id ? { ...medicine, isPurchased } : medicine,
      ),
    );
  }, []);

  const isSaved = useCallback((id: string) => saved.some((m) => m.id === id), [saved]);

  return { saved, save, remove, setPurchased, isSaved };
}
