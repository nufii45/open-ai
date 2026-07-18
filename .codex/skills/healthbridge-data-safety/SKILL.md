---
name: healthbridge-data-safety
description: Guardrails for HealthBridge medicine lookup, pricing, results UI, OpenAI fallback, and medical copy. Use when creating or reviewing drug records, search matching, savings calculations, result cards, pharmacy listings, enrichment, prompts, or demo claims.
---

# HealthBridge Data Safety

Apply these rules before presenting a medicine comparison or changing related code or data.

## Verified comparison gate

Show a savings result only when the curated record verifies all of these:

- branded and generic product names;
- the same active ingredient, strength, dosage form, and pack quantity;
- positive PHP prices for both products;
- source and date checked for each price.

Calculate `savings = brandedPrice - genericPrice` and `savingsPercent = savings / brandedPrice`. Format currency with `Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' })`; do not round source prices before calculating.

Never imply a per-box comparison if the two packs do not match. Either normalize to an explicit unit with documented math or do not show the comparison.

## Search and LLM behavior

- Use the curated table as the source of truth for all displayed matches and prices.
- Reject or label an input as **Not yet verified locally** when no curated record matches.
- An LLM may suggest a candidate active ingredient internally, but must never create a public price, savings figure, substitution recommendation, dosage instruction, or verified status.
- Make the curated hero searches work without any network dependency.
- Keep API keys server-side; never expose them in browser code or client-visible environment variables.

## Required result-card language

- Describe a verified relationship as **same active ingredient**; do not claim products are chemically identical, therapeutically interchangeable, or suitable for every patient.
- Display strength, form, and pack size beside the comparison.
- Include: **“Compare the same strength, form, and pack size. Ask your pharmacist or prescriber before changing medicines.”**
- Clearly mark estimated or illustrative information. Do not label sample pharmacies as live stock or confirmed nearby availability.

## Enrichment and claims

- Keep enrichment secondary to the savings figure.
- Pre-cache and manually review every enrichment string used in the demo.
- Attribute openFDA data as US drug-label information; do not present it as Philippine product labeling or patient-specific advice.
- Use at most one plain-language indication and one short safety flag. Do not diagnose, recommend a treatment, or add unreviewed warnings.

## Pre-demo checklist

1. Run all hero searches in airplane/offline mode.
2. Verify every displayed record against its cited price source and check date.
3. Test no-match, malformed input, missing-price, and API-failure states.
4. Confirm each result has the required safety text and no unverified medical claim.
5. Rehearse using only the curated hero searches.
