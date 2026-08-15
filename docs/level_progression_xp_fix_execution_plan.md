# Level Progression & XP Calculation — Execution Plan

## Objective
Fix level progression so a user's level is always derived correctly from total XP, eliminate negative “remaining XP” values, and verify threshold/boundary behavior without changing unrelated gamification rules.

## Execution Rules (MANDATORY)
1. Treat this file as the source of truth for this task.
2. Inspect the existing XP/level system before changing code. Do not guess the progression formula.
3. Identify the authoritative source of:
   - total XP,
   - current level,
   - level thresholds,
   - next-level XP,
   - progress percentage,
   - remaining XP.
4. Reuse the existing level thresholds/rules. Do **not** invent a new XP curve unless the existing implementation is missing or contradictory; if so, report it as a blocker rather than silently redesigning game balance.
5. Centralize duplicated level math if duplication is the cause, but avoid broad unrelated refactoring.
6. The UI must never display a negative remaining-XP value.
7. Handle users who gain enough XP to skip multiple levels in a single update.
8. Verify exact-threshold and over-threshold boundary cases.
9. A requirement is complete only after implementation **and** verification.
10. Do not say DONE until the Definition of Done is satisfied.

---

# Requirement XP-001 — Derive the Correct Current Level from Total XP

## Problem
When total XP exceeds the current level requirement, the displayed level does not advance, producing invalid progression output. fileciteturn0file1L1-L4

## Required Behavior
The application must determine the user's effective current level from the user's **total XP** and the project's existing level thresholds.

The logic must correctly handle:
- XP below the first level-up threshold,
- XP exactly equal to a threshold,
- XP just above a threshold,
- XP high enough to skip more than one level,
- very high XP at or beyond the highest configured level.

## Important Semantic Rule
First inspect how the project defines thresholds. Determine which model is actually used:

### Model A — Cumulative thresholds
Example:
```ts
level 1 starts at 0 total XP
level 2 starts at 100 total XP
level 3 starts at 250 total XP
```

### Model B — Per-level costs
Example:
```ts
level 1 -> 2 costs 100 XP
level 2 -> 3 costs another 150 XP
```

Do not mix these models. Normalize calculations according to the existing project rules.

## Acceptance Criteria
- [ ] Effective current level is recalculated from authoritative total XP.
- [ ] Exact threshold advances to the intended level according to existing game rules.
- [ ] XP greater than a threshold advances correctly.
- [ ] Multi-level jumps work correctly.
- [ ] Current level never gets stuck below the level implied by total XP.
- [ ] No existing XP thresholds or balance values are silently changed.

---

# Requirement XP-002 — Correct Next-Level Threshold

## Required Behavior
After deriving the effective current level, derive the correct next-level threshold from the same authoritative progression definition.

Do not calculate the next threshold from a stale stored/displayed level.

## Acceptance Criteria
- [ ] Next-level threshold corresponds to the newly derived current level.
- [ ] The logic works immediately after crossing one or multiple thresholds.
- [ ] Highest-level behavior is explicitly handled and does not reference an undefined threshold.

---

# Requirement XP-003 — Eliminate Negative Remaining XP

## Required Behavior
For users who have another level available, compute remaining XP using the project's correct threshold semantics.

Conceptually, for cumulative thresholds:

```ts
remainingXP = nextLevelThreshold - totalXP
```

But this formula is valid only **after** current level and next threshold are recalculated correctly.

Do not fix the bug only by doing:

```ts
Math.max(0, staleNextLevelXP - totalXP)
```

if the underlying level is still wrong. Clamping may be used only as a final defensive guard after the progression state is correct.

## Acceptance Criteria
- [ ] Remaining XP is never negative.
- [ ] Remaining XP is correct immediately before a level threshold.
- [ ] Remaining XP resets to the correct amount after a level-up.
- [ ] Multi-level jumps produce the correct remaining XP for the final derived level.
- [ ] Highest-level/max-level state does not show a misleading negative or impossible “XP remaining” value.

---

# Requirement XP-004 — Correct Progress-Bar Calculation

## Required Behavior
Inspect the profile progression UI for any percentage/progress-bar logic tied to the same stale level values.

If the profile shows progress within the current level, compute progress relative to the current level range, not incorrectly against raw total XP when the project uses cumulative thresholds.

For cumulative thresholds, the intended concept is typically:

```ts
xpIntoCurrentLevel = totalXP - currentLevelStartXP
xpNeededForCurrentLevel = nextLevelStartXP - currentLevelStartXP
progress = xpIntoCurrentLevel / xpNeededForCurrentLevel
```

Use the project's actual semantics, not this example blindly.

## Acceptance Criteria
- [ ] Progress percentage reflects the derived current level.
- [ ] Progress is not negative.
- [ ] Progress does not exceed 100% for a normal non-max-level state.
- [ ] Crossing a level threshold resets progress appropriately for the new level.
- [ ] Max-level state is rendered intentionally.

---

# Requirement XP-005 — Single Source of Truth for Progression Math

## Required Behavior
Inspect whether level/remaining/progress calculations are duplicated between components, hooks, selectors, utilities, or stores.

If duplicate formulas can produce inconsistent results, consolidate the calculation into the safest existing shared layer (utility, selector, domain helper, etc.) and consume the result from the Profile UI.

Do not move unrelated gamification logic.

## Acceptance Criteria
- [ ] Current level, next-level threshold, remaining XP, and progress are computed from one consistent rule set.
- [ ] Profile UI does not independently reimplement conflicting formulas.
- [ ] Existing callers are not broken.

