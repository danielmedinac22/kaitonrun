# KaitonRun

Training log MVP for running and gym workouts, built for half-marathon preparation (race: September 2026). Tracks workouts, generates phase-aware training plans, and provides analytics/insights.

## Tech Stack

- **Framework:** Next.js 16 (App Router) with React 19
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS 3.4 + Radix UI primitives (shadcn/ui pattern)
- **Validation:** Zod 4
- **Data persistence:** GitHub API (JSON files in `data/workouts/`)
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
│   ├── api/log/route.ts    # POST: log workout to GitHub
│   ├── api/export/route.ts # GET: export workouts as CSV
│   ├── page.tsx            # Home: weekly view + today's plan
│   ├── log/                # Workout logging page & form
│   ├── history/            # Searchable workout history
│   ├── insights/           # Analytics dashboard
│   ├── layout.tsx          # Root layout with nav
│   └── ui/                 # Page-specific UI components
├── components/ui/          # Reusable shadcn-style components
└── lib/
    ├── plan.ts             # Training plan generation & phase logic
    ├── workouts.ts         # Workout types & GitHub data fetching
    ├── github.ts           # GitHub API wrapper (read/write/list)
    └── utils.ts            # Tailwind cn() utility
data/workouts/              # Workout JSON files (YYYY-MM-DD.json)
```

## Architecture

- **Server Components** by default; `"use client"` only for interactive components (forms, dialogs, filters).
- **API Route Handlers** at `src/app/api/` for data mutations.
- **GitHub as persistence:** Workouts stored as individual JSON files via GitHub API. Required because Vercel has ephemeral storage.
- **Training plan is algorithmic:** Generated dynamically in `lib/plan.ts` based on current date, start date, and race date. Phases: Base -> Build -> Specific -> Taper.
- **Path alias:** `@/*` maps to `./src/*`.

## Environment Variables

- `GITHUB_TOKEN` — Required for GitHub API authentication
- `GITHUB_OWNER` — Defaults to `danielmedinac22`
- `GITHUB_REPO` — Defaults to `kaitonrun`
- `NEXT_PUBLIC_PLAN_START_DATE` — Defaults to `2026-02-05`
- `NEXT_PUBLIC_RACE_DATE` — Defaults to `2026-09-13`

## Code Style

- ESLint with `eslint-config-next` (core-web-vitals + TypeScript)
- Prettier for formatting
- Tailwind CSS for all styling (no CSS modules)
- Radix UI for accessible headless components, wrapped with Tailwind classes
- Spanish-language UI and comments in some files
