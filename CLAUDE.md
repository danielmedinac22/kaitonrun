# KaitonRun

Training log for running and gym workouts, built for half-marathon preparation (race: September 2026). Tracks workouts, generates phase-aware training plans, provides analytics/insights, and includes an AI coach powered by OpenAI.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 3.4 + Radix UI primitives (shadcn/ui pattern)
- **Validation:** Zod 4
- **Data persistence:** Supabase (PostgreSQL) — tables: `workouts`, `athlete_profile`, `plan_overrides`, `strava_tokens`
- **AI Coach:** OpenAI API (GPT-5.2) for workout analysis, training zones, plan adjustments
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
│   ├── api/
│   │   ├── log/route.ts              # POST: log workout to Supabase
│   │   ├── export/route.ts           # GET: export workouts as CSV/JSON
│   │   ├── coach/route.ts            # POST: AI coach (tool use)
│   │   ├── profile/route.ts          # GET: load athlete profile
│   │   └── strava/
│   │       ├── authorize/route.ts    # GET: redirect to Strava OAuth
│   │       ├── callback/route.ts     # GET: OAuth callback, exchange code
│   │       └── sync/route.ts         # POST: sync activities from Strava
│   │
│   ├── page.tsx              # Home: greeting + today hero + coach insight + quick nav
│   ├── entrenamientos/       # Training plan: race hero, sessions list, month calendar
│   │   ├── page.tsx
│   │   └── ui/
│   │       ├── RaceHeroCard.tsx           # Race countdown + phase timeline hero
│   │       ├── PlanProgressSummary.tsx    # Sessions/minutes/week pills
│   │       ├── TodaySessionCard.tsx       # Today's session (training days only)
│   │       ├── WeekStripNav.tsx           # Week day strip navigation
│   │       ├── UpcomingSessionsList.tsx   # Next 14 days sessions (no rest)
│   │       └── MonthCalendarView.tsx      # Month calendar grid (client)
│   ├── coach/                # AI Coach: tabs (chat/changes) + enhanced context
│   │   ├── page.tsx
│   │   └── ui/
│   │       ├── CoachContextHeader.tsx     # 2-row visual state card
│   │       ├── CoachTabs.tsx              # Chat/Changes tabs (client)
│   │       └── RecentCoachChanges.tsx
│   ├── historial/            # History + analytics: insights first, KPIs with deltas, collapsible list
│   │   ├── page.tsx
│   │   └── ui/
│   │       ├── HistorialHeader.tsx        # Period filter pills
│   │       ├── InsightsSummary.tsx        # Insights + coach CTA
│   │       ├── KPICardsGrid.tsx           # 4 KPIs with delta indicators
│   │       ├── TrendChart.tsx
│   │       ├── PersonalRecords.tsx
│   │       ├── PaceTrend.tsx
│   │       └── HistoryClient.tsx
│   ├── ajustes/              # Settings: profile, Strava, zones, export
│   │   └── page.tsx
│   ├── log/                  # Workout logging form
│   │   ├── page.tsx
│   │   └── ui/LogForm.tsx
│   ├── strava/               # Strava OAuth redirect handler
│   │   ├── page.tsx
│   │   └── ui/StravaClient.tsx
│   │
│   ├── layout.tsx            # Root layout: 5-tab mobile nav + desktop header + FAB
│   ├── loading.tsx           # Streaming suspense loading skeleton
│   ├── not-found.tsx         # 404 page (Spanish)
│   ├── globals.css           # Tailwind base styles + animations
│   └── ui/                   # Shared UI components
│       ├── CoachChat.tsx         # AI coach chat interface (client)
│       ├── NavLink.tsx           # Desktop + mobile nav links (default/accent variants)
│       ├── QuickMarkDialog.tsx   # Quick workout logging dialog
│       ├── SyncButton.tsx        # Manual Strava sync trigger
│       ├── ZonesCard.tsx         # Training zones display (client)
│       ├── FloatingLogButton.tsx # FAB for logging (Home/Entrenos/Coach/Historial)
│       ├── QuickNavCard.tsx      # Navigation card with icon + variant
│       ├── NextSessionCard.tsx   # Next planned session preview
│       ├── MotivationalGreeting.tsx # Time-aware greeting + status message
│       └── CoachMicroInsight.tsx # Latest coach note preview
│
├── components/ui/            # Reusable shadcn-style components
│   ├── accordion.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── tabs.tsx
│   └── textarea.tsx
│
└── lib/
    ├── coach.ts              # OpenAI AI coach: system prompt, tools, analysis
    ├── plan.ts               # Training plan generation & phase logic
    ├── workouts.ts           # Workout types & Supabase CRUD
    ├── supabase.ts           # Supabase client singleton
    ├── strava.ts             # Strava OAuth, token mgmt, activity sync, auto-sync
    ├── athlete.ts            # Athlete profile & plan overrides persistence (Supabase)
    ├── labels.ts             # Shared type labels, icons, colors
    ├── stats.ts              # KPI computation, trends, records, insights
    └── utils.ts              # Tailwind cn() utility
