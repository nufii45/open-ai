# HealthBridge price-evidence checklist

One comparison is eligible to show a saving only when both entries below are complete.
Do not mark a record `verified: true` from memory, an old search result, or an AI response.

| Field | Branded pack | Generic pack |
| --- | --- | --- |
| Medicine and exact pack |  |  |
| Active ingredient |  |  |
| Strength and dosage form |  |  |
| Pack quantity and unit |  |  |
| PHP price observed |  |  |
| Pharmacy/source name |  |  |
| Source URL or receipt/screenshot ID |  |  |
| Date observed (YYYY-MM-DD) |  |  |
| Team member who checked it |  |  |

Copy the exact ingredient, strength, form, and pack into each record's `matchSignature`:

```text
active ingredient|strength|dosage form|quantity unit
```

Example only: `paracetamol|500 mg|tablet|10 tablets`

The app rejects a result when either evidence item is pending, missing, stale (more than 45 days old), or carries a different signature.
