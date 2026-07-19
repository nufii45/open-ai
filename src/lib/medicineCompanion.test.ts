import { describe, expect, it } from 'vitest';

import { DRUG_COMPARISONS } from './drugs';
import { calculateObservedImpact, evaluatePackMatch } from './medicineCompanion';

const comparison = DRUG_COMPARISONS[0];
const matched = {
  strength: comparison.strength,
  dosageForm: comparison.dosageForm,
  packQuantity: comparison.packQuantity,
  brandedPrice: 50,
  genericPrice: 20,
  confirmedSamePack: true,
};

describe('medicine companion', () => {
  it('accepts a matching observed pack and calculates observed savings', () => {
    const match = evaluatePackMatch(comparison, matched);
    expect(match.status).toBe('match');
    expect(calculateObservedImpact(matched, match)).toEqual({
      savings: 30,
      percent: 60,
      status: 'saves',
    });
  });

  it('rejects a strength, form, pack, or confirmation mismatch', () => {
    const match = evaluatePackMatch(comparison, {
      ...matched,
      strength: '250 mg',
      dosageForm: 'Capsule',
      packQuantity: 20,
      confirmedSamePack: false,
    });
    expect(match.status).toBe('mismatch');
    expect(match.differences).toHaveLength(4);
    expect(calculateObservedImpact(matched, match)).toBeNull();
  });

  it('does not turn a higher observed generic price into a saving', () => {
    const match = evaluatePackMatch(comparison, { ...matched, genericPrice: 60 });
    expect(calculateObservedImpact({ ...matched, genericPrice: 60 }, match)).toEqual({
      savings: -10,
      percent: 20,
      status: 'no_saving',
    });
  });
});