```

## Navigation (5 tabs)

| Tab | Route | Purpose |
|-----|-------|---------|
| Inicio | `/` | Greeting + today hero + coach insight + quick nav |
| Entrenos | `/entrenamientos` | Race hero, upcoming sessions, month calendar (primary section) |
| Coach | `/coach` | AI coach tabs (Chat/Changes) + context header |
| Historial | `/historial` | Insights first, KPIs with deltas, trends, collapsible workout list |
| Ajustes | `/ajustes` | Settings: profile, Strava, zones, export |

- **Entrenos** tab has primary variant (elevated, indigo)
- **Coach** tab has purple accent variant
- **FAB** (floating action button) for logging visible on Home, Entrenamientos, Coach, Historial
- **`/log`** is the full logging form (accessible via FAB and buttons)
- Old routes `/history`, `/insights`, `/settings` redirect (301) to new routes

## Architecture

- **Server Components** by default; `"use client"` only for interactive components (forms, dialogs, filters, chat).
- **API Route Handlers** at `src/app/api/` for data mutations.
- **Supabase as persistence:** All data stored in Supabase PostgreSQL tables (`workouts`, `athlete_profile`, `plan_overrides`, `strava_tokens`). Single query replaces 200+ GitHub API calls.
- **Training plan is algorithmic:** Generated dynamically in `lib/plan.ts` based on current date, start date, and race date. Phases: Base -> Build -> Specific -> Taper.
- **Strava integration:** OAuth2 flow for connecting Strava accounts. Activities are fetched via the Strava API and mapped to KaitonRun workout format. Tokens stored in `strava_tokens` table. Auto-sync on home page load (1h cooldown).
- **AI Coach (`lib/coach.ts`):** Uses OpenAI with a detailed running coach system prompt. Supports tool use for: getting workouts, modifying plan, calculating zones, updating goals.
- **Shared utilities:** `lib/labels.ts` for type labels/icons, `lib/stats.ts` for KPI/trend/record computation.
- **Path alias:** `@/*` maps to `./src/*`.

## Environment Variables

- `SUPABASE_URL` — Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (required)
- `NEXT_PUBLIC_PLAN_START_DATE` — Defaults to `2026-02-05`
- `NEXT_PUBLIC_RACE_DATE` — Defaults to `2026-09-13`
- `STRAVA_CLIENT_ID` — Strava app client ID (required for Strava sync)
- `STRAVA_CLIENT_SECRET` — Strava app client secret (required for Strava sync)
- `NEXT_PUBLIC_APP_URL` — App base URL for OAuth redirect (defaults to `http://localhost:3000`)
- `OPENAI_API_KEY` — Required for AI coach features

## Code Style

- ESLint with `eslint-config-next` (core-web-vitals + TypeScript)
- Prettier for formatting
- Tailwind CSS for all styling (no CSS modules)
- Radix UI for accessible headless components, wrapped with Tailwind classes
- Spanish-language UI
