import type { DrugComparison, PriceEvidence } from './types';

// This catalog intentionally contains draft comparison candidates. Prices may
// never appear in the app until the team replaces BOTH pending evidence records
// with a dated Philippine source or internal receipt/screenshot reference.

const PENDING_EVIDENCE: PriceEvidence = {
  status: 'pending',
  sourceName: 'Local pharmacy evidence required',
  reference: 'See docs/PRICE_EVIDENCE_TEMPLATE.md',
  observedOn: null,
  packDescription: 'Verify the exact matching pack before enabling this comparison.',
  matchSignature: '',
};

function pendingEvidence(): PriceEvidence {
  return { ...PENDING_EVIDENCE };
}

function draftComparison(
  comparison: Omit<
    DrugComparison,
    | 'brandedPriceSource'
    | 'genericPriceSource'
    | 'checkedOn'
    | 'brandedEvidence'
    | 'genericEvidence'
    | 'verified'
  >,
): DrugComparison {
  return {
    ...comparison,
    brandedPriceSource: PENDING_EVIDENCE.sourceName,
    genericPriceSource: PENDING_EVIDENCE.sourceName,
    checkedOn: null,
    brandedEvidence: pendingEvidence(),
    genericEvidence: pendingEvidence(),
    verified: false,
  };
}

export const DRUG_COMPARISONS: readonly DrugComparison[] = [
  draftComparison({
    id: 'biogesic-paracetamol-500',
    brand: 'Biogesic',
    generic: 'Paracetamol',
    aliases: ['biogesic 500', 'paracetamol', 'para'],
    activeIngredient: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packQuantity: 10,
    packUnit: 'tablets',
    brandedPrice: 46,
    genericPrice: 15,
    category: 'Pain & fever',
    indication: 'Commonly used for mild fever and everyday aches.',
    safetyFlag: 'Do not combine multiple paracetamol products at once.',
  }),
  draftComparison({
    id: 'norvasc-amlodipine-5',
    brand: 'Norvasc',
    generic: 'Amlodipine',
    aliases: ['norvasc 5', 'amlodipine', 'amlodipine besylate'],
    activeIngredient: 'Amlodipine besylate',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packQuantity: 30,
    packUnit: 'tablets',
    brandedPrice: 1338,
    genericPrice: 118.5,
    category: 'Blood pressure',
    indication: 'A maintenance medicine often prescribed for high blood pressure.',
    safetyFlag: 'A maintenance medicine — do not start or stop without your doctor.',
  }),
  draftComparison({
    id: 'ponstan-mefenamic-500',
    brand: 'Ponstan',
    generic: 'Mefenamic acid',
    aliases: ['ponstan 500', 'mefenamic', 'mefenamic acid', 'dolfenal'],
    activeIngredient: 'Mefenamic acid',
    strength: '500 mg',
    dosageForm: 'Capsule',
    packQuantity: 10,
    packUnit: 'capsules',
    brandedPrice: 279,
    genericPrice: 58,
    category: 'Pain relief',
    indication: 'Commonly used for short-term relief of mild to moderate pain.',
    safetyFlag: 'Take with food; not for long-term use without advice.',
  }),
  draftComparison({
    id: 'lipitor-atorvastatin-20',
    brand: 'Lipitor',
    generic: 'Atorvastatin',
    aliases: ['lipitor 20', 'atorvastatin', 'atorva'],
    activeIngredient: 'Atorvastatin calcium',
    strength: '20 mg',
    dosageForm: 'Tablet',
    packQuantity: 30,
    packUnit: 'tablets',
    brandedPrice: 1678.5,
    genericPrice: 358.5,
    category: 'Cholesterol',
    indication: 'A maintenance medicine often prescribed to help manage cholesterol.',
    safetyFlag: 'A maintenance medicine — dose changes are decided by your doctor.',
  }),
  draftComparison({
    id: 'glucophage-metformin-500',
    brand: 'Glucophage',
    generic: 'Metformin',
    aliases: ['glucophage 500', 'metformin', 'metformin hcl'],
    activeIngredient: 'Metformin hydrochloride',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packQuantity: 100,
    packUnit: 'tablets',
    brandedPrice: 895,
    genericPrice: 248,
    category: 'Blood sugar',
    indication: 'A maintenance medicine often prescribed to help manage blood sugar.',
    safetyFlag: 'A maintenance medicine — do not adjust the dose on your own.',
  }),
];

/** Brand names shown as popular chips once their evidence is verified. */
export const POPULAR_BRANDS: readonly string[] = DRUG_COMPARISONS.filter(
  (comparison) => comparison.verified,
).map((comparison) => comparison.brand);

export function findComparisonById(id: string): DrugComparison | null {
  return DRUG_COMPARISONS.find((comparison) => comparison.id === id) ?? null;
}
