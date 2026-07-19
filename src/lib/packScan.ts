export type PackScanResult = {
  brand: string | null;
  generic: string | null;
  activeIngredient: string | null;
  strength: string | null;
  dosageForm: string | null;
  packQuantity: number | null;
  confidence: 'high' | 'uncertain';
  notice: string;
};

const UNSAFE_LANGUAGE = /\b(diagnos\w*|prescrib\w*|dosage|dose|contraindicat\w*|safe to switch|start taking|stop taking|treatment|symptom)\b/i;

function safeText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text && text.length <= max && !UNSAFE_LANGUAGE.test(text) ? text : null;
}

export function parsePackScanResult(value: unknown): PackScanResult | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PackScanResult>;
  const confidence = item.confidence === 'high' || item.confidence === 'uncertain' ? item.confidence : null;
  const notice = safeText(item.notice, 240);
  const packQuantity = item.packQuantity === null || item.packQuantity === undefined
    ? null
    : typeof item.packQuantity === 'number' && Number.isInteger(item.packQuantity) && item.packQuantity > 0 && item.packQuantity <= 10_000
      ? item.packQuantity
      : null;
  if (!confidence || !notice) return null;
  return {
    brand: safeText(item.brand, 120),
    generic: safeText(item.generic, 120),
    activeIngredient: safeText(item.activeIngredient, 120),
    strength: safeText(item.strength, 60),
    dosageForm: safeText(item.dosageForm, 60),
    packQuantity,
    confidence,
    notice,
  };
}

export function isAcceptedImageDataUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(value);
  if (!match) return false;
  // Base64 is roughly 4/3 the source size. Keep the request comfortably below server limits.
  return match[2].length <= 4_000_000;
}
