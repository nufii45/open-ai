# HealthBridge safety evaluation

HealthBridge is a care-conversation aid. These checks verify that the app does
not create a price comparison or clinical recommendation outside its intended
scope.

## Automated fixtures

Run with `npm.cmd test`.

| Fixture                        | Expected safe behavior                                                                      | Coverage                                                |
| ------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Exact matching packs           | Price comparison is enabled only after ingredient, strength, form, and pack quantity match. | `src/lib/twinPack.test.ts`                              |
| Different strength             | Price comparison is blocked and the strength difference is shown.                           | `src/lib/twinPack.test.ts`, `src/lib/demoPacks.test.ts` |
| Different dosage form          | Price comparison is blocked.                                                                | `src/lib/twinPack.test.ts`                              |
| Different pack count           | Price comparison is blocked.                                                                | `src/lib/twinPack.test.ts`                              |
| Unsafe package-scan output     | Output containing treatment/switching language is rejected.                                 | `src/lib/packScan.test.ts`                              |
| Non-PHP or unsafe price output | The price prefill is rejected.                                                              | `src/lib/priceEvidence.test.ts`                         |
| Mismatch handoff               | A different pharmacist question is generated for mismatched packs.                          | `src/lib/counterProof.test.ts`                          |
| Deterministic demo             | The judge demo runs without a camera, upload, API key, or network call.                     | `src/lib/demoPacks.test.ts`                             |

## Manual API failure checks

Run these in the browser before recording a demo.

| Scenario                 | Action                                                                                         | Expected safe behavior                                                              |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Unreadable package image | Upload a blurred or empty image, then scan.                                                    | The preview remains visible and editable manual fields appear.                      |
| Missing OpenAI key       | Remove `OPENAI_API_KEY`, restart the server, then scan.                                        | “AI is unavailable” appears and manual entry remains usable.                        |
| Price-label failure      | Upload an unreadable price label.                                                              | The matching manual price input receives focus; no value is applied.                |
| Unsafe model response    | Use a mocked response containing dosage, diagnosis, treatment, urgency, or switching language. | Server validation rejects it and returns the safe fallback.                         |
| Reduced motion           | Enable the operating-system reduced-motion setting.                                            | No required transition blocks the demo or prevents the final Counter Proof.         |
| Mobile                   | Test at 360px wide.                                                                            | Demo, manual entry, Counter Proof copy/share, and pharmacist handoff remain usable. |

## Safety invariant

AI may transcribe visible text and help organize a user-owned note. Deterministic
code decides whether packs match. The user reviews prices, and a pharmacist or
other qualified professional confirms any care decision. HealthBridge never
diagnoses, prescribes, interprets results, or recommends switching medicine.