---

# Required Boundary Tests

Use the **real project thresholds** discovered during inspection.

For at least three consecutive levels, verify cases equivalent to the following:

| Case | Total XP | Expected |
|---|---:|---|
| Below threshold | threshold - 1 | Stay on current level; remaining = 1 |
| Exact threshold | threshold | Advance according to existing rule |
| Above threshold | threshold + 1 | New level; positive remaining XP |
| Multi-level jump | above 2+ thresholds | Resolve directly to correct final level |
| Zero XP | 0 | Valid initial level/progress |
| Very high XP | beyond highest threshold | Valid max-level behavior |

Also test any existing edge cases such as:
- missing/undefined XP,
- null values from old accounts,
- non-integer XP if the application permits it,
- persisted `level` field disagreeing with computed total XP.

Do not change data contracts merely to make these tests easier.

---

# Data Consistency Decision

During inspection, determine whether `level` is:

1. **Derived display state** from total XP, or
2. **Persisted authoritative state** stored in backend/database.

If it is derived:
- compute it safely from total XP at the appropriate frontend/domain layer.

If it is persisted:
- do not silently introduce database/API changes.
- determine whether the existing backend already has a level-up mechanism.
- fix the correct existing path if within scope.
- if backend persistence is fundamentally wrong and cannot be safely fixed within the current task, report the exact blocker and still prevent invalid UI calculations where safely possible.

---

# Regression Checks

- [ ] Profile page renders correctly.
- [ ] Existing XP display remains correct.
- [ ] Existing badges/ranks/level labels still use the intended level.
- [ ] Any leaderboard that depends on XP/level is not accidentally changed.
- [ ] Daily check-in XP awards still work.
- [ ] Existing gamification rules/threshold values are unchanged.
- [ ] No negative remaining-XP text appears.
- [ ] No progress bar overflow/underflow occurs.
- [ ] No new console errors.
- [ ] No new TypeScript errors.
- [ ] Relevant tests pass.
- [ ] Production build passes.

---

# Implementation Ledger

Update this table as work proceeds. `VERIFIED` requires evidence.

| ID | Requirement | Status | Modified Files | Verification | Evidence |
|---|---|---|---|---|---|
| XP-001 | Derive correct current level from total XP | VERIFIED | `progression.ts`, `ProfilePage.tsx`, `Dashboard.tsx`, `Navbar.tsx`, `DesktopSidebar.tsx`, `badge_service.py` | 15/15 boundary tests in `verify_boundary_tests.js` | Recalculated from total XP; exact thresholds advance to Level 2 (200 XP), Level 3 (400 XP), etc. Multi-level jumps jump directly |
| XP-002 | Derive correct next-level threshold | VERIFIED | `progression.ts`, `ProfilePage.tsx` | Boundary testing at 0, 199, 200, 201, 750, 1800, 3500 XP | Next-level threshold derived from newly computed current level; capped at max level 10 (1800 XP) |
| XP-003 | Correct remaining XP / prevent negatives | VERIFIED | `progression.ts`, `ProfilePage.tsx` | Boundary tests for 199 XP (1 rem), 200 XP (200 rem), 201 XP (199 rem), 1800+ XP (0 rem) | Remaining XP is non-negative and resets to correct next tier cost after level-up |
| XP-004 | Correct progress-bar calculation | VERIFIED | `progression.ts`, `ProfilePage.tsx` | Range checks: 0% at 0 XP & 200 XP, 25% at 50 XP & 250 XP, 99.5% at 199 XP, 100% at max level | Progress computed relative to current tier range, bounded strictly within [0, 100]% |
| XP-005 | Ensure one consistent progression rule set | VERIFIED | `progression.ts`, `ProfilePage.tsx`, `Dashboard.tsx`, `Navbar.tsx`, `DesktopSidebar.tsx`, `badge_service.py` | Full repo grep + single shared utility import | All components consume unified `calculateLevelProgression` |

Allowed statuses:
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `PARTIAL`
- `VERIFIED`

---

# Definition of Done

You are **NOT allowed to declare this plan complete** unless:

1. `XP-001` through `XP-005` are all `VERIFIED`, or a genuinely inapplicable item is explicitly justified with code evidence.
2. The real project threshold semantics were identified before implementation.
3. Exact-threshold, above-threshold, and multi-level-jump cases were tested.
4. Remaining XP cannot become negative through normal valid inputs.
5. Progress cannot render below 0% or above 100% for non-max-level users.
6. Max-level behavior is handled intentionally.
7. No XP threshold values or game-balance rules were silently altered.
8. Relevant existing functionality was regression-tested.
9. Typecheck passes if configured.
10. Lint passes if configured.
11. Relevant automated tests pass if configured.
12. Production build passes.
13. Final git diff was inspected for unrelated accidental changes.

If any condition is false, do **not** say `DONE`, `COMPLETE`, or `FINISHED`.

---

# Required Final Report

At completion return exactly:

## 1. Progression Model Found
State whether thresholds are cumulative or per-level and identify the authoritative source/file.

## 2. Requirements Status
Report `XP-001` through `XP-005` as `VERIFIED / PARTIAL / BLOCKED`.

## 3. Files Changed
List every modified file and why.

## 4. Boundary-Test Evidence
Show the real XP values tested and actual outcomes.

## 5. Build / Test Results
Report typecheck, lint, tests, and production build separately.

## 6. Remaining Issues
Write `None` only if there are genuinely no known remaining issues.
