# HealthBridge UI/UX Plan

## Purpose

Build a polished, mobile-first medicine-price transparency demo while backend work proceeds. The frontend must make a **verified PHP savings amount** immediately clear for curated hero searches, without implying diagnosis, live stock, or automatic medicine substitution.

## Scope & Assumptions

- **Delivery:** production-quality, interactive single-page responsive web app for the hackathon demo.
- **Audience:** Filipino medicine buyers looking up a familiar branded medicine, often while deciding on a purchase.
- **Primary action:** search a brand, understand a verified like-for-like comparison, and take the safe next step of consulting a pharmacist or prescriber before changing medicines.
- **Frontend source of truth:** local, validated curated fixtures only. The backend can replace the repository later without changing the result-card contract.
- **Accessibility baseline:** WCAG AA, keyboard support, visible focus, reduced-motion support, and 360px-wide mobile usability.

## Visual Direction

**Color strategy: Restrained.** A true off-white surface keeps the app practical and calm; deep navy carries primary text, medical teal identifies interaction and verified status, and green is reserved for the savings outcome. Amber or red appear only for genuine safety or data-validity flags.

Scene: a person checks a medicine price on a budget Android phone in a bright pharmacy queue; the interface should feel calm, private, and financially relieving—not like a hospital portal or a discount promotion.

Use one familiar sans-serif family (Inter or system fallback), a compact product-UI type scale, 12–16px card corners, and either a subtle border or a tight shadow—never both as default decoration. Avoid dashboards, charts, maps, gradients, glass panels, oversized rounded cards, and uniform card grids.

## Information Architecture

1. **Header** — HealthBridge mark and name; one quiet trust statement: “Find lower-cost generic options.”
2. **Search hero** — direct headline, one labelled search field, clear submit control, popular medicine chips, and a price-comparison-only reminder.
3. **Verified result** — the core task surface. Present the comparison basis before the saving: brand, generic, same active ingredient, strength, form, and exact pack size.
4. **Savings comparison** — side-by-side brand and generic prices with the PHP savings as the largest, strongest numeric element. Show source and checked date beside, not below, the conclusion.
5. **Explain simply** — progressively disclose the reviewed indication and one safety flag so the price comparison stays primary.
6. **Illustrative pharmacy options** — optional supporting list only. Label as sample/illustrative; no stock, location, price, or proximity claim is presented as live.

## Mobile Layout Strategy

- Use a single-column flow from 360px upward. Keep the search action within thumb reach and allow chips to wrap naturally.
- The result card begins immediately after a successful search; no modal, tab, or scroll choreography is required to reach savings.
- On larger screens, retain one narrative column with a constrained reading width; a two-column price comparison may expand within the result card, but details should not become a dashboard.
- Keep product names flexible for long content (`min-width: 0`, wrapping/truncation where appropriate) and reserve enough room for PHP amounts using tabular numerals.

## Core Interaction Model

- The form accepts case-insensitive curated brand names and aliases. Popular chips populate and submit the same form.
- A local search may show a brief skeleton state, but the curated path responds immediately and remains useful offline.
- Expand/collapse “Explain simply” uses a semantic disclosure or an accessible button with state exposed to assistive technology.
- Search state may be reflected in the URL query so a verified demo result can be shared and rehearsed directly.
- The primary submit button remains enabled until a local lookup begins; validation errors are inline and focused when submitted.

## Motion Plan

Motion communicates a completed lookup, not spectacle:

- Search-to-result: fade and translate the result surface by a small amount over 180–220ms with an ease-out curve.
- Savings outcome: a brief opacity/scale settle only after the verified data is ready; never animate a numeric count-up that obscures the final PHP amount.
- Pharmacy samples and detail disclosures: a light, interruptible opacity/transform reveal; avoid height, width, top, left, margin, or padding animation.
- Use `will-change: transform` only for the elements actively transitioning; clean up GSAP contexts/tweens when the view changes.
- Under `prefers-reduced-motion`, use an immediate update or a short crossfade. No page-load sequence, scroll-pinning, or persistent animation.

