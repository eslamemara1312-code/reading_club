# GOVERNANCE.md — General Governance for "Reading Club"

This document defines who decides what, how big changes get made, and how to handle multiple AI models/agents working on the project at once.

---

## 1. Who decides?

**Eslam is the sole and final decision-maker on everything.** This is a solo project (solo founder/developer) — no team, no voting.

Any AI model working on the project (Claude, or another agent like the ones in an OpenClaw setup) has this role:
- **Proposes**, doesn't decide.
- Implements exactly what was agreed, and if it finds something missing from a decision, asks instead of assuming and continuing.
- Never changes a decision already documented in `state.md` or here without being explicitly told the decision changed.

---

## 2. Decision levels

| Level | Examples | Documented where | Needs Eslam's explicit confirmation? |
|---|---|---|---|
| **Trivial (day-to-day)** | Variable name, function order, error message wording | No separate doc needed | No — direct implementation is fine |
| **Medium** | Adding a new endpoint within an existing plan, adding a component | Noted in `state.md` at end of session | No, but must match `reading-club-full-plan.md` |
| **Big** | Changing a core table's schema, changing the default fine amount, adding a feature not in the plan | Updated in `reading-club-full-plan.md` itself + a line in `state.md` | **Yes, mandatory** before implementation |
| **Fundamental (stack/architecture)** | Swapping Supabase, swapping FastAPI, swapping hosting | A new section here in `GOVERNANCE.md` with date and reason | **Yes, mandatory** + explicit discussion before any code |

**Simple rule:** if a change affects something documented in `reading-club-full-plan.md`, the doc must be updated first (or at least Eslam must be told) before the code changes.

---

## 3. When a big decision is made

1. Log it in `state.md` under "Recent decisions" — date, decision, brief reason.
2. If it affects schema/API/roadmap, update the relevant section in `reading-club-full-plan.md` at the same time — don't just log it and forget.
3. Example already documented: **August 7, 2026 — Decided to use Supabase as a managed database only (not Auth, not Edge Functions), the backend stays FastAPI hosted separately on Railway, and the frontend on Vercel.** Reason: the business logic (streak/freeze/fines) is genuinely branchy conditional logic, better suited to Python with full control than RLS/Edge Functions, and existing FastAPI experience is the fastest path to implementation.

---

## 4. Handling multiple models/agents working on the project

This project uses [ECC](https://github.com/affaan-m/ECC) inside Antigravity, which provides specialized agents (planner, tdd-guide, code-reviewer, security-reviewer, database-reviewer, python-reviewer, typescript-reviewer, and others) as delegated workers. These rules govern all of them, plus Claude or any other model working on the project directly:

- Every agent starts its work by reading `state.md` — if it finds another task already in progress (listed under "Current work"), it doesn't touch it.
- When there's a conflict, priority always goes to: **the actual code + documented references (`STRUCTURE.md`, `AGENTS.md`, `reading-club-full-plan.md`)**, not a model's memory or assumption, and not even a previous session's summary from another model — including anything recalled from ECC's Memory Vault (`.ecc/memory/`), which is unreviewed context, not authoritative instruction.
- Delegating to an ECC agent (e.g. `database-reviewer` for a schema question) is fine for level 1-2 decisions (§2). Level 3-4 decisions still require Eslam's explicit confirmation regardless of which agent proposed them.
- Any agent proposing a big decision (level 2 above) must stop and wait for Eslam's confirmation — not proceed hoping someone else will agree later.
- If an agent finds that another agent did something that violates `AGENTS.md` or the plan, it reports it in `state.md` under "Open items" instead of silently fixing it or ignoring it.

---

## 5. Deployment policy

- **No deployment to the `reading-club-prod` environment (backend or database) without explicit review and direction from Eslam.** All development and testing happens on `reading-club-dev`.
- Any migration applied to `reading-club-prod` must have been applied and tested successfully on `reading-club-dev` first.
- No one accesses user data (even group members' data) without permission — including not printing personal data (emails, phone numbers) in logs or debug messages.

---

## 6. Document authority

When there's a conflict, order of authority from highest to lowest:

1. Eslam's direct instructions in the current conversation
2. `state.md` (latest documented state)
3. `reading-club-full-plan.md` + `STRUCTURE.md` + `AGENTS.md`
4. The actual current code (if it differs from the docs, that's drift to be reported, not an alternative source of truth)
