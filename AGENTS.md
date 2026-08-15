<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Investment App

Next.js 16 App Router (Turbopack) + React 19 + Tailwind CSS v4 + TypeScript (strict). No test runner, no CI, no backend. Single page at `/`.

## Commands

- `npm run dev` — dev server. `next dev` regenerates the `nextjs-agent-rules` block above; keep it in committed diffs.
- `npm run lint` — ESLint. Next 16 does **not** run lint during `next build`; run it separately.
- `npx tsc --noEmit` — typecheck (no npm script exists).
- `npm run build` — production build.

## Architecture

- `app/page.tsx` composes three independent sections from `features/investments/components/`: `investment-header.tsx`, `investment-main.tsx`, `investment-footer.tsx`.
- Only `investment-main.tsx` is a client component (`"use client"`); header and footer are server components. Keep new interactive state inside the main tree.
- One server API route: `app/api/investments/quotes/route.ts` proxies Alpha Vantage (`GLOBAL_QUOTE` for stocks, `CURRENCY_EXCHANGE_RATE` for crypto) using the server-only `ALPHA_VANTAGE_API_KEY` from `.env.local` (gitignored). The free tier allows ~1 request/second and 25/day, so the route fetches one unique symbol at a time (client paces calls), retries rate-limit responses with backoff, and caps a refresh at 25 unique symbols. The client in `investment-main.tsx` drives the per-symbol loop and shows live progress. No server actions. Persistence is browser `localStorage` only, versioned key `investments:v1` (`features/investments/storage.client.ts`), read through the `useSyncExternalStore` hook in `use-investments.ts` to avoid hydration mismatch/flicker.
- `data/investments.seed.json` is read-only seed data — the fallback when storage is empty or invalid. Runtime records are never written to files; to reset demo data, clear the `investments:v1` localStorage key.
- Derived columns (total gain/loss, return %) are computed at render time by pure functions in `features/investments/calculations.ts`. Persisted JSON stores only source fields — never add derived values to the stored record.

## Conventions

- Path alias `@/*` maps to the repo root (`tsconfig.json`). Prefer `@/` for cross-directory imports.
- Design tokens are Tailwind v4 `@theme` variables in `app/globals.css` (`--color-cobalt`, `--color-gain`, `--color-loss`, `--color-ink`, ...); dark mode overrides the same variables under `prefers-color-scheme: dark`. Use utility classes (`bg-cobalt`, `text-gain`, ...), not hardcoded hex.
- Format financial values through `features/investments/format.ts` (Intl.NumberFormat); render numbers with `font-mono` + `tabular-nums`.
- Client-side form validation lives in `features/investments/validation.ts`. Currency options are the `CURRENCIES` const in `create-investment-form.tsx`.
- Next 16 route helpers (`PageProps`, `LayoutProps`, `RouteContext`) are generated globals — do not import them.
- Import directly from source files; this repo has no barrel/index re-exports.
