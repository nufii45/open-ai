import { describe, expect, it } from 'vitest';

import { normaliseVisitNote, parseVisitNote, resolveVisitNote, templateVisitNote } from './visitNote';

describe('visit note', () => {
  it('normalises a short user-authored visit note', () => {
    expect(normaliseVisitNote('  I have had a cough for two days.  ')).toBe('I have had a cough for two days.');
    expect(normaliseVisitNote('short')).toBeNull();
  });

  it('uses a deterministic non-clinical fallback', () => {
    const note = templateVisitNote('I want to discuss a concern.', 'clinic');
    expect(note.source).toBe('template');
    expect(note.questions).toHaveLength(3);
  });

  it('rejects model language that diagnoses or prescribes', () => {
    expect(parseVisitNote({ summary: 'You likely have an infection.', questions: ['What should I ask today?', 'What should I bring?', 'Who can I call later?'] })).toBeNull();
    expect(resolveVisitNote('I have a concern to discuss.', 'clinic', { summary: 'You should start taking this.', questions: ['What should I ask today?', 'What should I bring?', 'Who can I call later?'] })?.source).toBe('template');
  });
});
