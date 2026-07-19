import { NextRequest, NextResponse } from 'next/server';

import { isAcceptedImageDataUrl } from '@/lib/packScan';
import { parsePriceEvidence } from '@/lib/priceEvidence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 15_000;
type OpenAiResponse = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }>;
};

function outputText(payload: OpenAiResponse): string | null {
  if (typeof payload.output_text === 'string' && payload.output_text.trim())
    return payload.output_text;
  for (const item of payload.output ?? [])
    for (const content of item.content ?? [])
      if (content.type === 'output_text' && typeof content.text === 'string' && content.text.trim())
        return content.text;
  return null;
}

export async function POST(request: NextRequest) {
  let imageDataUrl: unknown;
  try {
    imageDataUrl = (await request.json()).imageDataUrl;
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  if (!isAcceptedImageDataUrl(imageDataUrl))
    return NextResponse.json(
      { error: 'Upload a JPG, PNG, or WebP price-label image under 3 MB.' },
      { status: 400 },
    );
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    return NextResponse.json(
      { error: 'Price label scan is unavailable because the server AI key is not configured.' },
      { status: 503 },
    );

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        max_output_tokens: 180,
        input: [
          {
            role: 'developer',
            content: [
              {
                type: 'input_text',
                text: 'You transcribe only a visibly printed Philippine peso price label or receipt. Do not diagnose, prescribe, recommend a dose, assess symptoms, say a medicine is safe to switch, infer an unreadable value, or compare products. Return JSON only with exactly: {"price":number|null,"currency":"PHP"|null,"productText":string|null,"confidence":"high"|"uncertain","notice":string}. Set price and currency to null if a PHP price is not clearly visible. productText may contain only the visible product text. The notice must ask the user to review the price and exact pack before using it.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Read only the visible price label or receipt. This is transcription for user review, not medical or price advice.',
              },
              { type: 'input_image', image_url: imageDataUrl, detail: 'high' },
            ],
          },
        ],
      }),
    });
    if (!response.ok)
      return NextResponse.json(
        { error: 'Price label scan could not read this image. Enter the price manually instead.' },
        { status: 502 },
      );
    const text = outputText((await response.json()) as OpenAiResponse);
    if (!text)
      return NextResponse.json(
        { error: 'Price label scan returned no usable details. Enter the price manually instead.' },
        { status: 422 },
      );
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json(
        {
          error: 'Price label scan returned an unusable result. Enter the price manually instead.',
        },
        { status: 422 },
      );
    }
    const result = parsePriceEvidence(parsed);
    if (!result)
      return NextResponse.json(
        {
          error:
            'Price label scan could not safely validate the result. Enter the price manually instead.',
        },
        { status: 422 },
      );
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json(
      { error: 'Price label scan is unavailable right now. Enter the price manually instead.' },
      { status: 502 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
