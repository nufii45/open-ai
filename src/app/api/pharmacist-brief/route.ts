import { NextResponse } from 'next/server';

import { resolvePharmacistBrief } from '@/lib/pharmacistBrief';
import type { DrugComparison } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MODEL = 'gpt-5.6-terra';
const TIMEOUT_MS = 8_000;

async function generateBrief(comparison: DrugComparison, apiKey: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MODEL,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'pharmacist_brief',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['summary', 'pharmacistQuestion', 'checklist'],
              properties: {
                summary: { type: 'string' },
                pharmacistQuestion: { type: 'string' },
                checklist: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
              },
            },
          },
        },
        messages: [
          {
            role: 'system',
            content:
              'Write only a pharmacist-ready comparison brief from the supplied catalog facts. Do not diagnose, prescribe, recommend a dose, discuss contraindications, or say a person should switch medicine. Do not add facts not supplied. Keep the question focused on confirming ingredient, strength, dosage form, and pack.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              brand: comparison.brand,
              generic: comparison.generic,
              activeIngredient: comparison.activeIngredient,
              strength: comparison.strength,
              dosageForm: comparison.dosageForm,
              pack: `${comparison.packQuantity} ${comparison.packUnit}`,
            }),
          },
        ],
      }),
    });
    if (!response.ok) throw new Error('OpenAI brief request failed');
    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') throw new Error('OpenAI brief response was empty');
    return JSON.parse(content);
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(request: Request) {
  let comparisonId = '';
  try {
    const body = await request.json();
    comparisonId = typeof body?.comparisonId === 'string' ? body.comparisonId.trim() : '';
  } catch {
    // Invalid input returns a safe request error below.
  }

  if (!comparisonId)
    return NextResponse.json({ error: 'A comparison ID is required.' }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const result = await resolvePharmacistBrief(
    comparisonId,
    apiKey
      ? (comparison) => generateBrief(comparison, apiKey)
      : async () => {
          throw new Error('OpenAI is not configured');
        },
  );

  if (result.status === 'not_found') return NextResponse.json(result, { status: 404 });
  if (result.status === 'not_verified') {
    return NextResponse.json(
      { ...result, error: 'This comparison has no current verified price evidence.' },
      { status: 409 },
    );
  }
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
