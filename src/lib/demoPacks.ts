import type { PackScanResult } from './packScan';

export type DemoScenario = 'match' | 'mismatch';

export type DemoSeed = {
  first: PackScanResult;
  second: PackScanResult;
  firstRole: 'branded' | 'generic';
  branded: string;
  generic: string;
};

const NOTICE = 'Local demo data. No image was sent and no network request was made.';

// ponytail: hand-written fixtures, not generated. Two scenarios is the whole demo.
export const DEMO_SEEDS: Record<DemoScenario, DemoSeed> = {
  match: {
    first: {
      brand: 'Biogesic',
      generic: 'Paracetamol',
      activeIngredient: 'Paracetamol',
      strength: '500 mg',
      dosageForm: 'Tablet',
      packQuantity: 10,
      confidence: 'high',
      notice: NOTICE,
    },
    second: {
      brand: 'RiteMed Paracetamol',
      generic: 'Paracetamol',
      activeIngredient: 'Paracetamol',
      strength: '500 mg',
      dosageForm: 'Tablet',
      packQuantity: 10,
      confidence: 'high',
      notice: NOTICE,
    },
    firstRole: 'branded',
    branded: '65.00',
    generic: '24.00',
  },
  mismatch: {
    first: {
      brand: 'Biogesic',
      generic: 'Paracetamol',
      activeIngredient: 'Paracetamol',
      strength: '500 mg',
      dosageForm: 'Tablet',
      packQuantity: 10,
      confidence: 'high',
      notice: NOTICE,
    },
    // Near-identical name, different strength: the exact trap a price comparison must block.
    second: {
      brand: 'Biogesic Forte',
      generic: 'Paracetamol',
      activeIngredient: 'Paracetamol',
      strength: '650 mg',
      dosageForm: 'Tablet',
      packQuantity: 10,
      confidence: 'high',
      notice: NOTICE,
    },
    firstRole: 'branded',
    branded: '65.00',
    generic: '24.00',
  },
};
