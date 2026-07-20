export const MATCH_QUESTION =
  'Could you please confirm these are the same ingredient, strength, form, and pack before I compare the prices?';
export const MISMATCH_QUESTION = 'Can you help confirm why these packs differ?';
export const NOT_MEDICAL_ADVICE =
  'This is not medical advice. HealthBridge does not diagnose, prescribe, or tell you to change medicine.';

export type CounterProofInput = {
  brandedName: string;
  genericName: string;
  ingredient: string;
  strength: string;
  form: string;
  packQuantity: string;
  brandedPrice: number;
  genericPrice: number;
  checkedAt: string | null;
  packsPerMonth?: number;
};

export type CounterProofSection = { heading: string; lines: string[] };

export function formatPHP(value: number) {
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
}

export function formatCheckedAt(value: string | null) {
  return new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short' }).format(
    value ? new Date(value) : new Date(),
  );
}

/**
 * Single source of truth for the pharmacist-facing summary: clipboard, navigator.share,
 * the printed PDF, and the handoff dialog all render from this.
 */
export function buildCounterProof(input: CounterProofInput): {
  sections: CounterProofSection[];
  difference: number;
  monthlyDifference: number | null;
  text: string;
} {
  const difference = Math.round((input.brandedPrice - input.genericPrice) * 100) / 100;
  const packs = input.packsPerMonth ?? 0;
  const monthlyDifference =
    packs > 0 && difference > 0 ? Math.round(difference * packs * 100) / 100 : null;

  const priceLines = [
    `${input.brandedName}: ${formatPHP(input.brandedPrice)}`,
    `${input.genericName}: ${formatPHP(input.genericPrice)}`,
    `Difference for this exact pack: ${formatPHP(difference)}.`,
  ];
  if (monthlyDifference !== null) {
    priceLines.push(
      `Potential difference for ${packs} matching pack${packs === 1 ? '' : 's'} per month: ${formatPHP(monthlyDifference)}.`,
    );
  }

  const sections: CounterProofSection[] = [
    {
      heading: 'Packs compared',
      lines: [`Branded: ${input.brandedName}`, `Generic: ${input.genericName}`],
    },
    {
      heading: 'Matching fields',
      lines: [
        `Ingredient: ${input.ingredient}`,
        `Strength: ${input.strength}`,
        `Form: ${input.form}`,
        `Pack quantity: ${input.packQuantity}`,
      ],
    },
    { heading: 'Prices personally observed', lines: priceLines },
    { heading: 'Question for the pharmacist', lines: [MATCH_QUESTION] },
  ];

  const text = [
    'HEALTHBRIDGE COUNTER PROOF',
    `Observed: ${formatCheckedAt(input.checkedAt)}`,
    ...sections.flatMap((section) => ['', section.heading.toUpperCase(), ...section.lines]),
    '',
    NOT_MEDICAL_ADVICE,
  ].join('\n');

  return { sections, difference, monthlyDifference, text };
}

export function buildMismatchQuestion(differences: string[]) {
  return [MISMATCH_QUESTION, '', ...differences, '', NOT_MEDICAL_ADVICE].join('\n');
}
