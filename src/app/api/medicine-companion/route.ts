import { NextRequest, NextResponse } from 'next/server';

import { findComparisonById } from '@/lib/drugs';
import {
  calculateObservedImpact,
  evaluatePackMatch,
  validObservedInput,
  type ObservedImpact,
  type PackMatch,
} from '@/lib/medicineCompanion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ModelResponse = { choices?: Array<{ message?: { content?: string | null } }> };
type CompanionCopy = { explanation: string; pharmacistQuestion: string; source: 'ai' | 'template' };

const UNSAFE =
  /\b(diagnos\w*|prescrib\w*|dosage|dose|contraindicat\w*|safe to switch|start taking|stop taking|emergency treatment)\b/i;

function templateCopy(packMatch: PackMatch, impact: ObservedImpact | null): CompanionCopy {
  if (packMatch.status === 'mismatch')
    return {
      explanation:
        'Do not compare the prices as a saving yet. Confirm the differing pack details with a pharmacist first.',
      pharmacistQuestion: `Could you help me confirm ${packMatch.differences.join(', ')} before I compare these prices?`,
      source: 'template',
    };
  if (!impact)
    return {
      explanation:
        'Enter both observed prices to calculate the difference for this confirmed pack.',
      pharmacistQuestion:
        'Could you help me confirm these are the same ingredient, strength, form, and pack?',
      source: 'template',
    };
  if (impact.status === 'no_saving')
    return {
      explanation: 'For the prices you entered, the generic is not lower for this confirmed pack.',
      pharmacistQuestion:
        'Could you help me confirm whether there is another matching pack or option to compare?',
      source: 'template',
    };
  return {
    explanation: `For the prices you entered, the difference is ₱${impact.savings.toFixed(2)} for this confirmed pack. Prices can vary by pharmacy and date.`,
    pharmacistQuestion:
      'Could you help me confirm these prices use the same ingredient, strength, form, and pack?',
    source: 'template',
  };
}

function parseCopy(value: unknown): Omit<CompanionCopy, 'source'> | null {
  if (!value || typeof value !== 'object') return null;
  const item = value as Partial<Omit<CompanionCopy, 'source'>>;
  if (typeof item.explanation !== 'string' || typeof item.pharmacistQuestion !== 'string')
    return null;
  const explanation = item.explanation.trim();
  const pharmacistQuestion = item.pharmacistQuestion.trim();
  if (
    explanation.length < 10 ||
    explanation.length > 300 ||
    pharmacistQuestion.length < 10 ||
    pharmacistQuestion.length > 300 ||
    UNSAFE.test(`${explanation} ${pharmacistQuestion}`)
  )
    return null;
  return { explanation, pharmacistQuestion };
}

export async function POST(request: NextRequest) {
  let comparisonId: unknown;
  let observed: unknown;
  try {
    const body = await request.json();
    comparisonId = body.comparisonId;
    observed = body.observed;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (typeof comparisonId !== 'string' || !validObservedInput(observed))
    return NextResponse.json(
      { error: 'Complete the observed pack and price fields.' },
      { status: 400 },
    );
  const comparison = findComparisonById(comparisonId);
  if (!comparison)
    return NextResponse.json({ error: 'Unknown medicine comparison.' }, { status: 404 });
  const packMatch = evaluatePackMatch(comparison, observed);
  const impact = calculateObservedImpact(observed, packMatch);
  const fallback = templateCopy(packMatch, impact);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || packMatch.status === 'mismatch')
    return NextResponse.json({ packMatch, impact, copy: fallback });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You explain a user-entered medicine price comparison. Use only supplied facts. Do not diagnose, prescribe, discuss dosage, claim a medicine switch is safe, or invent prices. Return JSON with exactly explanation and pharmacistQuestion. Keep each under 40 words.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              packMatch,
              impact,
              note: 'The prices are user-observed and may vary by pharmacy and date.',
            }),
          },
        ],
      }),
    });
    if (!response.ok) return NextResponse.json({ packMatch, impact, copy: fallback });
    const content = ((await response.json()) as ModelResponse).choices?.[0]?.message?.content;
    if (!content) return NextResponse.json({ packMatch, impact, copy: fallback });
    let modelCopy: unknown;
    try {
      modelCopy = JSON.parse(content);
    } catch {
      return NextResponse.json({ packMatch, impact, copy: fallback });
    }
    const parsed = parseCopy(modelCopy);
    return NextResponse.json({
      packMatch,
      impact,
      copy: parsed ? { ...parsed, source: 'ai' } : fallback,
    });
  } catch {
    return NextResponse.json({ packMatch, impact, copy: fallback });
  } finally {
    clearTimeout(timeout);
  }
}
