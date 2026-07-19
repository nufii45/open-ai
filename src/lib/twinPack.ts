import type { PackScanResult } from './packScan';

function normalize(value: string | number | null | undefined) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}
function ingredient(pack: PackScanResult) {
  return pack.activeIngredient ?? pack.generic ?? '';
}

export function compareReviewedPacks(first: PackScanResult, second: PackScanResult) {
  const fields = [
    { label: 'ingredient', first: ingredient(first), second: ingredient(second) },
    { label: 'strength', first: first.strength ?? '', second: second.strength ?? '' },
    { label: 'form', first: first.dosageForm ?? '', second: second.dosageForm ?? '' },
    { label: 'pack quantity', first: first.packQuantity ?? '', second: second.packQuantity ?? '' },
  ];
  const differences = fields
    .filter(
      (field) =>
        !normalize(field.first) ||
        !normalize(field.second) ||
        normalize(field.first) !== normalize(field.second),
    )
    .map(
      (field) => `${field.label}: ${field.first || 'not read'} vs ${field.second || 'not read'}`,
    );
  return { matches: differences.length === 0, differences };
}
