// openFDA drug-info route — the ONE sanctioned live dataset call. The browser
// NEVER hits api.fda.gov directly; it calls /api/drug-info?generic=... and this
// route queries openFDA server-side. Additive and subordinate: it enriches the
// card with one indication + one warning, never a price, and never blocks or
// breaks the card. Mirrors the /api/pharmacies live+cached fallback pattern.
//
// Guardrails:
// - Queried by generic ingredient only — no ICD-10, no other dataset. Key-free.
// - US-name mapping: openFDA is US-market (acetaminophen, not paracetamol).
// - ~2.5s timeout (AbortController) + MANDATORY cached fallback: on ANY failure
//   (non-200, empty results, missing sections, timeout, network off) it returns a
//   pre-written cached blurb tagged source:"cached". The panel never renders empty.

import { NextResponse } from "next/server";
import {
  PH_TO_US_NAME,
  cachedDrugInfo,
  type DrugInfo,
} from "@/data/drug-info";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TIMEOUT_MS = 2500;

interface DrugInfoResponse extends DrugInfo {
  generic: string;
  source: "live" | "cached";
}

function cached(generic: string): NextResponse {
  return NextResponse.json({
    generic,
    ...cachedDrugInfo(generic),
    source: "cached" as const,
  } satisfies DrugInfoResponse);
}

// openFDA label sections are long ALL-CAPS blocks with numbered headers. Strip the
// leading section header/number and return one clean sentence (~160 chars) so the
// panel can't blow up the card.
function trim(raw: unknown, max = 160): string {
  if (typeof raw !== "string") return "";
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/^\d+(?:\.\d+)*\s+/, ""); // "5 " / "5.1 " section number
  s = s.replace(/^[A-Z0-9][A-Z0-9 ,/&()-]{3,}?(?=[A-Z][a-z])/, ""); // ALL-CAPS header
  s = s.replace(/^(?:uses|warnings?|purpose|indications?(?: and usage)?)[:\s-]*/i, "");
  s = s.trim();
  if (!s) return "";
  const period = s.indexOf(". ");
  if (period > 30 && period <= max) return s.slice(0, period + 1);
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

// Pull the first present value from a list of openFDA label fields.
function firstField(label: Record<string, unknown>, fields: string[]): string {
  for (const f of fields) {
    const v = label[f];
    if (Array.isArray(v) && typeof v[0] === "string") {
      const cleaned = trim(v[0]);
      if (cleaned) return cleaned;
    }
  }
  return "";
}

async function liveDrugInfo(usName: string): Promise<DrugInfo | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const url =
      "https://api.fda.gov/drug/label.json?limit=1&search=" +
      encodeURIComponent(`openfda.generic_name:"${usName}"`);
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    const label = Array.isArray(data?.results) ? data.results[0] : null;
    if (!label || typeof label !== "object") return null;

    const l = label as Record<string, unknown>;
    const indication = firstField(l, ["indications_and_usage", "purpose"]);
    const warning = firstField(l, [
      "boxed_warning",
      "warnings",
      "warnings_and_cautions",
    ]);
    // Both sections missing → treat as a failure and fall back to cache.
    if (!indication || !warning) return null;
    return { indication, warning };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  const generic = (new URL(req.url).searchParams.get("generic") ?? "").trim();
  if (!generic) {
    return NextResponse.json({ error: "Missing generic" }, { status: 400 });
  }

  const usName = PH_TO_US_NAME[generic.toLowerCase()] ?? generic;

  try {
    const live = await liveDrugInfo(usName);
    if (!live) return cached(generic); // empty results / missing sections / non-200
    return NextResponse.json({
      generic,
      ...live,
      source: "live" as const,
    } satisfies DrugInfoResponse);
  } catch {
    return cached(generic); // timeout / network / parse — never empty, never crash
  }
}
