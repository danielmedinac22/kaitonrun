# KaitonRun

Training log MVP for running and gym workouts, built for half-marathon preparation (race: September 2026). Tracks workouts, generates phase-aware training plans, provides analytics/insights, and includes an AI coach powered by OpenAI.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 3.4 + Radix UI primitives (shadcn/ui pattern)
- **Validation:** Zod 4
- **Data persistence:** GitHub API (JSON files in `data/workouts/`)
- **AI Coach:** OpenAI API (gpt-4o-mini) for workout analysis, training zones, plan adjustments
- **Deploy target:** Vercel

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (use this to check for type errors)
- `npm run lint` — Run ESLint
- `npm start` — Run production server

No test framework is configured.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/log/route.ts              # POST: log workout to GitHub
│   ├── api/export/route.ts           # GET: export workouts as CSV
│   ├── api/coach/route.ts            # POST: AI coach (analyze, briefing, weekly, zones, adjust)
│   ├── api/strava/authorize/route.ts # GET: redirect to Strava OAuth
│   ├── api/strava/callback/route.ts  # GET: OAuth callback, exchange code
│   ├── api/strava/sync/route.ts      # POST: sync activities from Strava
│   ├── page.tsx            # Home: today's plan + AI coach + weekly view
│   ├── log/                # Workout logging page & form
│   ├── history/            # Searchable workout history
│   ├── insights/           # Analytics dashboard (Progreso) + AI weekly review
│   ├── settings/           # Settings: Strava, zones, export, plan info
│   ├── strava/             # Strava OAuth redirect handler
│   ├── layout.tsx          # Root layout with 5-tab mobile nav + desktop header
│   ├── loading.tsx         # Streaming suspense loading skeleton
│   ├── not-found.tsx       # 404 page (Spanish)
│   └── ui/                 # Page-specific UI components
│       ├── CoachCard.tsx    # AI coach: analyze workout / pre-workout briefing
│       ├── WeeklyReviewCard.tsx  # AI weekly training review
│       ├── ZonesCard.tsx    # AI training zone calculator
│       ├── SyncButton.tsx   # Manual Strava sync trigger
│       ├── NavLink.tsx      # Active nav links (desktop + mobile FAB)
│       └── QuickMarkDialog.tsx  # Quick workout logging dialog
├── components/ui/          # Reusable shadcn-style components
└── lib/
    ├── coach.ts            # OpenAI AI coach: system prompt, analysis, zones, adjustments
    ├── plan.ts             # Training plan generation & phase logic
    ├── workouts.ts         # Workout types & GitHub data fetching
    ├── github.ts           # GitHub API wrapper (read/write/list)
    ├── strava.ts           # Strava OAuth, token mgmt, activity sync, auto-sync
    └── utils.ts            # Tailwind cn() utility
data/workouts/              # Workout JSON files (YYYY-MM-DD.json)
```

## Architecture

- **Server Components** by default; `"use client"` only for interactive components (forms, dialogs, filters).
- **API Route Handlers** at `src/app/api/` for data mutations.
- **GitHub as persistence:** Workouts stored as individual JSON files via GitHub API. Required because Vercel has ephemeral storage.
- **Training plan is algorithmic:** Generated dynamically in `lib/plan.ts` based on current date, start date, and race date. Phases: Base -> Build -> Specific -> Taper.
- **Strava integration:** OAuth2 flow for connecting Strava accounts. Activities are fetched via the Strava API and mapped to KaitonRun workout format. Tokens are stored in `data/strava-tokens.json` via GitHub API. Auto-sync on home page load (1h cooldown). Only runs are auto-synced; gym/rest are manual.
- **AI Coach (`lib/coach.ts`):** Uses OpenAI gpt-4o-mini with a detailed running coach system prompt. Supports: post-workout analysis, pre-workout briefing, weekly review, training zone calculation, and plan adjustment suggestions. All coaching is context-aware (uses recent workouts, current phase, plan targets).
- **Navigation:** 5-tab mobile bottom nav (Hoy | Historial | +Registrar | Progreso | Ajustes) with center FAB for logging. Desktop has icon nav + CTA button. Based on Strava/NRC/TrainingPeaks UX patterns.
- **Path alias:** `@/*` maps to `./src/*`.

## Environment Variables

- `GITHUB_TOKEN` — Required for GitHub API authentication
- `GITHUB_OWNER` — Defaults to `danielmedinac22`
- `GITHUB_REPO` — Defaults to `kaitonrun`
- `NEXT_PUBLIC_PLAN_START_DATE` — Defaults to `2026-02-05`
- `NEXT_PUBLIC_RACE_DATE` — Defaults to `2026-09-13`
- `STRAVA_CLIENT_ID` — Strava app client ID (required for Strava sync)
- `STRAVA_CLIENT_SECRET` — Strava app client secret (required for Strava sync)
- `NEXT_PUBLIC_APP_URL` — App base URL for OAuth redirect (defaults to `http://localhost:3000`)
- `OPENAI_API_KEY` — Required for AI coach features (workout analysis, zones, adjustments)

## Code Style

- ESLint with `eslint-config-next` (core-web-vitals + TypeScript)
- Prettier for formatting
- Tailwind CSS for all styling (no CSS modules)
- Radix UI for accessible headless components, wrapped with Tailwind classes
- Spanish-language UI and comments in some files
