// Cached openFDA-style drug-info blurbs — the MANDATORY fallback for the live
// /api/drug-info route. These are general, well-known one-liners about what a drug
// is for and one safety note. They are DRUG INFO, never prices, and are keyed by
// the PH generic name exactly as it appears in `drugs.ts`.
//
// The panel must never render empty, so on ANY live failure (timeout, non-200,
// empty results, missing sections, network off) the route returns one of these and
// tags `source:"cached"`. A live openFDA hit returns `source:"live"` instead.

export interface DrugInfo {
  indication: string; // "Used for: ..."
  warning: string; // one safety line
}

// openFDA is a US-market dataset: it knows the US generic name, not the PH one.
// Map PH generics to their US equivalents before querying. Anything not listed is
// queried as-is. (Verified against api.fda.gov: `salbutamol` and `paracetamol`
// return nothing; their US names `albuterol` / `acetaminophen` return live labels.)
export const PH_TO_US_NAME: Record<string, string> = {
  paracetamol: 'acetaminophen',
  salbutamol: 'albuterol',
};

// Pre-written cached blurbs for the demo drugs (keyed by PH generic in drugs.ts).
export const drugInfoCache: Record<string, DrugInfo> = {
  atorvastatin: {
    indication: 'Lowers LDL (“bad”) cholesterol to reduce the risk of heart attack and stroke.',
    warning:
      'May rarely cause muscle pain or weakness — report any unexplained muscle symptoms to a doctor.',
  },
  amlodipine: {
    indication: 'Treats high blood pressure and certain types of chest pain (angina).',
    warning: 'Can cause dizziness or ankle swelling; stand up slowly when you first start it.',
  },
  salbutamol: {
    indication:
      'Relieves and prevents wheezing and shortness of breath in asthma and other airway conditions.',
    warning: 'Needing it more often than usual can signal worsening asthma — seek medical help.',
  },
  paracetamol: {
    indication: 'Temporarily relieves minor aches, pains, and fever.',
    warning:
      'Exceeding the recommended dose can cause severe liver damage; don’t combine paracetamol products.',
  },
};

// Last-resort blurb when a generic has no cached entry and the live call fails.
export const DEFAULT_DRUG_INFO: DrugInfo = {
  indication: 'General usage information isn’t available offline for this medicine.',
  warning: 'Always follow the dose on the label and check with a pharmacist or doctor.',
};

// Resolve the cached blurb for a PH generic, falling back to the default.
export function cachedDrugInfo(generic: string): DrugInfo {
  const key = generic.trim().toLowerCase();
  return drugInfoCache[key] ?? DEFAULT_DRUG_INFO;
}
