# HealthBridge build guardrails

The demo path is: **type a branded drug → see the savings → save it to my list**.
Prioritize that path over all other work.

- Seeded drugs in a local file must power the hero flow; it must work offline and make no network request.
- Saved medicines use client-side `localStorage` only. Do not add auth, a database, or cross-device sync.
- Keep secrets server-side. Browser code must never receive `OPENAI_API_KEY` or `GOOGLE_PLACES_API_KEY`.
- OpenAI and Google Places are optional fallbacks. They must fail safely: lookup returns a friendly state and pharmacies fall back to cached drugstores.
- Use a fixed Ateneo origin for pharmacy results. Show pharmacies/drugstores only, never clinics.
- Price data is static, manually sourced local data. Do not scrape or introduce price APIs.
- Keep the experience single-screen, responsive to 360px, and make the savings amount the visual focal point.
- Do not add unrelated features such as multi-page navigation, PDF/QR/voice flows, theme toggles, or data-ingestion pipelines during the buildathon.
