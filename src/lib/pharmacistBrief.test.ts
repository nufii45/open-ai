import { describe, expect, it } from 'vitest';

import { DRUG_COMPARISONS } from './drugs';
import {
  createTemplateBrief,
  parsePharmacistBrief,
  resolvePharmacistBrief,
  resolveVerifiedPharmacistBrief,
} from './pharmacistBrief';
import type { DrugComparison } from './types';

const candidate = DRUG_COMPARISONS[0];
const today = new Date().toISOString().slice(0, 10);
const signature =
  `${candidate.activeIngredient}|${candidate.strength}|${candidate.dosageForm}|${candidate.packQuantity} ${candidate.packUnit}`.toLowerCase();

const verified = (): DrugComparison => ({
  ...candidate,
  verified: true,
  checkedOn: today,
  brandedPriceSource: 'Test pharmacy',
  genericPriceSource: 'Test pharmacy',
  brandedEvidence: {
    status: 'verified',
    sourceName: 'Test pharmacy',
    reference: 'HB-001',
    observedOn: today,
    packDescription: '10 tablets',
    matchSignature: signature,
  },
  genericEvidence: {
    status: 'verified',
    sourceName: 'Test pharmacy',
    reference: 'HB-002',
    observedOn: today,
    packDescription: '10 tablets',
    matchSignature: signature,
  },
});

describe('pharmacist brief safety', () => {
  it('builds a deterministic, non-prescriptive template', () => {
    const brief = createTemplateBrief(verified());
    expect(brief.safetyReminder).toContain('does not tell you to change medicine');
    expect(brief.checklist).toHaveLength(3);
  });

  it('rejects unsafe or malformed model output', () => {
    expect(
      parsePharmacistBrief({
        summary: 'Diagnosis: flu',
        pharmacistQuestion: 'Should I switch?',
        checklist: ['a', 'b', 'c'],
      }),
    ).toBeNull();
    expect(
      parsePharmacistBrief({
        summary: 'Good',
        pharmacistQuestion: 'Confirm the pack?',
        checklist: ['a', 'b'],
      }),
    ).toBeNull();
  });

  it('refuses unknown and unverified comparison IDs before calling a model', async () => {
    const generator = async () => ({
      summary: 'Good',
      pharmacistQuestion: 'Confirm the match?',
      checklist: ['Ingredient', 'Strength', 'Pack'],
    });
    await expect(resolvePharmacistBrief('not-real', generator)).resolves.toEqual({
      status: 'not_found',
    });
    await expect(resolvePharmacistBrief(candidate.id, generator)).resolves.toEqual({
      status: 'not_verified',
    });
  });

  it('falls back safely when the model times out or returns invalid content', async () => {
    await expect(
      resolveVerifiedPharmacistBrief(verified(), async () => {
        throw new Error('timeout');
      }),
    ).resolves.toMatchObject({ status: 'ready', source: 'template' });
    await expect(
      resolveVerifiedPharmacistBrief(verified(), async () => ({
        summary: 'Take two doses',
        pharmacistQuestion: 'Should I switch?',
        checklist: ['a', 'b', 'c'],
      })),
    ).resolves.toMatchObject({ status: 'ready', source: 'template' });
  });
});
