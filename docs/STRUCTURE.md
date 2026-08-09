# STRUCTURE.md — Project Structure

This document is the single source of truth for the repo's layout. Any new file/folder must go in its correct place here, not wherever's convenient.

---

## Repo type: single monorepo

```
reading-club/
├── backend/          # FastAPI
├── frontend/          # React + Vite
├── docs/              # All planning and governance docs (this file and its siblings)
├── .agent/            # Antigravity + ECC config — created by the ECC installer, not hand-edited (see §"`.agent/` (Antigravity + ECC)" below)
├── .gitignore
└── README.md          # Entry point — links into docs/
```

**Why:** Single developer (Eslam) + small project — one repo is simpler to manage than two separate ones, and there's no complexity in syncing backend/frontend versions.

---

## `backend/`

```
backend/
├── alembic/
│   ├── versions/              # One file per migration — never edit after it's applied
│   └── env.py
├── app/
│   ├── main.py                 # Entry point + router registration + lifespan (APScheduler)
│   ├── core/
│   │   ├── config.py            # Settings (pydantic-settings) — the only place allowed to read env vars
│   │   ├── security.py          # hashing, JWT create/verify
│   │   └── scheduler.py         # APScheduler setup
│   ├── db/
│   │   ├── session.py           # async engine + get_db dependency
│   │   └── base.py              # shared DeclarativeBase
│   ├── models/                  # SQLAlchemy models — one file per table (matches table names in reading-club-full-plan.md §4)
│   │   ├── user.py
│   │   ├── group.py
│   │   ├── group_member.py
│   │   ├── checkin.py
│   │   ├── streak.py
│   │   ├── fine.py
│   │   ├── fine_vault.py
│   │   ├── book.py
│   │   ├── badge.py
│   │   ├── weekly_title.py
│   │   ├── nudge.py
│   │   └── monthly_summary.py
│   ├── schemas/                 # Pydantic — named to match models (user.py has UserCreate/UserRead/...)
│   ├── api/
│   │   └── v1/
│   │       ├── routes/           # One file per endpoint group (see reading-club-full-plan.md §6 for the full list)
│   │       │   ├── auth.py
│   │       │   ├── groups.py
│   │       │   ├── checkins.py
│   │       │   ├── leaderboard.py
│   │       │   ├── fines.py
│   │       │   ├── books.py
│   │       │   ├── nudges.py
│   │       │   └── stats.py
│   │       └── deps.py           # get_current_user, get_db, require_owner
│   ├── services/                 # Business logic reused across more than one route/job
│   │   ├── streak_service.py
│   │   ├── fine_service.py
│   │   ├── badge_service.py
│   │   └── whatsapp_service.py
│   └── tasks/                    # Everything APScheduler runs
│       ├── daily_close.py
│       ├── weekly_titles.py
│       └── monthly_summary.py
├── tests/                        # Mirrors app/ structure (test_auth.py, test_checkins.py, ...)
├── .env.example
├── Dockerfile
└── requirements.txt
```

### Rules for this folder
- **No business logic inside `routes/`** — a route receives the request, checks permissions, and calls into `services/`. Complex logic (streak calculation, freeze checks) lives in `services/` only.
- **New table = new migration + new model with a matching name** — no direct schema edits from Supabase Studio on any environment.
- **`app/core/config.py` is the only place that reads `os.environ`** — everything else takes settings as a dependency, not a direct env var read anywhere else.

---

