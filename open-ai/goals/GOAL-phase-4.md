# Goal — Phase 4: UI

**Owner:** P2 (parallel) · **~1.5 hr** · **Demo sentence:** where the SAVINGS lands and the save happens.
**Depends on:** Phase 1 scaffold. (Can build against mock data before Phases 2–3 land.)

## Steps
1. Single screen: heading + search `input` + submit `button` (**Enter also submits**).
2. Result **card**, in this visual priority order:
   - [ ] **SAVINGS number — the largest, boldest element on the screen.** The demo moment.
   - [ ] Brand → generic name
   - [ ] Price comparison (branded vs generic, side by side)
   - [ ] Dosage note
   - [ ] Small caption: `price via {priceSource}`
   - [ ] 3 nearest **pharmacies (drugstores only)** via `/api/pharmacies`, each with a
         "Get directions" link. Client calls the route, never Google directly.
   - [ ] "Estimated" badge — shown **only** when the result came from OpenAI.
   - [ ] **"Save to my list" button** on the card.
3. **"My medicines" panel**: saved drugs (name + savings), each with a remove (x),
   plus an empty state ("No saved medicines yet").
4. States: **loading** (skeleton/spinner), **no-match** (clean message + suggestion),
   **error** (friendly, no stack trace).
5. Responsive: single-column, developed/demoed on desktop, **usable down to ~360px**
   (check once in the device toolbar).
6. Client calls `/api/lookup` (or reads the local table first, then falls back).

## Guardrails in play
- Savings number is the hero — nothing competes with it visually.
- No maps embed, no QR, no theme toggle, no multi-page nav.
- No extra state library — React state is enough.
- Wiring of save/persistence is Phase 5; here, stub the handlers if needed.

## Done when
- [ ] Typing a drug + Enter renders the card with a dominant savings number.
- [ ] Estimated badge appears only for OpenAI results.
- [ ] Pharmacy list renders (drugstores) with directions links.
- [ ] Loading / no-match / error all render without a stack trace.
- [ ] Nothing overflows at ~360px.

**Next:** `/goal 5`