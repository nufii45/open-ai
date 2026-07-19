import { NextRequest, NextResponse } from 'next/server';

import { findCareJourney } from '@/lib/careJourneys';
import { normaliseVisitNote, resolveVisitNote, templateVisitNote } from '@/lib/visitNote';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatCompletion = { choices?: Array<{ message?: { content?: string | null } }> };

export async function POST(request: NextRequest) {
  let journeyId: unknown;
  let note: string | null = null;
  try {
    const body = await request.json();
    journeyId = body.journeyId;
    note = normaliseVisitNote(body.note);
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const journey = findCareJourney(journeyId);
  if (!journey) return NextResponse.json({ error: 'Unknown care journey.' }, { status: 404 });
  if (!note) return NextResponse.json({ error: 'Write a short note (8–1,000 characters) first.' }, { status: 400 });

  const fallback = templateVisitNote(note, journey.id);
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json(fallback);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        temperature: 0,
        max_tokens: 260,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You prepare a non-clinical care-visit note. Use only the supplied user note; do not infer, add, or interpret medical facts. Do not diagnose, assess urgency, triage, prescribe, discuss dosage, recommend treatment, claim a medicine is safe, or give emergency instructions. Return JSON with exactly summary and questions. summary is one neutral sentence telling the person to share their own note. questions is exactly three short, practical questions for a clinician or pharmacist.',
          },
          {
            role: 'user',
            content: JSON.stringify({ visitType: journey.title, userNote: note }),
          },
        ],
      }),
    });
    if (!response.ok) return NextResponse.json(fallback);
    const payload = (await response.json()) as ChatCompletion;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);
    let modelValue: unknown;
    try { modelValue = JSON.parse(content); } catch { return NextResponse.json(fallback); }
    return NextResponse.json(resolveVisitNote(note, journey.id, modelValue) ?? fallback);
  } catch {
    return NextResponse.json(fallback);
  } finally {
    clearTimeout(timeout);
  }
}
