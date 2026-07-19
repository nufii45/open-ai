import { findCareJourney, type CareJourney } from './careJourneys';

export const CARE_SAFETY_REMINDER = 'HealthBridge helps you prepare a care conversation. It does not diagnose, interpret results, prescribe, or replace your care team.';

export type CareBrief = {
  summary: string;
  primaryQuestion: string;
  checklist: [string, string, string];
  source: 'ai' | 'template';
};

export type RelayLanguage = 'en' | 'fil';
export type RelayAudience = 'self' | 'caregiver';
export type CareRelay = {
  language: RelayLanguage;
  audience: RelayAudience;
  openingLine: string;
  source: 'ai' | 'template';
};
export type CareBriefResponse = CareBrief & { relay: CareRelay };

export function templateCareBrief(journey: CareJourney): CareBrief {
  return {
    summary: `You selected ${journey.title.toLowerCase()}. Use this card to stay organized and ask for clarification when you need it.`,
    primaryQuestion: journey.questions[0],
    checklist: [journey.preparation[0], journey.preparation[1], journey.preparation[2]],
    source: 'template',
  };
}

type ModelBrief = Omit<CareBrief, 'source'>;

const FORBIDDEN_LANGUAGE = /\b(diagnos\w*|prescrib\w*|dosage|dose|contraindicat\w*|safe to|start taking|stop taking|you should take|emergency treatment)\b/i;

export function relayPreference(value: unknown): { language: RelayLanguage; audience: RelayAudience } {
  const item = value as Partial<{ language: RelayLanguage; audience: RelayAudience }> | null;
  return { language: item?.language === 'fil' ? 'fil' : 'en', audience: item?.audience === 'caregiver' ? 'caregiver' : 'self' };
}

function relayFallbackLine(journey: CareJourney, language: RelayLanguage, audience: RelayAudience): string {
  if (language === 'fil') {
    if (journey.id === 'pharmacy') return audience === 'caregiver' ? 'Magandang araw po. Tinutulungan ko po ang isang kapamilya; maaari po ba nating kumpirmahin ang sangkap, lakas, anyo, at dami ng laman ng gamot na ito?' : 'Magandang araw po. Maaari po ba nating kumpirmahin ang sangkap, lakas, anyo, at dami ng laman ng gamot na ito?';
    return audience === 'caregiver' ? `Magandang araw po. Tinutulungan ko po ang isang kapamilya para sa ${journey.title.toLowerCase()}; ano po ang pinakamahalagang dapat naming kumpirmahin ngayon?` : `Magandang araw po. Para sa ${journey.title.toLowerCase()}, ano po ang pinakamahalagang dapat kong kumpirmahin ngayon?`;
  }
  if (journey.id === 'pharmacy') return audience === 'caregiver' ? 'Hello. I am helping a family member. Could you help us confirm the ingredient, strength, form, and pack of this medicine?' : 'Hello. Could you help me confirm the ingredient, strength, form, and pack of this medicine?';
  return audience === 'caregiver' ? `Hello. I am helping a family member with a ${journey.title.toLowerCase()}. What is the most important thing we should confirm today?` : `Hello. For my ${journey.title.toLowerCase()}, what is the most important thing I should confirm today?`;
}

export function templateCareRelay(journey: CareJourney, preference: { language: RelayLanguage; audience: RelayAudience }): CareRelay {
  return { ...preference, openingLine: relayFallbackLine(journey, preference.language, preference.audience), source: 'template' };
}

export function parseRelayLine(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const line = value.trim();
  if (line.length < 12 || line.length > 320 || FORBIDDEN_LANGUAGE.test(line)) return null;
  return line;
}

export function parseCareBrief(value: unknown): ModelBrief | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<ModelBrief>;
  if (typeof candidate.summary !== 'string' || typeof candidate.primaryQuestion !== 'string' || !Array.isArray(candidate.checklist) || candidate.checklist.length !== 3 || !candidate.checklist.every((item) => typeof item === 'string')) return null;
  const text = [candidate.summary, candidate.primaryQuestion, ...candidate.checklist].join(' ');
  if (FORBIDDEN_LANGUAGE.test(text)) return null;
  return { summary: candidate.summary.trim(), primaryQuestion: candidate.primaryQuestion.trim(), checklist: [candidate.checklist[0], candidate.checklist[1], candidate.checklist[2]] };
}

export function resolveCareBrief(id: unknown, modelBrief?: unknown): CareBrief | null {
  const journey = findCareJourney(id);
  if (!journey) return null;
  const parsed = parseCareBrief(modelBrief);
  return parsed ? { ...parsed, source: 'ai' } : templateCareBrief(journey);
}

export function resolveCareBriefResponse(id: unknown, preferenceInput: unknown, modelValue?: unknown): CareBriefResponse | null {
  const journey = findCareJourney(id);
  if (!journey) return null;
  const preference = relayPreference(preferenceInput);
  // The factual question and checklist are never model-authored. GPT may only
  // adapt the optional opening line for language and audience.
  const brief = templateCareBrief(journey);
  const modelRelay = modelValue && typeof modelValue === 'object' ? parseRelayLine((modelValue as { relayLine?: unknown }).relayLine) : null;
  return { ...brief, relay: modelRelay ? { ...preference, openingLine: modelRelay, source: 'ai' } : templateCareRelay(journey, preference) };
}

export type SavedCarePlan = {
  id: string;
  title: string;
  savedAt: string;
};
