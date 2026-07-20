import { describe, expect, it } from 'vitest';

import { compareReviewedPacks } from './twinPack';

const pack = {
  brand: 'Brand A',
  generic: 'Paracetamol',
  activeIngredient: 'Paracetamol',
  strength: '500 mg',
  dosageForm: 'Tablet',
  packQuantity: 10,
  confidence: 'high' as const,
  notice: 'Review the printed package.',
};

describe('twin package gate', () => {
  it('allows only a complete like-for-like reviewed pack', () => {
    expect(compareReviewedPacks(pack, { ...pack, brand: 'Generic B' })).toEqual({
      matches: true,
      differences: [],
    });
  });

  it('blocks a strength or pack mismatch', () => {
    expect(compareReviewedPacks(pack, { ...pack, strength: '250 mg', packQuantity: 20 })).toEqual({
      matches: false,
      differences: ['strength: 500 mg vs 250 mg', 'pack quantity: 10 vs 20'],
    });
  });

  it('blocks a different dosage form even when the ingredient and strength match', () => {
    expect(compareReviewedPacks(pack, { ...pack, dosageForm: 'Capsule' })).toEqual({
      matches: false,
      differences: ['form: Tablet vs Capsule'],
    });
  });

  it('blocks a different pack count even when every other field matches', () => {
    expect(compareReviewedPacks(pack, { ...pack, packQuantity: 20 })).toEqual({
      matches: false,
      differences: ['pack quantity: 10 vs 20'],
    });
  });
});
