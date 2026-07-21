# HealthBridge · Care, clarified

> A privacy-first care preparation companion for Filipino families.

HealthBridge helps people prepare for pharmacy, clinic, laboratory, and hospital-discharge conversations. It makes the next step clearer without diagnosing, prescribing, interpreting results, or deciding what medicine someone should take.

## Why HealthBridge

Buying medicine for family can be stressful: packages can look similar, prices can vary, and it is easy to arrive at a counter or appointment without the right questions. HealthBridge was built to turn that uncertainty into a clear, reviewable handoff for a pharmacist or care team.

It is deliberately **not** a diagnosis, prescription, symptom checker, emergency service, clinical interpreter, price catalog, or medicine-switch recommendation engine.

## The product at a glance

```text
                         ┌──────────────────────────┐
                         │       HealthBridge       │
                         │   Choose a care journey  │
                         └────────────┬─────────────┘
                                      │
       ┌──────────────────────────────┼──────────────────────────────┐
       │                              │                              │
┌──────▼──────┐                ┌──────▼──────┐                ┌──────▼──────┐
│  Pharmacy   │                │ Care Relay  │                │ Nearby care │
│ Counter     │                │ Clinic · Lab│                │ Navigation  │
│ Check       │                │ · Discharge │                │ guidance    │
└──────┬──────┘                └──────┬──────┘                └──────┬──────┘
       │                              │                              │
       ▼                              ▼                              ▼
Review matching packs          Prepare questions and            Confirm details
and observed prices            a shareable handoff              directly with care
       │                              │                              │
       └──────────────► Pharmacist or qualified professional ◄──────┘
```

## Start here: the 30-second local demo

The primary demo requires no API key, camera permission, network connection, or typing.

1. Open HealthBridge and select **Try the demo**.
2. The app loads two seeded medicine packs with visible, reviewed fields.
3. Review the four required matching fields: **ingredient**, **strength**, **form**, and **pack quantity**.
4. Enter or review the observed PHP prices.
5. Read the **Counter Proof** and select **Show this to a pharmacist**.
6. Use **Reset demo** to start again.

The mismatch demo is equally important: it intentionally loads packs with a differing field and blocks the price comparison.

---

## Flow 1 · Pharmacy Counter Check

### Purpose

Help a person compare only two reviewed, like-for-like physical packs using prices they personally see at the counter.

### The verification flow

```text
Upload or use local demo packs
            ↓
Read visible package text (AI optional; manual entry always available)
            ↓
Review ingredient + strength + form + pack quantity
            ↓
Do all four values match?
   ├─ No  → Block comparison → Ask pharmacist why the packs differ
   └─ Yes → Review observed PHP prices → Show Counter Proof
                                             ↓
                                  Ask a pharmacist before deciding
```

### Evidence ledger

| Evidence                                      | Who provides it            | What HealthBridge does                     |
| --------------------------------------------- | -------------------------- | ------------------------------------------ |
| Ingredient, strength, form, and pack quantity | Package text / user review | Compares the four values deterministically |
| Observed PHP prices                           | User                       | Calculates the visible difference only     |
| Final decision                                | Pharmacist and user        | Remains outside the app                    |

The price difference is calculated from user-observed prices only:

\[
\Delta P = P_{\text{first pack}} - P_{\text{second pack}}
\]

HealthBridge does not publish market prices, claim stock availability, or recommend a medicine switch.

### Mismatch behaviour

If any required field differs, HealthBridge:

- highlights the difference;
- blocks the price comparison;
- explains that a similar brand name is not enough; and
- gives a safe pharmacist question: **“Can you help confirm why these packs differ?”**

---

## Flow 2 · Care Relay

Care Relay turns a visit into a short, editable conversation card. It is available for clinic appointments, laboratory visits, and hospital discharge.

### Shared Care Relay flow

1. Choose whether the relay is for yourself or someone you are helping.
2. Choose English or Filipino.
3. Add only practical, non-sensitive details for that journey.
4. Review the opening line, questions to ask, and items to bring or confirm.
5. Edit or remove any question.
6. Copy, share, print, or save the card locally.

The final card makes the boundary visible:

> **HealthBridge did:** organize controlled, practical prompts. <br />
> **You must confirm:** instructions, preparation, follow-up, and every care decision with the care team.

### Clinic appointment

| Step               | What the visitor does                                      | What the card provides                                   |
| ------------------ | ---------------------------------------------------------- | -------------------------------------------------------- |
| Practical handoff  | Selects new or follow-up visit and a broad reason category | Focused clinic context without sensitive medical details |
| Private visit note | Types or dictates a temporary note                         | Editable questions to ask the clinician                  |
| Prepare card       | Reviews questions and checklist                            | Opening line, questions, and bring/confirm list          |
| Find a place       | Views nearby clinics                                       | Navigation guidance only                                 |

### Laboratory visit

| Step               | What the visitor does                                                        | What the card provides                             |
| ------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------- |
| Practical handoff  | Confirms whether the test request is ready and chooses a result-release plan | Preparation and logistics prompts                  |
| Private visit note | Types or dictates a temporary note                                           | Questions about preparation, timing, and follow-up |
| Prepare card       | Reviews questions and checklist                                              | Request, preparation, and handoff reminders        |
| Find a place       | Views nearby laboratories                                                    | Navigation guidance only                           |

HealthBridge **does not interpret laboratory results**.

### Hospital discharge

