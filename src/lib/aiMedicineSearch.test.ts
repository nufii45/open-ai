import { describe, expect, it } from 'vitest';

import { parseAiMedicineCandidates } from './aiMedicineSearch';

describe('AI medicine search output', () => {
  it('accepts grounded candidate-shaped data', () => {
    expect(
      parseAiMedicineCandidates({
        matches: [
          {
            name: 'Example brand',
            possibleGeneric: 'Example ingredient',
            reason: 'Listed as a possible product name in an official reference.',
          },
        ],
      }),
    ).toEqual([
      {
        name: 'Example brand',
        possibleGeneric: 'Example ingredient',
        reason: 'Listed as a possible product name in an official reference.',
      },
    ]);
  });

  it('rejects clinical or treatment language', () => {
    expect(
      parseAiMedicineCandidates({
        matches: [
          {
            name: 'Example brand',
            possibleGeneric: 'Example ingredient',
            reason: 'You should start taking this treatment.',
          },
        ],
      }),
    ).toEqual([]);
  });
});
