import { describe, expect, it } from 'vitest';

import {
  MATCH_QUESTION,
  MISMATCH_QUESTION,
  buildCounterProof,
  buildMismatchQuestion,
} from './counterProof';

const INPUT = {
  brandedName: 'Biogesic',
  genericName: 'RiteMed Paracetamol',
  ingredient: 'Paracetamol',
  strength: '500 mg',
  form: 'Tablet',
  packQuantity: '10',
  brandedPrice: 65,
  genericPrice: 24,
  checkedAt: '2026-07-20T02:00:00.000Z',
};

describe('buildCounterProof', () => {
  it('carries every field the pharmacist handoff requires', () => {
    const { text } = buildCounterProof(INPUT);
    for (const required of [
      'Biogesic',
      'RiteMed Paracetamol',
      'Paracetamol',
      '500 mg',
      'Tablet',
      '10',
      MATCH_QUESTION,
      'This is not medical advice.',
    ]) {
      expect(text).toContain(required);
    }
  });

  it('states the PHP difference between the observed prices', () => {
    const { difference, text } = buildCounterProof(INPUT);
    expect(difference).toBe(41);
    expect(text).toMatch(/Difference for this exact pack: ₱41\.00/);
  });

  it('multiplies only when a positive monthly pack count is given', () => {
    expect(buildCounterProof({ ...INPUT, packsPerMonth: 2 }).monthlyDifference).toBe(82);
    expect(buildCounterProof({ ...INPUT, packsPerMonth: 0 }).monthlyDifference).toBeNull();
    // A generic that costs more must never be projected as a monthly "saving".
    expect(
      buildCounterProof({ ...INPUT, genericPrice: 90, packsPerMonth: 2 }).monthlyDifference,
    ).toBeNull();
  });

  it('never recommends switching', () => {
    const { text } = buildCounterProof(INPUT);
    expect(text).not.toMatch(/\b(switch|cheaper|instead of|you should|buy)\b/i);
  });
});

describe('buildMismatchQuestion', () => {
  it('asks a different question than the matching case', () => {
    const question = buildMismatchQuestion(['strength: 500 mg vs 650 mg']);
    expect(question).toContain(MISMATCH_QUESTION);
    expect(question).not.toContain(MATCH_QUESTION);
    expect(question).toContain('strength: 500 mg vs 650 mg');
  });
});
