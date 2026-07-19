import { NextRequest, NextResponse } from 'next/server';

import { isAcceptedImageDataUrl, parsePackScanResult } from '@/lib/packScan';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TIMEOUT_MS = 15_000;

type OpenAiResponse = {
  output_text?: unknown;
  output?: Array<{ content?: Array<{ type?: unknown; text?: unknown }> }>;
};

function outputText(payload: OpenAiResponse): string | null {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) return payload.output_text;
  for (const item of payload.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string' && content.text.trim()) return content.text;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  let imageDataUrl: unknown;
  try { imageDataUrl = (await request.json()).imageDataUrl; } catch { return NextResponse.json({ error: 'Invalid request.' }, { status: 400 }); }
  if (!isAcceptedImageDataUrl(imageDataUrl)) return NextResponse.json({ error: 'Upload a JPG, PNG, or WebP medicine-box image under 3 MB.' }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'Pack Scan is unavailable because the server AI key is not configured.' }, { status: 503 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'gpt-5.6-terra',
        max_output_tokens: 320,
        input: [{
          role: 'developer',
          content: [{ type: 'input_text', text: 'You transcribe only visibly printed medicine package details. Do not diagnose, prescribe, recommend a dose, assess symptoms, discuss contraindications, say a medicine is safe to switch, or infer unreadable values. Return JSON only with this exact shape: {"brand":string|null,"generic":string|null,"activeIngredient":string|null,"strength":string|null,"dosageForm":string|null,"packQuantity":number|null,"confidence":"high"|"uncertain","notice":string}. Use null when a field is absent or uncertain. The notice must simply ask the user to review the printed package with a pharmacist.' }],
        }, {
          role: 'user',
          content: [
            { type: 'input_text', text: 'Read only the printed medicine box or blister-pack details in this image. This is an extraction task, not medical advice.' },
            { type: 'input_image', image_url: imageDataUrl, detail: 'high' },
          ],
        }],
      }),
    });
    if (!response.ok) return NextResponse.json({ error: 'Pack Scan could not read this image. You can enter the label details manually.' }, { status: 502 });
    const text = outputText(await response.json() as OpenAiResponse);
    if (!text) return NextResponse.json({ error: 'Pack Scan returned no usable details. You can enter the label details manually.' }, { status: 422 });
    let parsedValue: unknown;
    try { parsedValue = JSON.parse(text); } catch { return NextResponse.json({ error: 'Pack Scan returned an unusable result. Please enter the pack details manually.' }, { status: 422 }); }
    const result = parsePackScanResult(parsedValue);
    if (!result) return NextResponse.json({ error: 'Pack Scan could not safely validate the result. Please enter the pack details manually.' }, { status: 422 });
    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: 'Pack Scan is unavailable right now. You can enter the label details manually.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
