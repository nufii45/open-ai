import { describe, expect, it } from 'vitest';
import { DRUG_COMPARISONS } from './drugs';
import { computeSavings, formatPercent, isValidComparison } from './savings';
import type { DrugComparison } from './types';

const biogesic = DRUG_COMPARISONS.find((d) => d.id === 'biogesic-paracetamol-500')!;

function withPrices(over: Partial<DrugComparison>): DrugComparison {
  return { ...biogesic, ...over };
}

describe('computeSavings', () => {
  it('computes savings and percent without pre-rounding for every curated record', () => {
    for (const record of DRUG_COMPARISONS) {
      const result = computeSavings(record);
      expect(result.savings).toBeCloseTo(record.brandedPrice - record.genericPrice, 10);
      expect(result.savingsPercent).toBeCloseTo(
        (record.brandedPrice - record.genericPrice) / record.brandedPrice,
        10,
      );
      expect(result.savings).toBeGreaterThan(0);
    }
  });

  it('matches the known Biogesic figures', () => {
    const result = computeSavings(biogesic);
    expect(result.savings).toBe(31);
    expect(formatPercent(result.savingsPercent)).toBe('67%');
  });
});

describe('isValidComparison (verified gate)', () => {
  it('accepts every curated hero record', () => {
    for (const record of DRUG_COMPARISONS) {
      expect(isValidComparison(record)).toBe(true);
    }
  });

  it('rejects zero, negative, and missing prices', () => {
    expect(isValidComparison(withPrices({ genericPrice: 0 }))).toBe(false);
    expect(isValidComparison(withPrices({ brandedPrice: -5 }))).toBe(false);
    expect(isValidComparison(withPrices({ genericPrice: Number.NaN }))).toBe(false);
  });

  it('rejects a record where the generic is not cheaper (no saving)', () => {
    expect(isValidComparison(withPrices({ genericPrice: 46, brandedPrice: 46 }))).toBe(false);
    expect(isValidComparison(withPrices({ genericPrice: 50, brandedPrice: 46 }))).toBe(false);
  });

  it('rejects missing source or check date', () => {
    expect(isValidComparison(withPrices({ brandedPriceSource: '' }))).toBe(false);
    expect(isValidComparison(withPrices({ checkedOn: '' }))).toBe(false);
  });

  it('refuses to compute savings for an invalid record', () => {
    expect(() => computeSavings(withPrices({ genericPrice: 0 }))).toThrow();
  });
});
