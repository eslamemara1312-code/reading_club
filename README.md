# Reading Club — Group Reading Habit Tracker App

A tracker for a closed group of friends (<20 people) to keep up daily reading commitment: streaks, a symbolic fine for missed days, and some fun (badges, weekly titles, celebrations).

**Golden rule:** the app rewards commitment, not volume of reading.

## Documentation

Read these in order if you're new to the project (human or AI model):

1. [`docs/AGENTS.md`](./docs/AGENTS.md) — Rules for working on the code (required reading before any change)
2. [`docs/STRUCTURE.md`](./docs/STRUCTURE.md) — Full repo/project structure
3. [`docs/state.md`](./docs/state.md) — Where things stand right now (updated continuously)
4. [`docs/GOVERNANCE.md`](./docs/GOVERNANCE.md) — Who decides what, and how
5. [`docs/reading-club-full-plan.md`](./docs/reading-club-full-plan.md) — The full plan: DB schema, API endpoints, business logic, roadmap, task breakdown

If you're an AI agent running in **Antigravity**, also read [`.agent/rules/project-reading-club.md`](./.agent/rules/project-reading-club.md) — Antigravity loads that automatically; it won't pick up `docs/AGENTS.md` on its own.

## Tech Stack (summary)

| Layer | Tool |
|---|---|
| Backend | FastAPI (Python) |
| Database | PostgreSQL on Supabase |
| Frontend | React 18 + Vite + TypeScript + Tailwind |
| Server State | TanStack Query |
| Client State | Zustand |
| Backend hosting | Railway (or Fly.io) |
| Frontend hosting | Vercel |

Full details in `docs/reading-club-full-plan.md`, section 2.

## Working with Antigravity + ECC

This project is developed with [Antigravity](https://antigravity.dev) IDE, using [ECC](https://github.com/affaan-m/ECC) (an agent-harness toolkit: skills, agents, rules, hooks) for planning, TDD, code review, and security scanning.

- Project-specific rules Antigravity auto-loads: [`.agent/rules/project-reading-club.md`](./.agent/rules/project-reading-club.md)
- Full project rules (canonical): [`docs/AGENTS.md`](./docs/AGENTS.md)
- ECC install command for this stack: `./install.sh --target antigravity typescript python` (run from inside a clone of the ECC repo, pointed at this project)

## Running locally

```bash
# 1. Backend
cd backend
cp .env.example .env      # fill in values from your Supabase project (reading-club-dev)
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 2. Frontend (in a separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

> If you don't have a Supabase project yet, see the "Local development" section in `docs/reading-club-full-plan.md` (section 13).

## Current status

Phase 0 — Setup (Completed). See [`docs/state.md`](./docs/state.md) for details and updates.