## `frontend/`

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx                   # Router setup + route guards
│   ├── api/                      # Backend communication layer only — no direct fetch inside components
│   │   ├── client.ts               # axios instance + interceptor for refreshing access tokens
│   │   ├── auth.ts
│   │   ├── groups.ts
│   │   ├── checkins.ts
│   │   └── ...                     # one file per endpoint group (mirrors backend/app/api/v1/routes/)
│   ├── hooks/                    # TanStack Query hooks — components use hooks, not api/ directly
│   │   ├── useCheckin.ts
│   │   ├── useLeaderboard.ts
│   │   └── useStreak.ts
│   ├── store/                    # Zustand — UI/session state only, not server data
│   │   ├── authStore.ts
│   │   └── uiStore.ts
│   ├── pages/                    # A page = a full route, composed of components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Onboarding.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Calendar.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Bookshelf.tsx
│   │   ├── Vault.tsx
│   │   ├── Profile.tsx
│   │   └── GroupSettings.tsx
│   ├── components/                # Reusable components — no full pages here
│   │   ├── CheckinButton.tsx
│   │   ├── StreakFlame.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── CalendarGrid.tsx
│   │   ├── LeaderboardRow.tsx
│   │   ├── BadgeDisplay.tsx
│   │   ├── ConfettiOverlay.tsx
│   │   ├── BookCard.tsx
│   │   ├── NudgeButton.tsx
│   │   └── AvatarFrame.tsx
│   └── styles/
├── .env.example
└── vite.config.ts
```

### Rules for this folder
- **The frontend never talks to Supabase directly** — everything goes through `backend`. No `supabase-js` in the frontend, no Supabase keys in `frontend/.env`.
- **`api/` returns data matching the backend's Pydantic schemas** — any change to a response shape must be updated in both places together.

---

## `docs/`

```
docs/
├── STRUCTURE.md                        # This file
├── AGENTS.md                           # Rules for working on the code (canonical, full version)
├── GOVERNANCE.md                       # General governance
├── state.md                            # Live project state
└── reading-club-full-plan.md           # The full plan (DB, API, roadmap, tasks)
```

The root `README.md` is the single entry point and links into these — it isn't duplicated here.

---

## `.agent/` (Antigravity + ECC)

```
.agent/
├── rules/
│   ├── project-reading-club.md         # Hand-written — this project's condensed rules, kept in sync with docs/AGENTS.md
│   ├── coding-standards.md             # ECC-installed
│   ├── testing.md                      # ECC-installed
│   ├── security.md                     # ECC-installed
│   ├── typescript.md                   # ECC-installed (frontend)
│   └── python.md                       # ECC-installed (backend)
├── workflows/                          # ECC-installed — slash commands become Antigravity workflows (plan, code-review, tdd, ...)
├── skills/                             # ECC-installed — ECC agents become Antigravity skills (planner, tdd-guide, code-reviewer, security-reviewer, database-reviewer, ...)
└── ecc-install-state.json              # ECC-managed — tracks what ECC owns, used for safe repair/uninstall
```

**This folder is managed by the ECC installer** (`./install.sh --target antigravity typescript python`, run from a clone of [affaan-m/ECC](https://github.com/affaan-m/ECC)), except `.agent/rules/project-reading-club.md`, which is hand-written for this project and must be added manually (ECC won't overwrite a file it didn't create, but it also won't create this one for you).

**Why a separate rules file here instead of just `docs/AGENTS.md`:** Antigravity auto-loads `.agent/rules/*.md` as always-on context. It does not read a root `AGENTS.md`. `docs/AGENTS.md` stays the canonical, full version (for humans, Codex, and any other harness that does read root `AGENTS.md`); `.agent/rules/project-reading-club.md` is a condensed pointer to it, kept short because rules here are always-loaded into every Antigravity session's context.

Don't hand-edit the ECC-installed files under `.agent/rules/`, `.agent/workflows/`, or `.agent/skills/` — run `./install.sh` again (or `node scripts/repair.js --target antigravity`) to update them instead, or your changes will be overwritten on the next install/repair.

---

## Environment variables (quick map)

| File | Location | Contains |
|---|---|---|
| `backend/.env` | never committed | `DATABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `WHATSAPP_*` |
| `frontend/.env` | never committed | `VITE_API_BASE_URL` only — no real secrets (anything in a Vite frontend env ends up visible in the bundle) |

See `backend/.env.example` and `frontend/.env.example` for the full template.

---

## Two rules that never change

1. **No two tables serve the same purpose.** If you think you need a table that's similar to an existing one, check `reading-club-full-plan.md` §4 before creating a new one.
2. **There is no second source of truth.** The API and DB structure are documented in `reading-club-full-plan.md` — the code must match it, and if there's a conflict, the docs get updated first, then the code — never the other way around.
