import { NextRequest, NextResponse } from 'next/server';

import { parseAiMedicineCandidates } from '@/lib/aiMedicineSearch';
import { OFFICIAL_MEDICINE_SEARCH_DOMAINS } from '@/lib/medicineSources';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 12_000;

type ResponseOutputItem = {
  type?: unknown;
  content?: Array<{ type?: unknown; text?: unknown }>;
  action?: { sources?: Array<{ url?: unknown }> };
};
type OpenAiResponse = { output_text?: unknown; output?: ResponseOutputItem[] };

function cleanQuery(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const query = value.replace(/[^a-zA-Z0-9 .-]/g, '').replace(/\s+/g, ' ').trim();
  return query.length >= 2 && query.length <= 80 ? query : null;
}

function outputText(payload: OpenAiResponse): string | null {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string' && content.text.trim()) return content.text;
    }
  }
  return null;
}

function officialSources(payload: OpenAiResponse): string[] {
  const allowed = new Set<string>(OFFICIAL_MEDICINE_SEARCH_DOMAINS);
  const sources = (payload.output ?? []).flatMap((item) => item.type === 'web_search_call' ? item.action?.sources ?? [] : []);
  return [...new Set(sources.flatMap((source) => {
    if (typeof source.url !== 'string') return [];
    try {
      const url = new URL(source.url);
      return allowed.has(url.hostname) ? [url.toString()] : [];
    } catch { return []; }
  }))].slice(0, 5);
}

function fallback(message: string) {
  return NextResponse.json({
    matches: [],
    sourceUrls: [],
    source: 'unavailable' as const,
    notice: message,
  });
}

export async function POST(request: NextRequest) {
  let query: string | null = null;
  try { query = cleanQuery((await request.json()).query); } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!query) return NextResponse.json({ error: 'Enter a medicine name between 2 and 80 characters.' }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return fallback('AI reference search is unavailable. Try the official Philippine FDA portal or ask a pharmacist to confirm the package.');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        max_output_tokens: 300,
        tools: [{ type: 'web_search', filters: { allowed_domains: OFFICIAL_MEDICINE_SEARCH_DOMAINS }, search_context_size: 'low' }],
        input: `Find official-reference identity candidates for the medicine name: ${query}. Search only the provided official sources. Return JSON only in this exact shape: {"matches":[{"name":"product or ingredient name","possibleGeneric":"ingredient or null","reason":"brief identity-only reason"}]}. Return an empty matches array unless the web-search sources support the candidate. Never provide prices, dosage, diagnosis, treatment, safety claims, availability claims, or a switching recommendation.`,
      }),
    });
    if (!response.ok) return fallback('AI reference search could not complete. Try the official Philippine FDA portal or ask a pharmacist to confirm the package.');
    const payload = await response.json() as OpenAiResponse;
    const text = outputText(payload);
    if (!text) return fallback('AI reference search returned no usable result.');
    let modelValue: unknown;
    try { modelValue = JSON.parse(text); } catch { return fallback('AI reference search returned an unusable result.'); }
    const matches = parseAiMedicineCandidates(modelValue);
    const sourceUrls = officialSources(payload);
    if (!matches || !sourceUrls.length) return fallback('No official-source match was found. This does not prove the product is unavailable.');
    return NextResponse.json({
      matches,
      sourceUrls,
      source: 'gpt-5.6-terra-web-search' as const,
      notice: 'GPT-5.6 searched official reference sites for possible identities. Confirm the physical Philippine package with a pharmacist before making any purchase or medicine decision.',
    });
  } catch {
    return fallback('AI reference search is unavailable right now. Try the official Philippine FDA portal or ask a pharmacist to confirm the package.');
  } finally {
    clearTimeout(timeout);
  }
}
