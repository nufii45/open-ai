import type { DrugComparison, SavingsResult } from './types';

// Pure price/savings logic. Kept out of render functions and unit-tested.
// The verified-comparison gate here decides whether a record may EVER show a
// savings number. Do not compute or display savings for a record that fails it.

const PHP = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });
export const MAX_EVIDENCE_AGE_DAYS = 45;

/** Format a PHP amount for display. Source numbers are never pre-rounded. */
export function formatPHP(amount: number): string {
  return PHP.format(amount);
}

/** Format a fraction (e.g. 0.674) as a whole-number percent string ("67%"). */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function isPositiveFinite(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function isFreshIsoDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const observed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(observed.getTime())) return false;
  const ageDays = (Date.now() - observed.getTime()) / 86_400_000;
  return ageDays >= 0 && ageDays <= MAX_EVIDENCE_AGE_DAYS;
}

function comparisonSignature(record: DrugComparison): string {
  return [record.activeIngredient, record.strength, record.dosageForm, `${record.packQuantity} ${record.packUnit}`]
    .map((part) => part.trim().toLowerCase())
    .join('|');
}

/**
 * The verified-comparison gate. Returns true only when the record can back a
 * public savings figure: verified flag set, both prices positive finite PHP,
 * a positive pack quantity, and a genuine saving (generic strictly cheaper).
 * Rejects missing, zero, negative, or incomparable price data.
 */
export function isValidComparison(record: DrugComparison): boolean {
  if (record.verified !== true) return false;
  if (!isPositiveFinite(record.brandedPrice)) return false;
  if (!isPositiveFinite(record.genericPrice)) return false;
  if (!isPositiveFinite(record.packQuantity)) return false;
  if (record.genericPrice >= record.brandedPrice) return false; // no saving to show
  if (!record.brandedPriceSource || !record.genericPriceSource) return false;
  if (record.brandedEvidence.status !== 'verified' || record.genericEvidence.status !== 'verified') return false;
  if (!record.brandedEvidence.reference || !record.genericEvidence.reference) return false;
  const signature = comparisonSignature(record);
  if (record.brandedEvidence.matchSignature.trim().toLowerCase() !== signature) return false;
  if (record.genericEvidence.matchSignature.trim().toLowerCase() !== signature) return false;
  if (!isFreshIsoDate(record.checkedOn)) return false;
  if (!isFreshIsoDate(record.brandedEvidence.observedOn)) return false;
  if (!isFreshIsoDate(record.genericEvidence.observedOn)) return false;
  return true;
}

/**
 * Compute the display-ready savings for a comparison.
 * `savings = brandedPrice - genericPrice`, `savingsPercent = savings / brandedPrice`.
 * Intermediate values are not rounded. Throws if the record fails the gate, so
 * callers must check `isValidComparison` first (or catch) — a fabricated or
 * incomparable record can never yield a savings result.
 */
export function computeSavings(record: DrugComparison): SavingsResult {
  if (!isValidComparison(record)) {
    throw new Error(`Refusing to compute savings for invalid record: ${record.id}`);
  }
  const savings = record.brandedPrice - record.genericPrice;
  const savingsPercent = savings / record.brandedPrice;
  return {
    savings,
    savingsPercent,
    brandedPrice: record.brandedPrice,
    genericPrice: record.genericPrice,
  };
}
