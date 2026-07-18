# HealthBridge Agent Guide

## Project intent

HealthBridge helps a person compare a branded medicine with a verified, like-for-like generic alternative and see the estimated PHP savings. It is a **medicine-price transparency** prototype, not a diagnostic, prescribing, stock-checking, or substitution service.

The demo’s remembered moment is: a user searches a familiar brand and immediately sees a clear, verified savings figure.

## Sprint priorities

Build in this order. Do not start a lower-priority item while a higher one is incomplete.

1. Deterministic curated lookup for the hero medicines.
2. Correct price-comparison and savings calculations.
3. Mobile-first search and result-card UI.
4. Safe copy, clear provenance, and failure states.
5. Fake-pharmacy display and rehearsal flow.
6. Optional cached enrichment only after the core is reliable.

Explicitly out of scope: accounts, database, real-time prices, real pharmacy inventory or maps, prescription upload/OCR, QR/PDF/voice, history, disease-code ingestion, and broad medical decision support.

## Required operating principles

### Think before coding

- State material assumptions in the task response or implementation notes.
- Surface ambiguity that changes medical safety, price correctness, public claims, or scope. Ask rather than silently choosing a risky interpretation.
- When options differ materially, name the trade-off and recommend the simplest safe option.
- Do not turn a vague request into speculative features.

### Simplicity first

- Use local JSON and pure functions for the curated demo path.
- Prefer a single focused screen and a small component tree.
- Do not add a database, auth, state-management library, abstraction layer, API integration, or configurability unless the task requires it.
- Do not call an external service when a local cached result can serve the demo.
- Avoid utility wrappers and generic component APIs used only once.

### Surgical changes

- Change only files and code required by the request.
- Preserve existing conventions and unrelated user changes.
- Do not refactor, reformat, rename, or remove adjacent code merely because it could be improved.
- Remove imports, variables, and code made unused by the current change; leave pre-existing dead code alone unless asked.
- Every changed line must trace to a task requirement, a correctness fix, or a test that proves it.

### Goal-driven execution

- Define observable acceptance criteria before non-trivial implementation.
- For a bug, reproduce it with a test or deterministic manual scenario before fixing it where practical.
- Verify the affected behavior after each meaningful change.
- Report the checks run and any unverified risk at handoff.

For a multi-step task, use this compact format:

1. Change: `<what>` → verify: `<specific check>`
2. Change: `<what>` → verify: `<specific check>`

## Health and data-safety rules

These rules are mandatory for user-visible content and data.

### Matching and prices

- The curated local table is the only source of truth for displayed generic matches, prices, and savings.
- A displayed comparison must match the brand and generic on active ingredient, strength, dosage form, and pack quantity.
- Store and display a source and `checkedOn` date for both prices.
- Use PHP values as numbers, not formatted strings.
- Compute without rounding intermediate values:
  - `savings = brandedPrice - genericPrice`
  - `savingsPercent = savings / brandedPrice`
- Format displayed prices with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.
- Do not claim a per-box saving when packs differ. Normalize explicitly with documented unit math or do not show a comparison.
- Reject a record with missing, zero, negative, stale, or incomparable price data.

### Search and OpenAI behavior

- Curated hero searches must succeed with no network connection.
- For a no-match or unverified query, show **“Not yet verified locally”** and no savings number.
- An LLM may propose an internal candidate active ingredient, but it must never create a public price, savings figure, dosage instruction, substitute recommendation, or verified status.
- Never expose an OpenAI key in browser code, client-visible environment variables, source maps, logs, or screenshots. Use a server route if a call is retained.
- The app must remain useful if OpenAI fails, times out, or is unavailable.

### Medical language

- Say **“same active ingredient”** only when the local record verifies it.
- Do not claim that products are chemically identical, clinically interchangeable, appropriate for a particular person, or safe to switch without professional input.
- Do not diagnose, prescribe, recommend a dose, or interpret a person’s symptoms.
- Include this exact user-visible note on a comparison: **“Compare the same strength, form, and pack size. Ask your pharmacist or prescriber before changing medicines.”**
- Keep strength, form, and pack quantity visible beside the price comparison.

