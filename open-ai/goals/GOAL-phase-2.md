# Goal — Phase 2: Data layer

**Owner:** P1 (parallel with Phase 4) · **~45 min** · **Demo sentence:** the local truth the hero path reads from.
**Depends on:** Phase 1 scaffold.

## Steps
1. Create `src/data/drugs.ts` with the `Drug` interface:
   `brand, generic, brandedPrice, genericPrice, dosage, category, priceSource`.
2. Seed **~15 single-ingredient** drugs (Biogesic→paracetamol, Advil→ibuprofen,
   Ponstan/Dolfenal→mefenamic acid, Alnix→cetirizine, Neobloc→metoprolol, …).
   Combination products stay OFF the demo path.
3. Fill each price with a clearly-marked `// PLACEHOLDER` number so the app runs.
   The team overwrites these with real branded + generic prices hand-checked on
   **Watsons PH / Mercury Drug / DOH DPRI**, and records the source in `priceSource`.
4. Pick your **2–3 demo drugs = the biggest savings gap.** The spread sells the app.
5. Write `findDrug(query)`: normalize case/whitespace, match brand OR generic,
   return the record or `null`.
6. Create `src/data/pharmacies.ts` — the cached real Ateneo pharmacy set
   (**drugstores only, no clinics**) with a fixed origin + distance helper that
   surfaces the 3 nearest. If the team's ready-made file exists, drop it in as-is.

## Note on live data / openFDA
Phase 2 is **local files only** — this is the offline hero path. Live drug-info
enrichment (openFDA) is a separate goal: run `/goal openfda` after the core flow
works. Do NOT add live API calls or datasets to the price/generic data here.

## Guardrails in play
- **Never scrape or call a price API** (Watsons/Mercury/TGP/DOH). Static local file only.
- **Do NOT fabricate prices as authoritative** — placeholders must be visibly marked.
- No dataset ingestion (ICD-10/HPO/MedlinePlus/Synthea/RxNorm). ICD-10 classifies
  diseases, not drugs — it does not belong here.
- Pharmacies: drugstores only, never clinics. Fixed Ateneo origin, no geolocation.

## Done when
- [ ] `src/data/drugs.ts` exports `Drug` + ~15 seeded single-ingredient rows.
- [ ] Every price is a marked `// PLACEHOLDER` (or a real checked price + source).
- [ ] `findDrug()` returns the right record for brand and generic queries, `null` otherwise.
- [ ] `src/data/pharmacies.ts` returns the 3 nearest drugstores from the fixed origin.

**Next:** `/goal 3`