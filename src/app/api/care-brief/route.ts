import { NextRequest, NextResponse } from 'next/server';

import { findCareJourney } from '@/lib/careJourneys';
import { relayPreference, resolveCareBriefResponse, templateCareBrief, templateCareRelay } from '@/lib/careBrief';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ChatCompletion = { choices?: Array<{ message?: { content?: string | null } }> };

export async function POST(request: NextRequest) {
  let journeyId: unknown;
  let preference = relayPreference(null);
  try {
    const body = await request.json();
    journeyId = body.journeyId;
    preference = relayPreference(body);
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const journey = findCareJourney(journeyId);
  if (!journey) return NextResponse.json({ error: 'Unknown care journey.' }, { status: 404 });

  const fallback = { ...templateCareBrief(journey), relay: templateCareRelay(journey, preference) };
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
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You write one short care-visit opening line. Use only the supplied scenario. Do not diagnose, interpret results, prescribe, discuss dosage, assess urgency, or recommend treatment. Return JSON with exactly one field: relayLine. relayLine is a single respectful opening sentence in the requested language for the selected audience; do not add medical claims or facts.' },
          { role: 'user', content: JSON.stringify({ journey: journey.title, description: journey.description, preparation: journey.preparation, questions: journey.questions, relayAudience: preference.audience, relayLanguage: preference.language === 'fil' ? 'Filipino' : 'English' }) },
        ],
      }),
    });
    if (!response.ok) return NextResponse.json(fallback);
    const payload = (await response.json()) as ChatCompletion;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) return NextResponse.json(fallback);
    let modelBrief: unknown;
    try { modelBrief = JSON.parse(content); } catch { return NextResponse.json(fallback); }
    return NextResponse.json(resolveCareBriefResponse(journey.id, preference, modelBrief) ?? fallback);
  } catch {
    return NextResponse.json(fallback);
  } finally {
    clearTimeout(timeout);
  }
}
