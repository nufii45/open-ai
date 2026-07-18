# Goal — Phase 5: Integration + save-my-list (localStorage)

**Owner:** everyone · **~1 hr** · **Demo sentence:** the whole sentence finally runs end to end.
**Depends on:** Phases 2, 3, 4 all done.

## Steps
1. Wire submit → `findDrug()` **first** (instant, offline). If found, render from local data.
2. If not found → call `/api/lookup` → render with the **"estimated"** badge.
3. **Save-my-list via localStorage** (read the crash-avoidance notes below first):
   - [ ] On mount, load the saved list from localStorage into React state.
   - [ ] "Save to my list" adds the current drug (**dedupe** — never twice);
         write state → localStorage.
   - [ ] Remove control deletes the item; write state → localStorage.
   - [ ] List **survives a page refresh.**
4. Verify savings math (`brandedPrice − genericPrice`) and that it's the visual focal point.
5. Walk all states live: seeded hit, unseeded fallback, gibberish (no-match), route
   failure (error), save, remove, refresh-persists.
6. Commit a known-good version. This is your fallback if later changes break things.

## localStorage crash-avoidance (read before wiring)
- localStorage is **browser-only** — it does not exist during Next.js server render.
  Mark the component `"use client"` and read/write inside `useEffect`, or guard every
  access with `typeof window !== "undefined"`. Touching it at module top-level or in a
  server component crashes build/hydration.
- One key: `healthbridge:savedMeds`. Store as `JSON.stringify(...)`, `JSON.parse` on read.
- Wrap reads/writes in try/catch (storage throws in private mode / when full); on
  failure degrade to an in-memory list rather than crashing.
- This works in the real deployed app on Vercel. (It would NOT work in a Claude.ai
  artifact preview — irrelevant here; you're shipping a real app.)

## Guardrails in play
- Save-my-list = localStorage. **No Supabase, no auth, no accounts, no DB.**
- The hero path (seeded drug → savings → save) must make **no network call** — it
  runs entirely on `drugs.ts` + localStorage.
- Cross-device sync is a spoken roadmap line, not code.

## Done when
- [ ] Seeded drug renders instantly from local data (no network).
- [ ] Unseeded drug falls back to `/api/lookup` with the estimated badge.
- [ ] Save → appears in "My medicines"; remove → disappears; both persist across refresh.
- [ ] No dupes on repeat-save.
- [ ] Known-good commit tagged mentally as the fallback.

**Next:** `/goal 6`