import { describe, expect, it } from 'vitest';

import { DRUG_COMPARISONS } from './drugs';
import { lookupLocal } from './lookup';
import { computeSavings, isValidComparison } from './savings';

describe('lookupLocal', () => {
  it('does not expose draft catalog prices as verified results', () => {
    expect(lookupLocal('Biogesic')).toEqual({
      status: 'not_verified',
      query: 'Biogesic',
      reason: 'draft_evidence',
    });
  });

  it('marks unknown and empty input as not verified without inventing a price', () => {
    for (const query of ['NotARealMedicine', '   ']) {
      const outcome = lookupLocal(query);
      expect(outcome.status).toBe('not_verified');
      if (outcome.status === 'not_verified') expect(outcome.reason).toBe('unknown');
      expect(JSON.stringify(outcome)).not.toContain('savings');
    }
  });

  it('keeps savings unavailable until a record passes the evidence gate', () => {
    const candidate = DRUG_COMPARISONS[0];
    expect(isValidComparison(candidate)).toBe(false);
    expect(() => computeSavings(candidate)).toThrow();
  });
});
