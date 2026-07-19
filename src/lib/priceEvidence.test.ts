import { describe, expect, it } from 'vitest';

import { parsePriceEvidence } from './priceEvidence';

describe('price evidence response', () => {
  it('keeps a bounded PHP price for user review', () => {
    expect(
      parsePriceEvidence({
        price: 49.5,
        currency: 'PHP',
        productText: 'Biogesic 500 mg 10 tablets',
        confidence: 'high',
        notice: 'Review the printed price and pack before using it.',
      }),
    ).toEqual({
      price: 49.5,
      currency: 'PHP',
      productText: 'Biogesic 500 mg 10 tablets',
      confidence: 'high',
      notice: 'Review the printed price and pack before using it.',
    });
  });

  it('rejects model medical guidance and non-PHP currency', () => {
    expect(
      parsePriceEvidence({
        price: 10,
        currency: 'USD',
        productText: null,
        confidence: 'uncertain',
        notice: 'Review this with a pharmacist.',
      }),
    ).toBeNull();
    expect(
      parsePriceEvidence({
        price: 10,
        currency: 'PHP',
        productText: null,
        confidence: 'uncertain',
        notice: 'This treatment is safe to switch.',
      }),
    ).toBeNull();
  });
});
