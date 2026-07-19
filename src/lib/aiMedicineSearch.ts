export type AiMedicineCandidate = {
  name: string;
  possibleGeneric: string | null;
  reason: string;
};

const UNSAFE_LANGUAGE =
  /\b(diagnos\w*|prescrib\w*|dosage|dose|contraindicat\w*|safe to switch|start taking|stop taking|treatment)\b/i;

function safeText(value: unknown, min: number, max: number): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length >= min &&
    value.trim().length <= max &&
    !UNSAFE_LANGUAGE.test(value)
  );
}

export function parseAiMedicineCandidates(value: unknown): AiMedicineCandidate[] | null {
  if (
    !value ||
    typeof value !== 'object' ||
    !Array.isArray((value as { matches?: unknown }).matches)
  )
    return null;
  const candidates = (value as { matches: unknown[] }).matches.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Partial<AiMedicineCandidate>;
    if (!safeText(candidate.name, 2, 140) || !safeText(candidate.reason, 4, 240)) return [];
    if (
      candidate.possibleGeneric !== null &&
      candidate.possibleGeneric !== undefined &&
      !safeText(candidate.possibleGeneric, 2, 140)
    )
      return [];
    return [
      {
        name: candidate.name.trim(),
        possibleGeneric:
          typeof candidate.possibleGeneric === 'string' ? candidate.possibleGeneric.trim() : null,
        reason: candidate.reason.trim(),
      },
    ];
  });
  return candidates.slice(0, 3);
}
