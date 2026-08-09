# AGENTS.md — Rules for Working on "Reading Club"

Required reading before any code change — whether you're an AI model or a developer. Goal: anyone/any model working on the project shouldn't break something that works, and shouldn't assume something exists that doesn't.

> **This is the canonical, full version of the project rules.** If you're an AI agent running inside Antigravity, there's also a condensed copy at `.agent/rules/project-reading-club.md` that Antigravity auto-loads into every session — keep the two in sync if either changes. See §9 below for how this project uses ECC's built-in workflows (planning, TDD, review, security) instead of reinventing them.

---

## 0. The most important rule: don't assume, verify

- **Before any change:** read the relevant file in full, not just the context snippet given in the request.
- **Before saying "this table has a column called X":** open the actual model or migration — don't rely on `reading-club-full-plan.md` alone as if it were the code. It's the intended design, not necessarily the current reality if drift has happened.
- **If you find a conflict between the plan and the actual code:** stop and flag it to Eslam. Don't resolve the conflict by guessing which one is right.
- **If you're unsure about a decision** (naming, response shape, error behavior): ask instead of picking automatically and moving on.

---

## 1. Before starting any task

1. Read `state.md` — it tells you where things stand and the latest decisions made.
2. Read `STRUCTURE.md` if the task adds a new file/folder — make sure it goes in the right place.
3. Review the relevant section in `reading-club-full-plan.md` (DB schema, endpoint, business logic) before writing anything.
4. If the task comes from the "Task Breakdown" section (§15) — work on one or two related tasks at a time, not more, so review stays manageable.

---

## 2. Sticking to the schema and the API

- Any change to a table's structure = a new Alembic migration. **Never** edit an existing table manually from Supabase Studio on any environment (dev or prod).
- Table/column/endpoint names must match `reading-club-full-plan.md` §4 and §6 exactly. If a change is needed, update the doc first, then write the code.
- Any new endpoint that isn't in the documented list gets added to the doc before or in the same commit that creates it — not forgotten afterward.

---

## 3. Naming conventions

| Context | Rule | Example |
|---|---|---|
| Python (variables, functions, files) | `snake_case` | `current_streak`, `fine_service.py` |
| Python (classes) | `PascalCase` | `class Checkin(Base):` |
| TypeScript/React (variables, functions) | `camelCase` | `checkinDate`, `useLeaderboard()` |
| React components/files | `PascalCase` | `CheckinButton.tsx` |
| DB tables and columns | `snake_case`, plural for tables | `group_members`, `checkin_date` |
| API routes | `kebab-case` or no separator | `/groups/{id}/hall-of-fame` |
| Environment variables | `SCREAMING_SNAKE_CASE` | `SUPABASE_SERVICE_ROLE_KEY` |

Don't mix styles within the same file, even if surrounding code uses an old wrong pattern — if you find a wrong pattern in existing code, flag it instead of copying it.

---

## 4. Security — strict rules

- **Absolutely never** write any secret (password, JWT_SECRET, SUPABASE_SERVICE_ROLE_KEY, WhatsApp token) inside code, a commit, or a doc message with a real value. Example values are always placeholders.
- `SUPABASE_SERVICE_ROLE_KEY` lives in backend environment variables only. If you find it in any frontend code or anywhere else — that's a security incident, stop and report immediately.
- The frontend talks to the backend only. No direct connection from the frontend to Supabase.
- Every new endpoint must clearly define: does it require login? Does it require Owner role? Check the "Auth" column in the endpoint table (§6) and match it in the actual code — don't assume it's protected.
- Before any commit: verify `.env` isn't among the staged files (`git status` or `git diff --cached`).

---

## 5. Testing before closing a task

- Any new endpoint: at least one documented manual test (a successful request + an expected-to-fail one, e.g. missing data or wrong permissions).
- Any conditional logic (streak, freeze, fine) — test both branches: the condition holds, and the condition doesn't hold. Don't just test the happy path.
- Background jobs (`daily_close`, `weekly_titles`, `monthly_summary`) — test by running them manually with simulated data/timing before relying on them as scheduled.

---

## 6. Git workflow

- One branch per feature/task: `feature/checkin-endpoint`, `fix/streak-freeze-bug`.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- **No direct pushes to `main`.** Every change goes through a Pull Request, even if Eslam is the one reviewing it himself shortly after.
- A commit message describes "why", not just "what" — e.g. `fix: prevent duplicate check-in for same day via unique constraint` is better than `fix: checkin bug`.

---

## 7. End of every work session

- **Updating `state.md` is mandatory** before closing the session: what was done, what's left, any new decision made and why.
- If you found a problem or conflict you couldn't resolve, log it in `state.md` under "Open items" instead of ignoring it or trying to resolve it by guessing.

---

## 8. Things not to touch without Eslam's explicit approval

- `docs/` files (especially `GOVERNANCE.md` and `reading-club-full-plan.md`) — suggesting a change, yes; editing directly, no.
- Default fine amount, checkin deadline time, grace period — these are product decisions only Eslam makes.
- Any change to the core tech stack (swapping FastAPI, swapping Supabase, swapping React) — a big decision, discuss in `GOVERNANCE.md` before implementing.

---

## 9. Use ECC's workflows instead of reinventing them

This project uses [ECC](https://github.com/affaan-m/ECC) inside Antigravity for planning, TDD, review, and security. Don't duplicate what it already does well:

| Instead of... | Use |
|---|---|
| Writing an ad-hoc implementation plan in chat | `/ecc:plan "..."` (or `/plan`) — produces a reviewable plan artifact |
| Writing code straight away | `tdd-workflow` skill — write the failing test first, then implement |
| Self-reviewing your own diff | `/code-review` — a fresh-context review catches things the implementing context misses |
| Skipping a security pass because "it's a small change" | `/security-scan` before anything touching auth, secrets, or user input |
| Guessing whether a query/schema change is sound | the `database-reviewer` agent |

Section 5 (testing) and section 4 (security) above are the non-negotiable minimums — ECC's workflows are how you actually meet them with less manual effort, not a replacement for them.

If ECC's Memory Vault (`.ecc/memory/`) is in use for cross-session handoffs, treat recalled entries as unreviewed context, same as a prior session's summary — `state.md` and this file still outrank it if they conflict.
