import { DRUG_COMPARISONS } from './drugs';
import { computeSavings, isValidComparison } from './savings';
import type { DrugComparison, LookupOutcome, MatchSource, VerifiedLookup } from './types';

// Deterministic, case-insensitive lookup over the curated table. This is the
// source of truth used by both the client (local-first) and the /api/lookup
// route (server-side). No network dependency — hero searches work offline.

function normalize(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

// Build a normalized key → record index once at module load. Only records that
// pass the verified-comparison gate are indexed, so an invalid record can never
// be matched into a rendered result.
const INDEX: Map<string, DrugComparison> = (() => {
  const map = new Map<string, DrugComparison>();
  for (const record of DRUG_COMPARISONS) {
    if (!isValidComparison(record)) continue;
    const keys = [record.brand, record.generic, record.activeIngredient, ...record.aliases];
    for (const key of keys) {
      const norm = normalize(key);
      if (norm && !map.has(norm)) map.set(norm, record);
    }
  }
  return map;
})();

/** Find a curated record by exact normalized brand/generic/alias key. */
export function findComparison(query: string): DrugComparison | null {
  return INDEX.get(normalize(query)) ?? null;
}

/** Wrap a curated record into a verified lookup with computed savings. */
export function toVerifiedLookup(record: DrugComparison, source: MatchSource): VerifiedLookup {
  return {
    status: 'verified',
    source,
    comparison: record,
    savings: computeSavings(record),
  };
}

/**
 * Local-first lookup used by the client. Resolves a curated hero search with no
 * network. Returns `not_verified` for anything not in the table — never invents
 * a generic, price, or savings.
 */
export function lookupLocal(query: string): LookupOutcome {
  const trimmed = query.trim();
  if (!trimmed) return { status: 'not_verified', query: trimmed };
  const record = findComparison(trimmed);
  if (record) return toVerifiedLookup(record, 'curated');
  return { status: 'not_verified', query: trimmed };
}
