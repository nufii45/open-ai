import { describe, expect, it } from 'vitest';

import { isAcceptedImageDataUrl, parsePackScanResult } from './packScan';

describe('pack scan response', () => {
  it('keeps only a constrained package transcription', () => {
    expect(
      parsePackScanResult({
        brand: 'Biogesic',
        generic: 'Paracetamol',
        activeIngredient: 'Paracetamol',
        strength: '500 mg',
        dosageForm: 'Tablet',
        packQuantity: 10,
        confidence: 'high',
        notice: 'Read from the front of the package. Please review each field.',
      }),
    ).toMatchObject({
      brand: 'Biogesic',
      strength: '500 mg',
      packQuantity: 10,
      confidence: 'high',
    });
  });

  it('removes medical guidance from model output', () => {
    expect(
      parsePackScanResult({
        brand: 'Biogesic',
        generic: null,
        activeIngredient: null,
        strength: null,
        dosageForm: null,
        packQuantity: null,
        confidence: 'uncertain',
        notice: 'You should start taking this treatment.',
      }),
    ).toBeNull();
  });

  it('accepts only bounded image data urls', () => {
    expect(isAcceptedImageDataUrl('data:image/jpeg;base64,QUJDRA==')).toBe(true);
    expect(isAcceptedImageDataUrl('https://example.com/box.jpg')).toBe(false);
  });
});
