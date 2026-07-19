import { describe, expect, it } from 'vitest';

import { CARE_SAFETY_REMINDER, parseCareBrief, parseRelayLine, resolveCareBrief, resolveCareBriefResponse, templateCareBrief, templateCareRelay } from './careBrief';
import { findCareJourney } from './careJourneys';

describe('care visit brief', () => {
  it('creates a deterministic, non-clinical fallback for a known journey', () => {
    const journey = findCareJourney('clinic');
    expect(journey).not.toBeNull();
    const brief = templateCareBrief(journey!);
    expect(brief.source).toBe('template');
    expect(brief.checklist).toHaveLength(3);
    expect(CARE_SAFETY_REMINDER).toContain('does not diagnose');
  });

  it('accepts a structured care-preparation response', () => {
    expect(parseCareBrief({ summary: 'Bring your appointment details.', primaryQuestion: 'What should I write down before I leave?', checklist: ['Bring your ID.', 'Confirm the appointment time.', 'Ask where to follow up.'] })).not.toBeNull();
  });

  it('rejects clinical or treatment language from a model response', () => {
    expect(parseCareBrief({ summary: 'You should start taking this.', primaryQuestion: 'What dose should I take?', checklist: ['One', 'Two', 'Three'] })).toBeNull();
  });

  it('falls back for invalid output and rejects an unknown journey', () => {
    expect(resolveCareBrief('pharmacy', { summary: 'diagnosis', primaryQuestion: 'question', checklist: ['a', 'b', 'c'] })?.source).toBe('template');
    expect(resolveCareBrief('not-a-journey')).toBeNull();
  });

  it('creates an audience-aware Filipino fallback relay without clinical advice', () => {
    const journey = findCareJourney('pharmacy')!;
    const relay = templateCareRelay(journey, { language: 'fil', audience: 'caregiver' });
    expect(relay.openingLine).toContain('kapamilya');
    expect(relay.source).toBe('template');
  });

  it('keeps the canonical brief and rejects unsafe generated relay language', () => {
    expect(parseRelayLine('You should start taking this dose today.')).toBeNull();
    const response = resolveCareBriefResponse('pharmacy', { language: 'en', audience: 'self' }, { summary: 'Bring your medicine pack.', primaryQuestion: 'Can you help me confirm the pack?', checklist: ['One', 'Two', 'Three'], relayLine: 'Please prescribe a dose.' });
    expect(response?.relay.source).toBe('template');
    expect(response?.checklist).toEqual(findCareJourney('pharmacy')?.preparation);
  });
});
