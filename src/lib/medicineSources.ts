export const PHILIPPINE_FDA_DRUG_SEARCH_URL = 'https://verification.fda.gov.ph/drug_productslist.php';
export const OFFICIAL_MEDICINE_SEARCH_DOMAINS = ['verification.fda.gov.ph', 'open.fda.gov', 'lhncbc.nlm.nih.gov'] as const;

export const MEDICINE_REFERENCE_SOURCES = {
  local: {
    label: 'HealthBridge local pack reference',
    purpose: 'Controlled pack fields and user-observed comparison math.',
  },
  philippineFda: {
    label: 'Philippine FDA Verification Portal',
    purpose: 'Philippine product registration, brand, generic, strength, and form confirmation.',
    url: PHILIPPINE_FDA_DRUG_SEARCH_URL,
  },
  rxnorm: {
    label: 'RxNorm',
    purpose: 'US medicine-name normalization and typo candidate matching.',
  },
  openFda: {
    label: 'openFDA drug labels',
    purpose: 'US product-label identity and label context.',
  },
} as const;

export type RxNormReference = {
  rxcui: string;
  name: string;
  matchScore: number | null;
};
