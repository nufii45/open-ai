import { describe, expect, it } from 'vitest';
import { lookupLocal } from './lookup';

describe('lookupLocal', () => {
  it('resolves each hero brand case-insensitively', () => {
    for (const query of ['Biogesic', 'biogesic', '  BIOGESIC  ', 'Norvasc', 'ponstan']) {
      const outcome = lookupLocal(query);
      expect(outcome.status).toBe('verified');
    }
  });

  it('resolves via generic name and alias', () => {
    expect(lookupLocal('paracetamol').status).toBe('verified');
    expect(lookupLocal('amlodipine besylate').status).toBe('verified');
    expect(lookupLocal('dolfenal').status).toBe('verified');
  });

  it('marks an unknown brand as not verified — no invented generic or price', () => {
    const outcome = lookupLocal('NotARealMedicine');
    expect(outcome.status).toBe('not_verified');
    expect(JSON.stringify(outcome)).not.toContain('savings');
  });

  it('treats empty input as not verified', () => {
    expect(lookupLocal('   ').status).toBe('not_verified');
  });

  it('attaches a verified savings result and curated source on a hit', () => {
    const outcome = lookupLocal('Biogesic');
    if (outcome.status !== 'verified') throw new Error('expected verified');
    expect(outcome.source).toBe('curated');
    expect(outcome.savings.savings).toBe(31);
    expect(outcome.comparison.brand).toBe('Biogesic');
  });
});
