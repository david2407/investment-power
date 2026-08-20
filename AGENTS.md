<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Investment App

Next.js 16 App Router (Turbopack) + React 19 + Tailwind CSS v4 + TypeScript (strict). No test runner, no CI. Auth + persistence via Supabase.

## Commands

- `npm run dev` — dev server. `next dev` regenerates the `nextjs-agent-rules` block above; keep it in committed diffs.
- `npm run lint` — ESLint. Next 16 does **not** run lint during `next build`; run it separately.
- `npx tsc --noEmit` — typecheck (no npm script exists).
- `npm run build` — production build.

## Architecture

- `app/page.tsx` composes three independent sections from `features/investments/components/`: `investment-header.tsx`, `investment-main.tsx`, `investment-footer.tsx`.
- Only `investment-main.tsx` is a client component (`"use client"`); header and footer are server components. Keep new interactive state inside the main tree.
- One server API route: `app/api/investments/quotes/route.ts` proxies Alpha Vantage (`GLOBAL_QUOTE` for stocks, `CURRENCY_EXCHANGE_RATE` for crypto) using the server-only `ALPHA_VANTAGE_API_KEY` from `.env.local` (gitignored). The free tier allows ~1 request/second and 25/day, so the route fetches one unique symbol at a time (client paces calls), retries rate-limit responses with backoff, and caps a refresh at 25 unique symbols. The route requires an authenticated Supabase session. The client in `investment-main.tsx` drives the per-symbol loop and shows live progress.

### Authentication (Supabase)

- Auth uses Supabase with Google OAuth (PKCE). Add credentials + redirect URLs in the Supabase dashboard for sign-in to work.
- Files:
  - `lib/supabase/client.ts` — browser client (`createBrowserClient`).
  - `lib/supabase/server.ts` — per-request server client (`createServerClient` + `cookies`).
  - `lib/supabase/database.types.ts` — hand-maintained `Database` type (regenerate via Supabase if schema changes).
  - `proxy.ts` — Next 16 proxy that refreshes the session and redirects unauthenticated users from `/` to `/login` (and authenticated users away from `/login`).
  - `app/auth/callback/route.ts` — OAuth code exchange + profile upsert.
  - `app/login/page.tsx` (+ `login-button.tsx`, `login-error.tsx`) — Google sign-in screen.
  - `app/auth/actions.ts` — `signOut` server action.
- Session state is held in cookies via `@supabase/ssr`. The auth-aware `investment-header.tsx` reads the user server-side and renders sign-in/sign-out.

### Data model (Supabase `investment-db`)

- `public.profiles` — `id` references `auth.users(id)`, plus `full_name`, `avatar_url`. A profile row is upserted on sign-in.
- `public.investments` — one row per position, scoped by `user_id` referencing `auth.users(id)`. Columns map the `Investment` type (`asset_type`, `asset_name`, `symbol`, `platform`, `quantity`, `purchase_price`, `purchase_date`, `current_price`, `currency`) plus `created_at`/`updated_at`.
- Row Level Security is enabled on both tables; all policies enforce `auth.uid() = user_id` (investments) / `auth.uid() = id` (profiles). Never trust a client-supplied `user_id`.
- The client repository lives in `features/investments/use-investments.ts` (`"use client"`). It maps DB rows to the camelCase `Investment` type, loads on auth change, and exposes async `addInvestment`, `deleteInvestment`, `updateCurrentPrice`, `updateCurrentPrices`.
- Derived columns (total gain/loss, return %) are computed at render time by pure functions in `features/investments/calculations.ts`. Persisted rows store only source fields — never add derived values.
- No `localStorage` persistence. New users start with an empty portfolio (seed JSON in `data/` is no longer loaded). `data/investments.seed.json` / `investments.deleted.seed.json` are legacy and unused.

## Conventions

- Path alias `@/*` maps to the repo root (`tsconfig.json`). Prefer `@/` for cross-directory imports.
- Design tokens are Tailwind v4 `@theme` variables in `app/globals.css` (`--color-cobalt`, `--color-gain`, `--color-loss`, `--color-ink`, ...); dark mode overrides the same variables under `prefers-color-scheme: dark`. Use utility classes (`bg-cobalt`, `text-gain`, ...), not hardcoded hex.
- Format financial values through `features/investments/format.ts` (Intl.NumberFormat); render numbers with `font-mono` + `tabular-nums`.
- Client-side form validation lives in `features/investments/validation.ts`. Currency options are the `CURRENCIES` const in `create-investment-form.tsx`.
- Next 16 route helpers (`PageProps`, `LayoutProps`, `RouteContext`) are generated globals — do not import them.
- Import directly from source files; this repo has no barrel/index re-exports.
- Env (`.env.local`, gitignored): `ALPHA_VANTAGE_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Never expose a service-role key to the browser.
