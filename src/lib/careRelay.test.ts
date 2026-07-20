import { describe, expect, it } from 'vitest';

import { findCareJourney } from './careJourneys';
import {
  CARE_RELAY_SAFETY_LIMITS,
  DEFAULT_CARE_RELAY_DRAFT,
  careRelayChecklist,
  careRelayOpeningLine,
  careRelayQuestions,
  readCareRelayDraft,
} from './careRelay';

describe('care relay', () => {
  it('creates a deterministic discharge handoff without clinical advice', () => {
    const journey = findCareJourney('discharge')!;
    const checklist = careRelayChecklist(journey, DEFAULT_CARE_RELAY_DRAFT);
    expect(checklist.join(' ')).toContain('Follow-up');
    expect(careRelayOpeningLine(journey, DEFAULT_CARE_RELAY_DRAFT)).toContain('hospital');
    expect(CARE_RELAY_SAFETY_LIMITS).toContain('cannot diagnose');
  });

  it('keeps laboratory preparation and result handoff separate from result interpretation', () => {
    const journey = findCareJourney('laboratory')!;
    const checklist = careRelayChecklist(journey, {
      ...DEFAULT_CARE_RELAY_DRAFT,
      hasLaboratoryRequest: true,
      laboratoryRelease: 'send to my clinic',
    });
    expect(checklist.join(' ')).toContain('send to my clinic');
    expect(careRelayQuestions(journey, 'en').join(' ')).not.toMatch(/interpret|diagnos/i);
  });

  it('uses supported local values only and provides Filipino questions', () => {
    const draft = readCareRelayDraft({ audience: 'caregiver', language: 'fil', clinicVisit: 'x' });
    expect(draft.audience).toBe('caregiver');
    expect(draft.clinicVisit).toBe('new');
    expect(careRelayQuestions(findCareJourney('clinic')!, 'fil')[0]).toContain('pinakamahalagang');
  });
});
