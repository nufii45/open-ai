import { findComparisonById } from './drugs';
import { isValidComparison } from './savings';
import type { DrugComparison } from './types';

export const PHARMACIST_SAFETY_REMINDER =
  'This helps you prepare a pharmacist conversation. It does not tell you to change medicine.';

export type PharmacistBrief = {
  summary: string;
  pharmacistQuestion: string;
  checklist: [string, string, string];
  safetyReminder: typeof PHARMACIST_SAFETY_REMINDER;
};

export type PharmacistBriefResult =
  | { status: 'ready'; source: 'gpt-5.6-terra' | 'template'; brief: PharmacistBrief }
  | { status: 'not_found' }
  | { status: 'not_verified' };

export type BriefGenerator = (comparison: DrugComparison) => Promise<unknown>;

const UNSAFE_LANGUAGE =
  /\b(diagnos(?:is|e)|prescrib(?:e|ed)|dosage|dose|start|stop|safe to switch|contraindicat)/i;

function isSafeText(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 500 &&
    !UNSAFE_LANGUAGE.test(value)
  );
}

export function createTemplateBrief(comparison: DrugComparison): PharmacistBrief {
  return {
    summary: `${comparison.brand} and ${comparison.generic} are listed in this comparison with the same active ingredient, strength, dosage form, and pack size.`,
    pharmacistQuestion: `Can you confirm whether this ${comparison.generic} option matches my prescribed ${comparison.brand} on ingredient, strength, form, and pack?`,
    checklist: [
      `Active ingredient: ${comparison.activeIngredient}`,
      `Strength and form: ${comparison.strength} ${comparison.dosageForm.toLowerCase()}`,
      `Matching pack: ${comparison.packQuantity} ${comparison.packUnit}`,
    ],
    safetyReminder: PHARMACIST_SAFETY_REMINDER,
  };
}

export function parsePharmacistBrief(raw: unknown): PharmacistBrief | null {
  if (!raw || typeof raw !== 'object') return null;
  const value = raw as Record<string, unknown>;
  if (!isSafeText(value.summary) || !isSafeText(value.pharmacistQuestion)) return null;
  if (
    !Array.isArray(value.checklist) ||
    value.checklist.length !== 3 ||
    !value.checklist.every(isSafeText)
  )
    return null;

  return {
    summary: value.summary.trim(),
    pharmacistQuestion: value.pharmacistQuestion.trim(),
    checklist: [value.checklist[0].trim(), value.checklist[1].trim(), value.checklist[2].trim()],
    safetyReminder: PHARMACIST_SAFETY_REMINDER,
  };
}

export async function resolveVerifiedPharmacistBrief(
  comparison: DrugComparison,
  generator: BriefGenerator,
): Promise<PharmacistBriefResult> {
  if (!isValidComparison(comparison)) return { status: 'not_verified' };

  try {
    const generated = parsePharmacistBrief(await generator(comparison));
    if (generated) return { status: 'ready', source: 'gpt-5.6-terra', brief: generated };
  } catch {
    // A stable template is safer than surfacing model or network failures.
  }

  return { status: 'ready', source: 'template', brief: createTemplateBrief(comparison) };
}

/** Resolves only catalog IDs; the browser can never submit medicine facts or prices. */
export async function resolvePharmacistBrief(
  comparisonId: string,
  generator: BriefGenerator,
): Promise<PharmacistBriefResult> {
  const comparison = findComparisonById(comparisonId);
  if (!comparison) return { status: 'not_found' };
  return resolveVerifiedPharmacistBrief(comparison, generator);
}
