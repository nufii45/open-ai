# Goal — openFDA enrichment (LIVE, with fallback)

**Owner:** whoever's free · **only after the core flow works** · **Demo sentence:** the "look, it's calling a real external API right now" moment — subordinate to the SAVINGS hero.
**Depends on:** Phase 5 done AND the hero path rock-solid. If in doubt, skip.

> **Why live:** the goal here is to *demonstrate a live external-API integration on
> stage*. So this calls openFDA in real time — a deliberate exception to the project's
> default "pre-cache only" stance. The exception is only safe because of the mandatory
> fallback below. The SAVINGS number and the seeded hero path are NOT touched by this.

## Steps
1. Create `src/app/api/drug-info/route.ts` (server handler). The client calls this
   route, never openFDA directly.
2. **Live fetch** openFDA drug labels, keyed by **generic ingredient** (openFDA is
   US-market — it knows "acetaminophen," not "Biogesic"):
   `https://api.fda.gov/drug/label.json?search=openfda.generic_name:"{generic}"&limit=1`
   No API key needed for this volume.
3. Pull at most:
   - one **indication** line from `indications_and_usage`
   - one **safety flag** from `boxed_warning` (fallback to first `warnings` entry)
   Strip US pricing / NDC / US brand data.
4. **Mandatory fallback + timeout (~2.5s):** on ANY failure (timeout, quota, empty
   result, bad shape) return a small cached blurb from a local
   `src/data/drug-info.ts` (pre-write it for your 2-3 demo drugs) and tag the
   response `source: "cached"`. Live responses tag `source: "live"`. The panel must
   never render empty and must never block the card.
5. UI: a small enrichment panel under the price comparison — one "Used for: X" line +
   one "warning" line. Never larger or bolder than the savings number.
6. Test both ways: normal (live result, `source:"live"`) and network off / bad query
   (cached, `source:"cached"`).

## Guardrails in play
- Hero path stays offline and unbroken — this is additive only.
- Savings number stays the visual hero; this panel is subordinate.
- openFDA queried by **generic ingredient only**. No ICD-10, no other datasets.
- Key-free, but still server-side via the route — client never hits `api.fda.gov`.
- Remove any `// TODO: openFDA enrichment (later)` stub — don't leave both.

## Done when
- [ ] `/api/drug-info` returns a live indication + one warning for a seeded generic.
- [ ] With network off / bad query, it returns the cached blurb, `source:"cached"`, no crash.
- [ ] Panel renders under the prices, visually subordinate to the savings number.
- [ ] No live call sits on the seeded hero path; the savings moment is unaffected.

**Next:** re-run `/goal 8` to re-confirm the demo is still safe with the live call in.