# HealthBridge — Care Visit Companion

HealthBridge helps people prepare for a pharmacy, clinic, laboratory, or hospital-discharge visit. Choose a visit type, generate a concise question and checklist, save it locally, and optionally find nearby care locations.

It is deliberately **not** a diagnosis, prescription, symptom checker, emergency service, clinical interpreter, or price-comparison engine.

## Product flow

1. Choose a care visit: pharmacy, clinic, laboratory, or discharge.
2. For a pharmacy visit, use the local Medicine Counter Check and enter the prices you personally observe for a matching pack.
3. HealthBridge deterministically verifies the observed pack and calculates any price difference; GPT-5.6 explains only the supplied result and creates a pharmacist question.
4. If a local medicine is unavailable, optionally search two public reference sources: NLM RxNorm for normalized-name candidates and openFDA for a **possible US-label identity**. Only after both return no candidate may the user opt into one GPT-5.6 web search restricted to official Philippine FDA, openFDA, and NLM domains. None of these paths create a Philippine price, equivalent, or switching recommendation. For Philippine registration details, open the official Philippine FDA Verification Portal and confirm the physical package with a pharmacist.
5. Optionally type or dictate a temporary visit note. Dictation is browser-provided and remains editable; with explicit consent, GPT-5.6 turns only the user's own words into practical questions to bring to a professional.
6. Select whether the card is for you or someone you are helping, then choose English or Filipino.
7. Generate a short Care Relay: a shareable opening line plus a canonical preparation card.
8. Copy, share, or save the card locally on the device.
9. Optionally share browser location to find nearby relevant places and estimated directions.

The app does not store symptoms, diagnoses, allergies, prescription history, laboratory results, audio, or the temporary visit note. A visitor may voluntarily send a short free-text note to the AI only after an explicit consent checkbox; it is used for that response and never included in the saved local plan. Do not enter names, addresses, or identification numbers.

Observed prices are used for a one-time comparison only. They are not stored, published as a price catalog, or presented as a market-wide quote.

## AI boundary

`POST /api/care-brief` accepts only a fixed journey ID plus an audience (`self` or `caregiver`) and language (`English` or `Filipino`). The server rehydrates the trusted visit scenario and asks OpenAI for one Care Relay opening line. The canonical checklist remains controlled by HealthBridge.

`POST /api/visit-note` accepts one consented, temporary note and returns a constrained set of practical questions. It must not diagnose, assess urgency, prescribe, discuss dosage, recommend treatment, or introduce medical facts. Prompt and output validation reject clinical or treatment language; a deterministic template is returned on any failure.

`GET /api/medicine-identity` queries openFDA label data for possible brand/generic identity matches. The result is explicitly US-label reference data and must be confirmed against Philippine packaging by a pharmacist. It does not generate prices, a generic substitution claim, or medical advice. openFDA itself warns that its records should not be used to make medical-care decisions.

`GET /api/rxnorm-lookup` uses NLM RxNorm approximate matching plus a normalized RxCUI name lookup to improve unknown-name and typo handling. RxNorm is a US terminology source; results are candidate names for manual confirmation, not Philippine availability, price, or switching evidence.

`POST /api/ai-medicine-search` is an explicit, last-resort GPT-5.6 Terra Responses API web-search action. It is domain-restricted to Philippine FDA, openFDA, and NLM sources; it returns only possible identity candidates and the actual source URLs surfaced by the search tool. It never returns prices, availability, diagnosis, dosage, treatment, or a medicine-switch recommendation. If there is no API key, timeout, unsafe output, or no official source, it returns a no-match state.

If `OPENAI_API_KEY` is unavailable, times out, or returns unsafe output, HealthBridge uses the same deterministic template card. The visit flow remains usable.

Required server environment variable for AI enhancement:

```env
OPENAI_API_KEY=your_server_only_key
```

Optional server environment variable for nearby maps and route estimates:

```env
GEOAPIFY_API_KEY=your_server_only_key
```

Never expose either value with a `NEXT_PUBLIC_` prefix.

## Maps and privacy

Location is requested only after the visitor presses the nearby-search button. Geoapify queries OpenStreetMap-derived categories for the selected journey: pharmacy, clinic, laboratory, or hospital. Location is not persisted. Map results and route estimates do not imply service availability, cost, operating hours, staff qualifications, or care suitability.

## Run locally

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

## Safety boundary

HealthBridge helps a person organize a conversation with their care team. For medical decisions, urgent concerns, prescriptions, or interpretation of results, contact a qualified healthcare professional or the appropriate emergency service.
