// Core data contract for HealthBridge. See AGENTS.md "Data contract".
// The curated table is the ONLY source of truth for displayed prices and savings.

/**
 * A verified, like-for-like branded↔generic comparison drawn from the curated
 * table. A record may only render a savings result when it verifies the brand
 * and generic on active ingredient, strength, dosage form, and pack quantity,
 * and carries positive PHP prices with a source and check date for each.
 */
export type EvidenceStatus = 'pending' | 'verified';

/** A human-collected PHP price observation for one matching medicine pack. */
export type PriceEvidence = {
  status: EvidenceStatus;
  sourceName: string;
  /** Public source URL or a team-held receipt/screenshot reference. */
  reference: string;
  observedOn: string | null;
  packDescription: string;
  /** Active ingredient, strength, form, and pack captured at the source. */
  matchSignature: string;
};

export type DrugComparison = {
  id: string;
  brand: string;
  generic: string;
  /** Case-insensitive alternate spellings/aliases that resolve to this record. */
  aliases: string[];
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  packQuantity: number;
  packUnit: string;
  brandedPrice: number;
  genericPrice: number;
  brandedPriceSource: string;
  genericPriceSource: string;
  checkedOn: string | null; // ISO date; newest common evidence check
  brandedEvidence: PriceEvidence;
  genericEvidence: PriceEvidence;
  category: string;
  /** Only true after a human has checked both matching packs. */
  verified: boolean;
  indication?: string; // pre-reviewed only
  safetyFlag?: string; // pre-reviewed only
};

/**
 * A hardcoded sample pharmacy. Real drugstore branches near Ateneo are listed
 * for orientation only. Per AGENTS.md we must NOT imply live stock, current
 * price, or confirmed proximity — every entry is labelled illustrative.
 */
export type SamplePharmacy = {
  id: string;
  name: string;
  branch: string;
  /** Google Maps search URL — opens directions without geolocation. */
  directionsUrl: string;
  label: 'Illustrative option' | 'Nearby map result';
  note: string;
};

/**
 * The provenance of a rendered comparison.
 * - 'curated'   → exact match in the local table (fully verified, no badge).
 * - 'openai'    → an unknown/misspelled brand was bridged to a curated record
 *                 via OpenAI's active-ingredient guess. Prices are STILL from
 *                 the curated table; the "Estimated" badge marks the *match*.
 */
export type MatchSource = 'curated' | 'openai';

/** The computed, display-ready savings for a verified comparison. */
export type SavingsResult = {
  savings: number;
  savingsPercent: number;
  brandedPrice: number;
  genericPrice: number;
};

/** A successful lookup: a verified comparison plus how we matched it. */
export type VerifiedLookup = {
  status: 'verified';
  source: MatchSource;
  comparison: DrugComparison;
  savings: SavingsResult;
};

/** No curated record backs this query — never carries a price or savings. */
export type NotVerifiedLookup = {
  status: 'not_verified';
  query: string;
  reason: 'draft_evidence' | 'unknown';
};

export type LookupOutcome = VerifiedLookup | NotVerifiedLookup;