### Pharmacies and enrichment

- Mark pharmacy results as **sample** or **illustrative** unless live availability and location have been independently verified.
- Never imply stock, current price, or proximity for hardcoded pharmacies.
- Treat openFDA content as US label information, not Philippine-specific labeling or medical advice.
- Pre-cache and manually review every enrichment string used on stage.
- Keep enrichment to one plain-language use line and one short safety flag. The savings figure stays the visual headline.

## Data contract

Use this shape for a verified curated comparison. Extend only when a concrete requirement needs it.

```ts
type DrugComparison = {
  id: string;
  brand: string;
  generic: string;
  activeIngredient: string;
  strength: string;
  dosageForm: string;
  packQuantity: number;
  packUnit: string;
  brandedPrice: number;
  genericPrice: number;
  brandedPriceSource: string;
  genericPriceSource: string;
  checkedOn: string; // ISO date
  category: string;
  verified: true;
  indication?: string; // pre-reviewed only
  safetyFlag?: string; // pre-reviewed only
};
```

Do not overload `estimated` data into `DrugComparison`. Model it separately and never calculate or show savings from it.

## UI requirements

- Design for a phone viewport first; desktop is a responsive enhancement.
- Make the savings amount the highest-contrast, largest numeric element.
- Show the comparison basis before or alongside savings: brand/generic names, strength, form, and pack size.
- Support: initial, searching, verified result, unverified/no-match, invalid input, and unexpected-error states.
- Make all controls keyboard accessible with visible focus states and sufficient contrast.
- Use clear, calm language. Do not use urgency, fear, or medical certainty to drive conversion.
- Avoid animation that delays access to the savings amount or makes the result difficult to read.

## Architecture and code conventions

- Prefer Next.js App Router with TypeScript strict mode if Next.js is selected.
- Keep curated data under a clearly named local data directory and validate it at load time or in tests.
- Keep savings calculations in a small pure function with unit tests.
- Keep UI components presentational where possible; place matching and pricing logic outside render functions.
- Use a minimal server route only for protected OpenAI access. Do not add a database for demo-only data.
- Prefer explicit names such as `verifiedComparison`, `notVerifiedLocally`, and `priceCheckedOn` over vague names such as `data`, `result`, or `value`.
- Handle malformed local data gracefully. Never invent a fallback medical claim or price.

## Testing and verification

The minimum confidence suite covers:

1. Each hero brand resolves to its expected curated record.
2. Savings amount and percentage are correct for every curated record.
3. Incomparable products cannot produce a savings result.
4. Unknown input shows the unverified state with no invented generic or price.
5. Missing or invalid price data is rejected safely.
6. The result card contains product details, price provenance, check date, and safety note.
7. The app works for hero searches with network requests blocked.
8. The UI is usable at a phone-size viewport and has no blocking console errors.

Run the narrowest relevant checks first, then the project’s lint, typecheck, and test commands before handoff when available. Use browser automation for the hero-path rehearsal once the UI is stable.

## Demo readiness checklist

- Verify the three hero records against their cited real-world price sources on the day of the demo.
- Test the full flow in offline mode or with third-party requests blocked.
- Test no-match, empty input, invalid data, and OpenAI-failure states.
- Confirm no demo copy suggests a diagnosis or direct substitution.
- Confirm all sample pharmacies are plainly labeled.
- Rehearse the 30-second pitch using a curated hero search, not an LLM fallback.
- Keep a static screenshot or local fallback path available if deployment fails.

## Team workflow

- Keep the data contract stable; discuss schema changes before another person integrates against it.
- Make small, isolated commits with an intent-revealing message.
- Before handing off, state: changed files, behavior verified, commands run, and known risks.
- Do not overwrite or discard another builder’s changes without explicit approval.
- Favor completing the deterministic demo over expanding the drug table or adding enrichment.

## Definition of done

A feature is done only when it is within scope, has the required safety/provenance behavior, passes its relevant checks, and does not depend on an unreliable live service for the hero demo.
