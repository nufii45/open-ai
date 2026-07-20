import { describe, expect, it } from 'vitest';

import { DEMO_SEEDS } from './demoPacks';
import { compareReviewedPacks } from './twinPack';

describe('judge demo fixtures', () => {
  it('keeps the verified demo fully deterministic and like-for-like', () => {
    expect(compareReviewedPacks(DEMO_SEEDS.match.first, DEMO_SEEDS.match.second)).toEqual({
      matches: true,
      differences: [],
    });
  });

  it('keeps the blocked demo visibly unsafe to compare', () => {
    expect(compareReviewedPacks(DEMO_SEEDS.mismatch.first, DEMO_SEEDS.mismatch.second)).toEqual({
      matches: false,
      differences: ['strength: 500 mg vs 650 mg'],
    });
  });
});
