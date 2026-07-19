import type { DrugComparison } from './types';

export type ObservedMedicineInput = {
  strength: string;
  dosageForm: string;
  packQuantity: number;
  brandedPrice: number;
  genericPrice: number;
  confirmedSamePack: boolean;
};

export type PackMatch = {
  status: 'match' | 'mismatch';
  differences: string[];
};

export type ObservedImpact = {
  savings: number;
  percent: number;
  status: 'saves' | 'no_saving';
};

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function evaluatePackMatch(comparison: DrugComparison, observed: ObservedMedicineInput): PackMatch {
  const differences: string[] = [];
  if (normalize(observed.strength) !== normalize(comparison.strength)) differences.push(`strength should be ${comparison.strength}`);
  if (normalize(observed.dosageForm) !== normalize(comparison.dosageForm)) differences.push(`form should be ${comparison.dosageForm}`);
  if (observed.packQuantity !== comparison.packQuantity) differences.push(`pack should contain ${comparison.packQuantity} ${comparison.packUnit}`);
  if (!observed.confirmedSamePack) differences.push('confirm that both observed prices use the same pack');
  return { status: differences.length ? 'mismatch' : 'match', differences };
}

export function calculateObservedImpact(observed: ObservedMedicineInput, packMatch: PackMatch): ObservedImpact | null {
  if (packMatch.status !== 'match' || !Number.isFinite(observed.brandedPrice) || !Number.isFinite(observed.genericPrice) || observed.brandedPrice <= 0 || observed.genericPrice <= 0) return null;
  const savings = Math.round((observed.brandedPrice - observed.genericPrice) * 100) / 100;
  return { savings, percent: Math.round((Math.abs(savings) / observed.brandedPrice) * 100), status: savings > 0 ? 'saves' : 'no_saving' };
}

export function validObservedInput(value: unknown): value is ObservedMedicineInput {
  if (!value || typeof value !== 'object') return false;
  const input = value as Partial<ObservedMedicineInput>;
  const packQuantity = input.packQuantity;
  return typeof input.strength === 'string' && input.strength.length <= 60 && typeof input.dosageForm === 'string' && input.dosageForm.length <= 60 && typeof packQuantity === 'number' && Number.isInteger(packQuantity) && packQuantity > 0 && packQuantity <= 10_000 && typeof input.brandedPrice === 'number' && Number.isFinite(input.brandedPrice) && input.brandedPrice > 0 && input.brandedPrice <= 1_000_000 && typeof input.genericPrice === 'number' && Number.isFinite(input.genericPrice) && input.genericPrice > 0 && input.genericPrice <= 1_000_000 && typeof input.confirmedSamePack === 'boolean';
}
