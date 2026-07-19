import { findCareJourney } from './careJourneys';

export const VISIT_NOTE_SAFETY_REMINDER =
  'HealthBridge organizes your own words for a care conversation. It does not diagnose symptoms, assess urgency, prescribe, or replace a health professional.';

export type VisitNote = {
  summary: string;
  questions: [string, string, string];
  source: 'ai' | 'template';
};

const FORBIDDEN_LANGUAGE =
  /\b(diagnos\w*|you have|likely have|prescrib\w*|dosage|dose|contraindicat\w*|safe to|start taking|stop taking|treatment plan|emergency treatment|seek emergency|go to the emergency)\b/i;

export function normaliseVisitNote(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const note = value.replace(/\s+/g, ' ').trim();
  return note.length >= 8 && note.length <= 1_000 ? note : null;
}

function isSafeText(value: unknown, minimum = 8, maximum = 360): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length >= minimum &&
    value.trim().length <= maximum &&
    !FORBIDDEN_LANGUAGE.test(value)
  );
}

export function templateVisitNote(note: string, journeyId: unknown): VisitNote {
  const journey = findCareJourney(journeyId);
  const destination = journey?.shortTitle.toLowerCase() ?? 'care visit';
  return {
    summary: `Use your note in your own words during this ${destination}.`,
    questions: [
      'Which details from my note are most useful for you to know today?',
      'What should I write down or bring for this visit?',
      'Who should I ask if I need clarification after this visit?',
    ],
    source: 'template',
  };
}

export function parseVisitNote(value: unknown): Omit<VisitNote, 'source'> | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<Omit<VisitNote, 'source'>>;
  if (
    !isSafeText(candidate.summary) ||
    !Array.isArray(candidate.questions) ||
    candidate.questions.length !== 3 ||
    !candidate.questions.every((question) => isSafeText(question, 8, 220))
  )
    return null;
  return {
    summary: candidate.summary.trim(),
    questions: [
      candidate.questions[0].trim(),
      candidate.questions[1].trim(),
      candidate.questions[2].trim(),
    ],
  };
}

export function resolveVisitNote(
  note: unknown,
  journeyId: unknown,
  modelValue?: unknown,
): VisitNote | null {
  const normalised = normaliseVisitNote(note);
  if (!normalised) return null;
  const parsed = parseVisitNote(modelValue);
  return parsed ? { ...parsed, source: 'ai' } : templateVisitNote(normalised, journeyId);
}