| Step               | What the visitor does                                             | What the card provides                             |
| ------------------ | ----------------------------------------------------------------- | -------------------------------------------------- |
| Practical handoff  | Records caregiver support, paperwork holder, and follow-up status | A leaving checklist and questions to ask           |
| Private visit note | Types or dictates a temporary note                                | Questions about paperwork, contacts, and follow-up |
| Prepare card       | Reviews questions and checklist                                   | Shareable caregiver handoff                        |
| Find a place       | Views nearby hospitals                                            | Navigation guidance only                           |

HealthBridge **does not rewrite discharge instructions, assess urgency, or change treatment**. The hospital care team must confirm all medical details before a person leaves.

---

## Optional AI and Web Speech flows

### Package and price-label scan

`POST /api/pack-scan` and `POST /api/price-label-scan` use GPT-5.6 Terra vision only to transcribe visible package or price-label text.

- Every extracted value is editable.
- A price must be explicitly identified as PHP.
- No image is persisted by HealthBridge.
- Unreadable, unsafe, or non-PHP output is rejected.
- Manual entry remains available beside every scan action.

### Private Visit Note and browser dictation

Visitors can type or dictate a temporary note. Dictation is provided by the browser’s Web Speech API and the transcript remains editable.

Before a temporary note is sent to AI, the visitor must explicitly consent. GPT-5.6 may organize the visitor’s own words into practical questions, but it must not diagnose, assess urgency, prescribe, discuss dosage, recommend treatment, or introduce medical facts. A controlled template is used when AI is unavailable or its output is unsafe.

### Official-reference search

If a medicine is not found locally, HealthBridge can query NLM RxNorm and openFDA for possible identity candidates. Only after both have no candidate can the visitor opt into a restricted GPT-5.6 Responses API web search of official Philippine FDA, openFDA, and NLM sources.

These are **reference candidates only**. They never create a Philippine price, stock claim, generic substitution claim, diagnosis, dosage instruction, or switching recommendation.

---

## Built with Codex and GPT-5.6

HealthBridge was built for the OpenAI hackathon with two distinct AI roles.

### Codex · engineering partner

Codex helped us plan, implement, and test the product:

- Responsive Next.js interface and mobile-first interaction states.
- One-click, local demo journey for a reliable judge experience.
- Care Relay workflows for clinic, laboratory, and discharge visits.
- Privacy controls, consent copy, and manual fallback paths.
- Deterministic medicine-pack matching and Counter Proof logic.
- Automated unit tests, evaluation fixtures, type checks, linting, and production-build verification.

### GPT-5.6 · constrained in-product assistant

With explicit consent where appropriate, GPT-5.6 can:

- transcribe visible package and price-label text;
- organize a temporary user-authored note into practical questions;
- adapt a Care Relay opening line for audience and language; and
- offer tightly restricted official-reference identity assistance.

GPT-5.6 never decides whether a person should buy, switch, start, stop, or dose a medicine. Its output is treated as untrusted input: the server validates structure and rejects clinical, diagnostic, dosage, treatment, urgency, or switching language before the UI can display it.

---

## Privacy and safety by design

| Principle              | HealthBridge behaviour                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| Private by default     | Care Relay selections are stored only on the current device.                                 |
| Explicit consent       | Notes are sent to AI only after an informed checkbox.                                        |
| Minimal data           | Do not enter names, IDs, prescriptions, personal documents, or laboratory-result images.     |
| Human confirmation     | Every journey ends with a pharmacist or care-team conversation, not an automated decision.   |
| Deterministic fallback | Manual entry and controlled templates keep the core flow usable without AI.                  |
| Clear limitations      | Nearby results do not confirm availability, pricing, appointments, capacity, or suitability. |

Use **Clear local data** to remove locally saved plans and relay preferences from the device.

If someone may need urgent or emergency help, they should contact local emergency services or a qualified professional now instead of waiting for HealthBridge.

---

## Technical overview

```text
Browser (Next.js + React + TypeScript)
  ├─ Local demo data and localStorage
  ├─ Web Speech API for optional browser dictation
  ├─ Copy, native share, and print/PDF handoff actions
  └─ Server routes for optional AI and reference enrichment
        ├─ GPT-5.6 Terra vision: visible package / price-label text
        ├─ GPT-5.6: Care Relay and visit-note organization
        ├─ NLM RxNorm / openFDA: reference candidates
        └─ Geoapify: nearby navigation and route estimates
```

### Key technology

| Area              | Technology                                    |
| ----------------- | --------------------------------------------- |
| App               | Next.js App Router, React, TypeScript         |
| UI                | Tailwind CSS, Motion, Lucide React            |
| AI                | OpenAI API, GPT-5.6, Codex                    |
| Testing           | Vitest, ESLint, Prettier                      |
| Local persistence | Browser `localStorage`                        |
| Navigation        | Geoapify and OpenStreetMap-derived categories |

## Run locally

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

### Environment variables

Create `.env.local` for optional AI and navigation enhancements:

```env
# Server-only. Never use NEXT_PUBLIC_ for either key.
OPENAI_API_KEY=your_server_only_key
GEOAPIFY_API_KEY=your_server_only_key
```

The local demo and manual-entry flows remain usable when these values are absent.

## Safety boundary

HealthBridge helps a person organize a conversation with their care team. For medical decisions, urgent concerns, prescriptions, or interpretation of results, contact a qualified healthcare professional or the appropriate emergency service.
