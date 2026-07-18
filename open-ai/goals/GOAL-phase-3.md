# Goal — Phase 3: Server routes (OpenAI fallback + live pharmacies)

**Owner:** P1 (parallel) · **~45 min** · **Demo sentence:** the additive layer; must never break the hero moment.
**Depends on:** Phase 2 (`drugs.ts`, `pharmacies.ts`, `findDrug`).

## Steps — lookup route
1. Create `src/app/api/lookup/route.ts` (server handler). **The client NEVER calls
   OpenAI directly.**
2. Read the key from `process.env.OPENAI_API_KEY`.
3. Prompt returns **structured JSON** matching the `Drug` shape. Use a **fast/mini** model.
4. **Safe parse**: try/catch + validate shape (Zod or manual). On failure return a
   clean error — don't crash.
5. Mark OpenAI-sourced results `estimated: true` so the UI can badge them.
6. Test: a seeded drug (resolves locally, skips OpenAI) and an unseeded drug (hits OpenAI).

## Steps — pharmacies route
7. Create `src/app/api/pharmacies/route.ts` — **live Places API (New)** nearby
   search (legacy Places can't be enabled on new projects): fixed Ateneo origin,
   4km, `includedTypes: ["pharmacy"]` (no clinics). Key server-side via the
   `X-Goog-Api-Key` header.
8. **Mandatory fallback to cached `pharmacies.ts` on ANY failure** (timeout, quota,
   bad key, empty result). Tag responses `source: "live"` or `source: "cached"`.
   The card must never render empty.
9. If the team's ready-made `pharmacies-route.ts` exists, drop it in as `route.ts`.
10. Test both ways: key present (live) and key removed / network off (must return
    the cached list with `source: "cached"`).

## Guardrails in play
- Both keys server-side only, never in the client bundle.
- One OpenAI route only. No second backend, no DB, no auth.
- `type/includedTypes = pharmacy` only — never clinics. No geolocation.

## Done when
- [ ] `/api/lookup` returns valid `Drug` JSON for an unseeded drug and a clean error on bad parse.
- [ ] `/api/pharmacies` returns live results with a key, and `source:"cached"` with the key removed.
- [ ] Neither key appears in any client-reachable code.

**Next:** `/goal 4` (if UI not started) or `/goal 5` (to integrate).