export type PriceEvidence = {
  price: number | null;
  currency: 'PHP' | null;
  productText: string | null;
  confidence: 'high' | 'uncertain';
  notice: string;
};

const UNSAFE_LANGUAGE =
  /\b(diagnos\w*|prescrib\w*|dosage|dose|contraindicat\w*|safe to switch|start taking|stop taking|treatment|symptom)\b/i;

function safeText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text && text.length <= max && !UNSAFE_LANGUAGE.test(text) ? text : null;
}

export function parsePriceEvidence(value: unknown): PriceEvidence | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<PriceEvidence>;
  const confidence =
    item.confidence === 'high' || item.confidence === 'uncertain' ? item.confidence : null;
  const hasValidCurrency =
    item.currency === 'PHP' || item.currency === null || item.currency === undefined;
  const currency = hasValidCurrency ? (item.currency ?? null) : null;
  const notice = safeText(item.notice, 220);
  const productText =
    item.productText === null || item.productText === undefined
      ? null
      : safeText(item.productText, 120);
  const price =
    item.price === null || item.price === undefined
      ? null
      : typeof item.price === 'number' &&
          Number.isFinite(item.price) &&
          item.price > 0 &&
          item.price <= 100_000
        ? Math.round(item.price * 100) / 100
        : null;
  if (
    !confidence ||
    !notice ||
    !hasValidCurrency ||
    (item.price !== null && item.price !== undefined && (price === null || currency !== 'PHP')) ||
    (item.productText !== null && item.productText !== undefined && productText === null)
  )
    return null;
  return { price, currency, productText, confidence, notice };
}
