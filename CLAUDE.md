# HealthBridge project notes

## Product goal

HealthBridge helps a user find a generic equivalent for a branded medicine, see the potential savings, and save that medicine locally.

## Implementation boundaries

- Next.js App Router with TypeScript and Tailwind.
- The local seeded drug table is the primary lookup source and the only guaranteed demo path.
- OpenAI lookup and live Google Places results are additive server-side fallbacks, never dependencies for the core experience.
- Persist saved medicines under one guarded `localStorage` key, e.g. `healthbridge:savedMeds`.
- Treat externally generated drug pricing as estimated; local data should retain its stated source.
- Keep environment variables in `.env.local`; never commit keys.
