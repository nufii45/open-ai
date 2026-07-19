import { describe, expect, it } from 'vitest';

import { DRUG_COMPARISONS } from './drugs';
import { computeSavings, formatPercent, isValidComparison } from './savings';
import type { DrugComparison } from './types';

const candidate = DRUG_COMPARISONS.find((record) => record.id === 'biogesic-paracetamol-500')!;
const today = new Date().toISOString().slice(0, 10);

function verifiedFixture(overrides: Partial<DrugComparison> = {}): DrugComparison {
  const signature = `${candidate.activeIngredient}|${candidate.strength}|${candidate.dosageForm}|${candidate.packQuantity} ${candidate.packUnit}`.toLowerCase();
  const evidence = {
    status: 'verified' as const,
    sourceName: 'Test pharmacy check',
    reference: 'HB-TEST-001',
    observedOn: today,
    packDescription: '10 tablets',
    matchSignature: signature,
  };
  return {
    ...candidate,
    verified: true,
    checkedOn: today,
    brandedPriceSource: evidence.sourceName,
    genericPriceSource: evidence.sourceName,
    brandedEvidence: evidence,
    genericEvidence: { ...evidence, reference: 'HB-TEST-002' },
    ...overrides,
  };
}

describe('computeSavings', () => {
  it('computes savings and percent without pre-rounding for a verified comparison', () => {
    const record = verifiedFixture();
    const result = computeSavings(record);
    expect(result.savings).toBe(31);
    expect(result.savingsPercent).toBeCloseTo(31 / 46, 10);
    expect(formatPercent(result.savingsPercent)).toBe('67%');
  });

  it('refuses to compute savings for an invalid record', () => {
    expect(() => computeSavings(verifiedFixture({ genericPrice: 0 }))).toThrow();
  });
});

describe('isValidComparison evidence gate', () => {
  it('rejects all draft catalog candidates until human evidence is supplied', () => {
    for (const record of DRUG_COMPARISONS) expect(isValidComparison(record)).toBe(false);
  });

  it('accepts a matching, fresh, two-sided human check', () => {
    expect(isValidComparison(verifiedFixture())).toBe(true);
  });

  it('rejects zero, negative, and non-saving prices', () => {
    expect(isValidComparison(verifiedFixture({ genericPrice: 0 }))).toBe(false);
    expect(isValidComparison(verifiedFixture({ brandedPrice: -5 }))).toBe(false);
    expect(isValidComparison(verifiedFixture({ genericPrice: 46, brandedPrice: 46 }))).toBe(false);
  });

  it('rejects missing, pending, or mismatched comparison evidence', () => {
    const record = verifiedFixture();
    expect(isValidComparison({ ...record, brandedEvidence: { ...record.brandedEvidence, reference: '' } })).toBe(false);
    expect(isValidComparison({ ...record, genericEvidence: { ...record.genericEvidence, status: 'pending' } })).toBe(false);
    expect(isValidComparison({ ...record, genericEvidence: { ...record.genericEvidence, matchSignature: 'paracetamol|250 mg|tablet|10 tablets' } })).toBe(false);
  });

  it('rejects stale evidence', () => {
    const record = verifiedFixture();
    expect(isValidComparison({ ...record, checkedOn: '2020-01-01' })).toBe(false);
  });
});