## Required UI States

| State | User-visible outcome |
| --- | --- |
| Initial | Search prompt and popular curated chips; no empty result-card shell. |
| Searching | Lightweight skeleton with “Finding a verified local comparison…”; no invented medicine details. |
| Verified result | Exact comparison basis, numeric PHP prices, calculated savings, provenance, reviewed one-line details, and required safety note. |
| No match | “Not yet verified locally.” No generic candidate, price, savings, or estimated savings. Invite pharmacist guidance. |
| Invalid input | Inline prompt to enter a medicine brand; preserve the input value and focus the field. |
| Invalid curated record | Safe generic error state; suppress all prices and savings. |
| Unexpected error | Calm recovery copy, retry affordance, and no fallback medical or price claim. |

## Mock Data & Backend Boundary

Create a local `DrugComparison` fixture repository first. A record may render a verified savings result only when it supplies:

- brand and generic names;
- verified same active ingredient, strength, dosage form, and pack quantity;
- positive numeric PHP prices for both products;
- a source for each price and an ISO checked-on date;
- pre-reviewed optional indication and one safety flag.

The UI computes `savings = brandedPrice - genericPrice` and `savingsPercent = savings / brandedPrice` without rounding intermediate values. It formats final values with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`.

Keep samples separate from comparison data:

```ts
type SamplePharmacy = {
  name: string;
  displayDistance?: string;
  label: 'Illustrative option';
  note: string;
};
```

The future backend implements the same validated lookup interface. It must not alter frontend gates: an unverified response cannot produce public savings, pharmacy availability, a substitution recommendation, or dosage advice.

## Implementation Sequence

1. **Data and validation** — define local curated comparison fixtures, sample-pharmacy fixtures, validation, and pure price-calculation utilities.  
   **Verify:** hero records resolve offline; malformed or incomparable records cannot render savings.

2. **Search and state machine** — build deterministic case-insensitive lookup, chips, URL-backed query state, and every safe UI state.  
   **Verify:** empty, invalid, no-match, error, and verified paths preserve safe copy and expose no fabricated values.

3. **Result hierarchy** — implement the mobile result surface, exact comparison basis, savings panel, price provenance, and safety wording.  
   **Verify:** savings is the highest-contrast number while strength, form, and pack size remain visible beside it.

4. **Progressive details and samples** — add concise reviewed medicine information and clearly illustrative pharmacy options.  
   **Verify:** no copy implies current stock, final branch price, or automatic interchangeability.

5. **Motion and performance** — add the constrained GSAP transitions described above.  
   **Verify:** transforms and opacity only; reduced-motion path works; no animation delays access to the completed savings amount.

6. **Quality rehearsal** — run unit, type, lint, offline, keyboard, phone viewport, and browser-console checks.  
   **Verify:** the Biogesic hero flow is usable at 360px with third-party requests blocked.

## Acceptance Criteria

- A curated hero search works with the network disabled.
- A displayed savings result always has matching active ingredient, strength, dosage form, pack quantity, sources, and price-check date.
- The exact note appears on a comparison: “Compare the same strength, form, and pack size. Ask your pharmacist or prescriber before changing medicines.”
- Unknown searches show “Not yet verified locally” with no price, savings, or public generic assertion.
- Sample pharmacies are visibly labelled illustrative and never imply live availability.
- All controls are keyboard-accessible, focus-visible, touch-friendly, and readable at 360px.
- Motion is optional, performant, and respects reduced-motion preferences.

## Known Planning Constraint

The visual-direction probe generator was unavailable during planning (403 Forbidden). This plan therefore uses the PRD’s confirmed restrained navy/teal/green direction as the decision baseline; visual probes can be generated before implementation if the tool becomes available.
