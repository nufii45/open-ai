# HealthBridge — Generic Finder (7-hour buildathon)

## Product goal
Single-screen Next.js app. The demo path is: **type a branded drug -> see the
SAVINGS -> save it to my list.** That one flow is the entire product. Prioritize it
over all other work.

## Hard rules — do not violate
- Build only the one flow. A working demo beats architecture.
- The hero path runs on **seeded drugs in a local file + localStorage** and makes
  **no network request** — it must work offline and cannot fail on stage.
- Prices are hand-curated in `src/data/drugs.ts` by the team, each with its stated
  `priceSource`. NEVER scrape or call a price API (Watsons/Mercury/TGP/DOH). Static
  local file only. Treat any OpenAI-sourced price as "estimated."
- Saved medicines use client-side `localStorage` only, under one guarded key
  (`healthbridge:savedMeds`). No auth, no database, no accounts, no cross-device
  sync (that's a spoken roadmap line, not code).
- Keep secrets server-side. Browser code must NEVER receive `OPENAI_API_KEY` or
  `GOOGLE_PLACES_API_KEY`.
- Live integrations are additive fallbacks, never dependencies, and must fail safely:
  - **OpenAI (mini)** lookup for unseeded drugs -> server route, structured JSON,
    safe parse; on failure render a friendly state and badge results "estimated."
  - **Google Places (New)** for pharmacies -> server route, fixed Ateneo origin (no
    geolocation), `includedTypes:["pharmacy"]` (drugstores only, never clinics),
    MANDATORY cached fallback. The card must never render empty.
  - **openFDA** drug-info -> server route `src/app/api/drug-info/route.ts`, LIVE,
    queried by generic ingredient, MANDATORY cached fallback + timeout. One
    indication + one warning, visually subordinate to the savings number, and NOT on
    the seeded hero path. This is the only sanctioned live dataset call. Run via
    `/goal openfda`.
- No dataset ingestion (ICD-10 / HPO / MedlinePlus / Synthea / RxNorm). ICD-10
  classifies diseases, not drugs — it fills no field on the card and stays out. The
  openFDA carve-out above does not reopen this.
- No backend beyond the three server routes named above.
- No QR, PDF, voice, theme toggle, maps embed, multi-page nav, empty feature
  folders, or unused state stores. React state is enough.
- Single-screen, responsive down to ~360px, developed/demoed on desktop. The
  SAVINGS amount is the largest, boldest element on the card — the visual focal point.

## .claude/ rule
Exactly ONE custom command lives here: `.claude/commands/goal.md`. Nothing else — no
subagents, hooks, rules files, or additional commands. Do not create more; do not
delete `goal.md`. Add `.claude/settings.local.json` to `.gitignore` if it appears.

## Goal workflow (/goal)
Work runs one phase at a time via `/goal <n>`, which loads `goals/phase-<n>-*.md`.
Each run:
1. **Load** the matching `goals/` file plus these guardrails. Both bind you.
2. **Gate** on its "Depends on" against the real repo. If a prerequisite isn't done,
   STOP and name the earlier `/goal` — don't stub it.
3. **Execute** only that goal's steps. Add nothing outside scope.
4. **Verify** against "Done when" by reading/running the real code.
5. **Report**: files changed, assumptions (flag every PLACEHOLDER/hardcode), the
   manual verify path, a one-line guardrail check, and the exact next `/goal`.
The hero path must make NO network call; live calls are additive and must never break
the demo moment.

## Tech
Next.js 15 App Router, TypeScript, Tailwind, shadcn/ui, Lucide. Server routes:
`/api/lookup` (OpenAI mini, structured JSON, safe parse), `/api/pharmacies` (Places
New + cached fallback), `/api/drug-info` (openFDA live + cached fallback). Keep env
vars in `.env.local`; never commit keys.

## Commands
- Install: npm install
- Dev: npm run dev