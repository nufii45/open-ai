import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 3_500;
const MAX_RESULTS = 3;

type IdentityMatch = {
  brand: string | null;
  generic: string | null;
  dosageForm: string | null;
  manufacturer: string | null;
};

function cleanQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const query = value
    .replace(/[^a-zA-Z0-9 .-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return query.length >= 2 && query.length <= 80 ? query : null;
}

function firstString(value: unknown): string | null {
  return Array.isArray(value) && typeof value[0] === 'string' && value[0].trim()
    ? value[0].trim()
    : null;
}

function readMatches(payload: unknown): IdentityMatch[] {
  const results =
    payload &&
    typeof payload === 'object' &&
    Array.isArray((payload as { results?: unknown }).results)
      ? (payload as { results: unknown[] }).results
      : [];
  const seen = new Set<string>();
  return results
    .flatMap((item) => {
      const openfda =
        item &&
        typeof item === 'object' &&
        (item as { openfda?: unknown }).openfda &&
        typeof (item as { openfda?: unknown }).openfda === 'object'
          ? (item as { openfda: Record<string, unknown> }).openfda
          : null;
      if (!openfda) return [];
      const match: IdentityMatch = {
        brand: firstString(openfda.brand_name),
        generic: firstString(openfda.generic_name),
        dosageForm: firstString(openfda.dosage_form),
        manufacturer: firstString(openfda.manufacturer_name),
      };
      if (!match.brand && !match.generic) return [];
      const key =
        `${match.brand ?? ''}|${match.generic ?? ''}|${match.dosageForm ?? ''}`.toLowerCase();
      if (seen.has(key)) return [];
      seen.add(key);
      return [match];
    })
    .slice(0, MAX_RESULTS);
}

async function searchOpenFda(query: string): Promise<IdentityMatch[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // Search the two harmonized identity fields separately. Some label records
    // have only one field populated, so an OR expression can unexpectedly omit
    // a useful match.
    for (const field of ['openfda.brand_name', 'openfda.generic_name']) {
      const expression = `${field}:\"${query}\"`;
      const endpoint = `https://api.fda.gov/drug/label.json?limit=${MAX_RESULTS}&search=${encodeURIComponent(expression)}`;
      const response = await fetch(endpoint, { signal: controller.signal });
      if (!response.ok) continue;
      const matches = readMatches(await response.json());
      if (matches.length) return matches;
    }
    return [];
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

export async function GET(request: NextRequest) {
  const query = cleanQuery(new URL(request.url).searchParams.get('query'));
  if (!query)
    return NextResponse.json(
      { error: 'Enter a medicine name between 2 and 80 characters.' },
      { status: 400 },
    );
  const matches = await searchOpenFda(query);
  return NextResponse.json({
    query,
    matches,
    source: 'openFDA label data',
    notice:
      'Possible US-label identities only. Confirm the ingredient, strength, form, and pack on Philippine packaging with a pharmacist. HealthBridge does not use these results for prices or switching advice.',
  });
}
