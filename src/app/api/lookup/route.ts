// Phase 3 — OpenAI fallback lookup. The client NEVER calls OpenAI directly; it
// hits this server route only AFTER client-side findDrug() misses (Phase 5).
//
// Guardrails:
// - Key read from process.env.OPENAI_API_KEY — server-side only.
// - OpenAI-sourced results are flagged `estimated: true` so the UI can badge them.
//   These prices are NOT authoritative; we never present them as checked.
// - Safe parse: any failure (missing key, network, bad JSON, wrong shape) returns
//   a clean error — the route never crashes and never fabricates a Drug.

import { NextResponse } from "next/server";
import { findDrug, type Drug } from "@/data/drugs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// A fast/mini model keeps the fallback cheap and quick.
const MODEL = "gpt-4o-mini";

interface LookupResult extends Drug {
  savings: number;
  estimated: boolean;
}

function withSavings(drug: Drug, estimated: boolean): LookupResult {
  return { ...drug, savings: drug.brandedPrice - drug.genericPrice, estimated };
}

// Validate the untrusted OpenAI JSON into a Drug. Returns null on any mismatch.
function parseDrug(raw: unknown, query: string): Drug | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);

  const brandedPrice = num(o.brandedPrice);
  const genericPrice = num(o.genericPrice);
  const generic = str(o.generic);
  const dosage = str(o.dosage);
  const category = str(o.category);
  if (brandedPrice === null || genericPrice === null || !generic || !dosage || !category) {
    return null;
  }
  // Estimated prices must still make sense: branded should not be cheaper than generic.
  if (brandedPrice < genericPrice) return null;

  return {
    brand: str(o.brand) ?? query.trim(),
    generic,
    brandedPrice,
    genericPrice,
    dosage,
    category,
    priceSource: "OpenAI estimate",
    // OpenAI estimates are never hand-checked prices — always unverified.
    priceVerified: false,
  };
}

async function estimateWithOpenAI(query: string, apiKey: string): Promise<Drug | null> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a Philippine medicine price reference. Given a drug name (brand or generic), " +
            "return a JSON object with keys: brand (string), generic (string, the active ingredient), " +
            "brandedPrice (number, typical PHP price per unit), genericPrice (number, typical PHP price " +
            "per unit), dosage (string, e.g. '500mg tablet'), category (string, e.g. 'Analgesic'). " +
            "Prices are rough estimates in Philippine pesos. If the input is not a real medicine, return " +
            '{"error":"not a medicine"}. Return only the JSON object.',
        },
        { role: "user", content: query.trim() },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content: unknown = data?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }
  return parseDrug(parsed, query);
}

async function lookup(query: string): Promise<NextResponse> {
  const q = (query ?? "").trim();
  if (!q) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  // Defensive local check — a seeded drug resolves here and skips OpenAI entirely.
  const local = findDrug(q);
  if (local) {
    return NextResponse.json(withSavings(local, false));
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // No key: degrade cleanly. The hero (seeded) path never needs this route.
    return NextResponse.json(
      { found: false, error: "Lookup unavailable" },
      { status: 404 },
    );
  }

  let estimated: Drug | null = null;
  try {
    estimated = await estimateWithOpenAI(q, apiKey);
  } catch {
    estimated = null; // network/parse failure — never crash the route
  }

  if (!estimated) {
    return NextResponse.json({ found: false }, { status: 404 });
  }
  return NextResponse.json(withSavings(estimated, true));
}

export async function GET(req: Request): Promise<NextResponse> {
  const q = new URL(req.url).searchParams.get("q") ?? "";
  return lookup(q);
}

export async function POST(req: Request): Promise<NextResponse> {
  let q = "";
  try {
    const body = await req.json();
    q = typeof body?.q === "string" ? body.q : "";
  } catch {
    q = "";
  }
  return lookup(q);
}
