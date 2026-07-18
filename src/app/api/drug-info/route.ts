import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPEN_FDA_LABEL_URL = "https://api.fda.gov/drug/label.json";
const REQUEST_TIMEOUT_MS = 4_000;
const MAX_TEXT_LENGTH = 360;

type OpenFdaLabel = {
  indication_and_usage?: unknown;
  purpose?: unknown;
  boxed_warning?: unknown;
  warnings?: unknown;
  warnings_and_cautions?: unknown;
};

function firstLabelText(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const first = value.find(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
  if (!first) return null;

  const text = first.replace(/\s+/g, " ").trim();
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH).trimEnd()}…` : text;
}

function toSafeInfo(label: OpenFdaLabel) {
  const indication = firstLabelText(label.indication_and_usage) ?? firstLabelText(label.purpose);
  const warning =
    firstLabelText(label.boxed_warning) ??
    firstLabelText(label.warnings) ??
    firstLabelText(label.warnings_and_cautions);

  return { indication, warning };
}

export async function GET(request: Request) {
  const generic = new URL(request.url).searchParams.get("generic")?.trim() ?? "";
  if (!generic || generic.length > 100) {
    return NextResponse.json({ error: "A valid generic medicine name is required." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      search: `openfda.generic_name:"${generic.replaceAll('"', "")}"`,
      limit: "1",
    });
    const response = await fetch(`${OPEN_FDA_LABEL_URL}?${params}`, {
      signal: controller.signal,
      next: { revalidate: 86_400 },
    });

    if (response.status === 404) {
      return NextResponse.json({ available: false });
    }
    if (!response.ok) {
      return NextResponse.json({ available: false });
    }

    const payload: unknown = await response.json();
    const result = (payload as { results?: unknown })?.results;
    const label = Array.isArray(result) ? (result[0] as OpenFdaLabel | undefined) : undefined;
    if (!label || typeof label !== "object") {
      return NextResponse.json({ available: false });
    }

    const info = toSafeInfo(label);
    if (!info.indication && !info.warning) {
      return NextResponse.json({ available: false });
    }

    return NextResponse.json({ available: true, ...info });
  } catch {
    // openFDA is optional enrichment: failure must not affect the price lookup.
    return NextResponse.json({ available: false });
  } finally {
    clearTimeout(timeout);
  }
}
