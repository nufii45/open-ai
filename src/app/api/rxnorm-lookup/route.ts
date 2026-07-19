import { NextRequest, NextResponse } from 'next/server';

import type { RxNormReference } from '@/lib/medicineSources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_RESULTS = 3;
const TIMEOUT_MS = 4_500;

type RxNormCandidate = { rxcui?: unknown; name?: unknown; score?: unknown };

function cleanQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const query = value
    .replace(/[^a-zA-Z0-9 .-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return query.length >= 2 && query.length <= 80 ? query : null;
}

function candidateList(payload: unknown): RxNormCandidate[] {
  const group =
    payload && typeof payload === 'object'
      ? (payload as { approximateGroup?: unknown }).approximateGroup
      : null;
  return group &&
    typeof group === 'object' &&
    Array.isArray((group as { candidate?: unknown }).candidate)
    ? (group as { candidate: RxNormCandidate[] }).candidate
    : [];
}

async function getNormalizedName(rxcui: string, signal: AbortSignal): Promise<string | null> {
  const response = await fetch(
    `https://rxnav.nlm.nih.gov/REST/rxcui/${encodeURIComponent(rxcui)}/properties.json`,
    { signal },
  );
  if (!response.ok) return null;
  const payload = (await response.json()) as { properties?: { name?: unknown } };
  return typeof payload.properties?.name === 'string' && payload.properties.name.trim()
    ? payload.properties.name.trim()
    : null;
}

async function searchRxNorm(query: string): Promise<RxNormReference[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const endpoint = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(query)}&maxEntries=${MAX_RESULTS}&option=1`;
    const response = await fetch(endpoint, { signal: controller.signal });
    if (!response.ok) return [];

    const seen = new Set<string>();
    const candidates = candidateList(await response.json())
      .flatMap((candidate) => {
        const rxcui =
          typeof candidate.rxcui === 'string' && /^\d+$/.test(candidate.rxcui)
            ? candidate.rxcui
            : null;
        if (!rxcui || seen.has(rxcui)) return [];
        seen.add(rxcui);
        return [
          {
            rxcui,
            fallbackName: typeof candidate.name === 'string' ? candidate.name.trim() : null,
            score: typeof candidate.score === 'string' ? Number(candidate.score) : null,
          },
        ];
      })
      .slice(0, MAX_RESULTS);

    const names = await Promise.all(
      candidates.map(async (candidate) => ({
        ...candidate,
        name: await getNormalizedName(candidate.rxcui, controller.signal),
      })),
    );
    return names.flatMap((candidate) => {
      const name = candidate.name || candidate.fallbackName;
      if (!name) return [];
      return [
        {
          rxcui: candidate.rxcui,
          name,
          matchScore: Number.isFinite(candidate.score) ? candidate.score : null,
        },
      ];
    });
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

  return NextResponse.json({
    query,
    matches: await searchRxNorm(query),
    source: 'NLM RxNorm',
    notice:
      'Possible US terminology matches only. Confirm the ingredient, strength, dosage form, and pack on Philippine packaging with a pharmacist. These results never create a price comparison or medicine-switch recommendation.',
  });
}
