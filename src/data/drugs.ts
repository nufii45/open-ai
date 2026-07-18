// HealthBridge local drug table — the primary lookup source and the only
// guaranteed demo path. OpenAI/Places are additive fallbacks, never depended on.
//
// PRICES: every number below is a `// PLACEHOLDER` so the app runs today.
// The team overwrites each with a real branded + generic price hand-checked on
// Watsons PH / Mercury Drug / DOH DPRI, then flips `priceSource` to that source
// AND sets `priceVerified: true` on that row.
// Do NOT present placeholder numbers as authoritative. Every row ships
// `priceVerified: false` until a human curates its real price — the card gates
// the hero savings number on this flag, so a placeholder can never be shown as a
// real saving. Flipping the flag without a checked price is forbidden.
//
// Single-ingredient products only. Combination products stay off the demo path.

export interface Drug {
  brand: string;
  generic: string;
  brandedPrice: number;
  genericPrice: number;
  dosage: string;
  category: string;
  priceSource: string;
  // TRUE only when a human has hand-checked the real branded + generic price on
  // Watsons PH / Mercury Drug / DOH DPRI and set `priceSource` accordingly.
  // While `false`, the price is a placeholder and the card MUST NOT present the
  // savings number as authoritative. Flipping this without a real price =
  // fabricating health-price data = forbidden. Demo drugs must be TRUE (curated)
  // before the demo.
  priceVerified: boolean;
}

// While prices are placeholders, every row states this source. When a row is
// hand-checked, replace it with e.g. 'Watsons PH', 'Mercury Drug', 'DOH DPRI'.
const PLACEHOLDER = "placeholder";

export const drugs: Drug[] = [
  // --- Demo drugs: the 3 biggest savings gaps. The spread sells the app. ---
  // Atorvastatin: ~₱44 branded vs ~₱6 generic per tablet — the headline saving.
  { brand: "Lipitor", generic: "atorvastatin", brandedPrice: 44.0 /* PLACEHOLDER */, genericPrice: 6.0 /* PLACEHOLDER */, dosage: "20mg tablet", category: "Cardiovascular", priceSource: PLACEHOLDER, priceVerified: false },
  // Amlodipine: a daily maintenance drug, so the per-tablet gap compounds.
  { brand: "Norvasc", generic: "amlodipine", brandedPrice: 40.0 /* PLACEHOLDER */, genericPrice: 4.5 /* PLACEHOLDER */, dosage: "5mg tablet", category: "Cardiovascular", priceSource: PLACEHOLDER, priceVerified: false },
  // Salbutamol inhaler: high branded price, wide generic gap.
  { brand: "Ventolin", generic: "salbutamol", brandedPrice: 385.0 /* PLACEHOLDER */, genericPrice: 120.0 /* PLACEHOLDER */, dosage: "100mcg inhaler", category: "Respiratory", priceSource: PLACEHOLDER, priceVerified: false },

  // --- Remaining seeded rows ---
  { brand: "Biogesic", generic: "paracetamol", brandedPrice: 4.5 /* PLACEHOLDER */, genericPrice: 1.5 /* PLACEHOLDER */, dosage: "500mg tablet", category: "Analgesic", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Advil", generic: "ibuprofen", brandedPrice: 12.0 /* PLACEHOLDER */, genericPrice: 3.0 /* PLACEHOLDER */, dosage: "200mg tablet", category: "NSAID", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Ponstan", generic: "mefenamic acid", brandedPrice: 22.0 /* PLACEHOLDER */, genericPrice: 5.0 /* PLACEHOLDER */, dosage: "500mg capsule", category: "NSAID", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Alnix", generic: "cetirizine", brandedPrice: 18.0 /* PLACEHOLDER */, genericPrice: 4.0 /* PLACEHOLDER */, dosage: "10mg tablet", category: "Antihistamine", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Neobloc", generic: "metoprolol", brandedPrice: 15.0 /* PLACEHOLDER */, genericPrice: 5.0 /* PLACEHOLDER */, dosage: "50mg tablet", category: "Cardiovascular", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Glucophage", generic: "metformin", brandedPrice: 12.0 /* PLACEHOLDER */, genericPrice: 3.5 /* PLACEHOLDER */, dosage: "500mg tablet", category: "Antidiabetic", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Losec", generic: "omeprazole", brandedPrice: 48.0 /* PLACEHOLDER */, genericPrice: 8.0 /* PLACEHOLDER */, dosage: "20mg capsule", category: "Gastrointestinal", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Amoxil", generic: "amoxicillin", brandedPrice: 25.0 /* PLACEHOLDER */, genericPrice: 6.5 /* PLACEHOLDER */, dosage: "500mg capsule", category: "Antibiotic", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Voltaren", generic: "diclofenac", brandedPrice: 28.0 /* PLACEHOLDER */, genericPrice: 6.0 /* PLACEHOLDER */, dosage: "50mg tablet", category: "NSAID", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Zithromax", generic: "azithromycin", brandedPrice: 95.0 /* PLACEHOLDER */, genericPrice: 30.0 /* PLACEHOLDER */, dosage: "500mg tablet", category: "Antibiotic", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Diamicron", generic: "gliclazide", brandedPrice: 20.0 /* PLACEHOLDER */, genericPrice: 7.0 /* PLACEHOLDER */, dosage: "60mg tablet", category: "Antidiabetic", priceSource: PLACEHOLDER, priceVerified: false },
  { brand: "Claritin", generic: "loratadine", brandedPrice: 26.0 /* PLACEHOLDER */, genericPrice: 5.0 /* PLACEHOLDER */, dosage: "10mg tablet", category: "Antihistamine", priceSource: PLACEHOLDER, priceVerified: false },
];

/**
 * Look up a drug by brand OR generic name. Case- and whitespace-insensitive.
 * Returns the matching record, or null if nothing matches.
 */
export function findDrug(query: string): Drug | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  return (
    drugs.find(
      (d) => d.brand.toLowerCase() === q || d.generic.toLowerCase() === q,
    ) ?? null
  );
}
