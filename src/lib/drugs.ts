import type { DrugComparison } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Curated hero comparisons — the ONLY source of truth for displayed prices and
// savings. Every record pairs a brand and generic on the SAME active ingredient,
// strength, dosage form, and pack quantity, so the per-pack savings is valid.
//
// ⚠️ DEMO DATA: prices are illustrative reference figures for the prototype. Per
// AGENTS.md "Demo readiness checklist", re-verify each price against its real
// cited source on the day of the demo before making any public savings claim.
// ─────────────────────────────────────────────────────────────────────────────

const CHECKED_ON = '2026-07-15';

export const DRUG_COMPARISONS: readonly DrugComparison[] = [
  {
    id: 'biogesic-paracetamol-500',
    brand: 'Biogesic',
    generic: 'Paracetamol',
    aliases: ['biogesic 500', 'paracetamol', 'para', 'bioflu'],
    activeIngredient: 'Paracetamol',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packQuantity: 10,
    packUnit: 'tablets',
    brandedPrice: 46.0,
    genericPrice: 15.0,
    brandedPriceSource: 'Mercury Drug SRP (sample)',
    genericPriceSource: 'Generics Pharmacy SRP (sample)',
    checkedOn: CHECKED_ON,
    category: 'Pain & fever',
    verified: true,
    indication: 'Commonly used for mild fever and everyday aches.',
    safetyFlag: 'Do not combine multiple paracetamol products at once.',
  },
  {
    id: 'norvasc-amlodipine-5',
    brand: 'Norvasc',
    generic: 'Amlodipine',
    aliases: ['norvasc 5', 'amlodipine', 'amlodipine besylate'],
    activeIngredient: 'Amlodipine besylate',
    strength: '5 mg',
    dosageForm: 'Tablet',
    packQuantity: 30,
    packUnit: 'tablets',
    brandedPrice: 1338.0,
    genericPrice: 118.5,
    brandedPriceSource: 'Mercury Drug SRP (sample)',
    genericPriceSource: 'Generics Pharmacy SRP (sample)',
    checkedOn: CHECKED_ON,
    category: 'Blood pressure',
    verified: true,
    indication: 'A maintenance medicine often prescribed for high blood pressure.',
    safetyFlag: 'A maintenance medicine — do not start or stop without your doctor.',
  },
  {
    id: 'ponstan-mefenamic-500',
    brand: 'Ponstan',
    generic: 'Mefenamic acid',
    aliases: ['ponstan 500', 'mefenamic', 'mefenamic acid', 'dolfenal'],
    activeIngredient: 'Mefenamic acid',
    strength: '500 mg',
    dosageForm: 'Capsule',
    packQuantity: 10,
    packUnit: 'capsules',
    brandedPrice: 279.0,
    genericPrice: 58.0,
    brandedPriceSource: 'Mercury Drug SRP (sample)',
    genericPriceSource: 'Generics Pharmacy SRP (sample)',
    checkedOn: CHECKED_ON,
    category: 'Pain relief',
    verified: true,
    indication: 'Commonly used for short-term relief of mild to moderate pain.',
    safetyFlag: 'Take with food; not for long-term use without advice.',
  },
  {
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
    brandedPriceSource: 'Mercury Drug SRP (sample)',
    genericPriceSource: 'Generics Pharmacy SRP (sample)',
    checkedOn: CHECKED_ON,
    category: 'Cholesterol',
    verified: true,
    indication: 'A maintenance medicine often prescribed to help manage cholesterol.',
    safetyFlag: 'A maintenance medicine — dose changes are decided by your doctor.',
  },
  {
    id: 'glucophage-metformin-500',
    brand: 'Glucophage',
    generic: 'Metformin',
    aliases: ['glucophage 500', 'metformin', 'metformin hcl'],
    activeIngredient: 'Metformin hydrochloride',
    strength: '500 mg',
    dosageForm: 'Tablet',
    packQuantity: 100,
    packUnit: 'tablets',
    brandedPrice: 895.0,
    genericPrice: 248.0,
    brandedPriceSource: 'Mercury Drug SRP (sample)',
    genericPriceSource: 'Generics Pharmacy SRP (sample)',
    checkedOn: CHECKED_ON,
    category: 'Blood sugar',
    verified: true,
    indication: 'A maintenance medicine often prescribed to help manage blood sugar.',
    safetyFlag: 'A maintenance medicine — do not adjust the dose on your own.',
  },
];

/** Brand names shown as popular chips on the initial screen. */
export const POPULAR_BRANDS: readonly string[] = DRUG_COMPARISONS.map((d) => d.brand);
