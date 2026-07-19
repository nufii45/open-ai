# HealthBridge — Ask Before You Switch

HealthBridge is a Filipino medication-access prototype. It helps someone compare a familiar branded medicine with a **like-for-like** generic, understand dated PHP price evidence, and prepare a pharmacist-ready question before purchasing.

It is not medical advice and does not tell anyone to start, stop, or change a medicine.

## The safe product flow

1. Search a medicine from the local comparison catalog.
2. HealthBridge shows a saving only when both matching packs have current, human-checked evidence.
3. Review active ingredient, strength, dosage form, pack, source, and observation date.
4. Generate or copy a constrained pharmacist-ready question.
5. Save the comparison locally on the device or open illustrative pharmacy directions.

Unknown medicines and catalog records without verified evidence intentionally show **Not yet verified locally**. The app never invents a generic, price, diagnosis, dose, or substitution recommendation.

## Price evidence standard

The repository currently contains **draft catalog candidates only**. They do not render savings until the team attaches an attributable Philippine source or internal receipt/screenshot ID for both matching packs.

Use [the evidence checklist](docs/PRICE_EVIDENCE_TEMPLATE.md) before setting a record's `verified` flag. Each result requires matching active ingredient, strength, dosage form, and pack, plus fresh evidence no older than 45 days.

## GPT-5.6 pharmacist brief

`POST /api/pharmacist-brief` accepts only a verified local comparison ID. The server loads trusted catalog facts, asks GPT-5.6 Terra for a structured comparison summary, pharmacist question, and three-point checklist, then rejects unsafe output. It never receives symptoms, conditions, allergies, prescription history, or browser-supplied price data.

If the model is unavailable, HealthBridge returns a deterministic safe template so the feature remains useful.

Required server environment variable:

```env
OPENAI_API_KEY=your_server_only_key
```

Optional server environment variable for illustrative pharmacy route estimates:

```env
GEOAPIFY_API_KEY=your_server_only_key
```

Never use `NEXT_PUBLIC_` for either secret. In Vercel, connect the project to `nufii45/open-ai` and add the values in Environment Variables.

## Run locally

```bash
npm install
npm run dev
npm run lint
npm test
npm run build
```

## Build Week submission checklist

- Public deployment that judges can test without payment or login.
- Public repository, or private access shared with `testing@devpost.com` and `build-week-event@openai.com`.
- English demo video under three minutes: search, evidence, savings, pharmacist brief, and pharmacy direction.
- Explain how Codex and GPT-5.6 contributed to the project; include the required `/feedback` Codex session ID in the submission.
- Record dated commits and price evidence from the event period.

## Safety boundary

HealthBridge helps prepare a pharmacist conversation. It does not diagnose conditions, assess emergencies, prescribe medication, recommend dosage, evaluate contraindications, or confirm that a substitution is safe. Always confirm a change with a pharmacist or prescriber.
