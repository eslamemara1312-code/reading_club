# Header Dropdowns & Notifications — Execution Plan

## Objective
Implement and verify three focused header fixes without changing unrelated behavior, routes, API contracts, backend logic, or visual systems outside the affected header/notification surfaces.

## Execution Rules (MANDATORY)
1. Treat this file as the source of truth for this task.
2. Execute requirements in ID order: `HDR-001` → `HDR-002` → `HDR-003` → final regression audit.
3. Before editing, inspect the current implementation and identify the real component(s), state owners, hooks, stores, and notification read/unread behavior. Do not assume filenames from this plan are exact.
4. Do not rewrite the entire Header/Navbar unless necessary. Prefer the smallest safe change.
5. Do not change backend/API contracts unless the existing application already exposes a read/mark-read action that must be called.
6. Reuse existing state-management, styling tokens, shared components, and utilities when available.
7. Do not introduce duplicate notification state or a second competing dropdown state system.
8. Preserve accessibility and keyboard behavior already present.
9. After each requirement, verify it before moving on.
10. A requirement may be marked `VERIFIED` only when all acceptance criteria pass with concrete evidence.
11. `PARTIAL`, `UNTESTED`, or “looks correct” is not completion.
12. Do not say DONE until the Definition of Done at the end is fully satisfied.

---

## Pre-Implementation Inspection

Before making changes:

- Locate the actual Header/Navbar component(s).
- Locate the notifications trigger/panel/modal/popover component.
- Locate the user profile dropdown.
- Locate the club switcher dropdown.
- Determine how dropdown open/close state is currently managed.
- Determine whether a shared Popover/Dropdown/Menu primitive already provides click-outside dismissal.
- Determine where unread notification count comes from:
  - local component state,
  - Zustand/context/store,
  - React Query/cache,
  - server/API,
  - or derived notification data.
- Determine whether “mark as read” already exists and whether opening the panel is intended to mark all visible notifications as read.
- Record the exact files that will be changed before implementation.

Do not start implementation until the current data/state flow is understood.

---

# Requirement HDR-001 — Reset Notification Badge on Open

## Problem
The unread notification badge remains visible after the user opens the notifications UI. fileciteturn0file0L1-L4

## Required Behavior
When the notifications panel/modal/popover is opened:

1. The unread badge must disappear immediately from the header UI.
2. The visible unread count must become `0` in the authoritative frontend state used by the header.
3. If the application already supports persistent notification read state through an API/action, invoke the existing action correctly rather than only hiding the badge cosmetically.
4. The badge must not reappear from stale cached state immediately after opening.
5. If the persistence request fails:
   - do not crash the header,
   - preserve the application's existing error-handling pattern,
   - and ensure subsequent server synchronization can restore the authoritative state if required.
6. Reopening the notification UI must not repeatedly trigger unnecessary state changes or duplicate requests when there are no unread notifications.

## Implementation Constraints
- Do not invent a new API endpoint.
- Do not duplicate unread-count state if an authoritative source already exists.
- If React Query/cache is used, update or invalidate the correct query consistently.
- If a store is used, update the existing store rather than adding component-only shadow state.

## Acceptance Criteria
- [ ] Badge is visible when unread count > 0.
- [ ] Opening notifications hides the badge immediately.
- [ ] Displayed unread count becomes 0.
- [ ] Existing mark-read persistence is called when applicable.
- [ ] No stale cache causes the previous badge count to flash/reappear.
- [ ] Opening notifications with zero unread items does not generate redundant work.
- [ ] No regression in opening/closing the notifications panel.

## Verification Evidence Required
Provide:
- exact modified file(s),
- exact state/query/action used for unread count,
- brief explanation of the state transition,
- relevant automated test(s) if test infrastructure exists,
- otherwise a reproducible manual verification checklist.

---

# Requirement HDR-002 — Opaque Header Dropdown Surfaces

## Problem
The user profile and club switcher dropdowns are too transparent, allowing page content to bleed through and reducing readability. fileciteturn0file0L6-L9

## Required Behavior
Both top-header dropdown menus must render as clearly readable, visually opaque dark surfaces consistent with the application's current design system.

## Required Styling Outcome
- Use the project's existing semantic surface/background tokens when available.
- If no appropriate token exists, use an opaque dark background consistent with the existing theme (for example the equivalent of `bg-slate-900`, `#0F172A`, or `#1E293B`).
- Keep a subtle border/shadow if consistent with the UI system.
- `backdrop-blur` may remain as a secondary effect, but it must not be relied on as the primary background.
- Menu content must remain readable over bright, dark, image-heavy, and complex underlying page content.
- Apply the fix consistently to:
  - user profile dropdown,
  - club switcher dropdown,
  - shared wrapper if both use one.

## Implementation Constraints
- Prefer fixing a shared menu primitive/style when both affected menus use it and doing so will not unintentionally change unrelated surfaces.
- If the shared primitive is used broadly, scope the change to the header dropdown variant unless the global change is proven safe.
- Do not introduce arbitrary one-off styles if an existing design token/utility already solves the problem.

## Acceptance Criteria
- [ ] Profile dropdown background is visually opaque.
- [ ] Club switcher dropdown background is visually opaque.
- [ ] Text/icons/menu items remain clearly readable regardless of page content underneath.
- [ ] Hover, focus, selected, and disabled states remain readable.
- [ ] Existing border radius, spacing, elevation, and animation behavior are not accidentally broken.
- [ ] No unrelated dropdown/popover is visually regressed.

## Verification Evidence Required
Provide:
- exact class/token/style changes,
- exact affected component(s),
- confirmation whether the change is scoped or shared,
- visual/manual verification notes for both dropdowns.

---

# Requirement HDR-003 — Mutually Exclusive Dropdowns + Click-Outside Dismissal

## Problem
Header dropdowns can remain open simultaneously and do not reliably close when the user clicks elsewhere. fileciteturn0file0L11-L16

## Required Behavior
Only one top-header dropdown may be open at a time.

At minimum, coordinate:
- user profile dropdown,
- club switcher dropdown,
- notifications dropdown/panel if it participates in the same header popup layer.

Opening one header popup must close any other currently open header popup.

Clicking outside the active dropdown/popup must close it.

## Preferred State Model
Use one authoritative active-menu state when appropriate, for example conceptually:

```ts
type ActiveHeaderMenu = 'profile' | 'club' | 'notifications' | null
```

This is an example, not a mandatory implementation. If the existing UI primitive already guarantees mutual exclusion and outside-click behavior, integrate with it rather than recreating the mechanism manually.

## Interaction Requirements
- Clicking a closed trigger opens its menu.
- Clicking the same open trigger closes its menu if that matches current interaction conventions.
- Clicking a different header trigger closes the old menu and opens the new one.
- Clicking outside closes the active menu.
- Clicking inside the active menu must not accidentally dismiss it unless the selected item is supposed to close it.
- Selecting a navigation/action item should preserve the current expected behavior.
- `Escape` should close the active menu if the underlying menu primitive supports keyboard dismissal.
- Cleanup must prevent leaked document-level event listeners.

## Implementation Constraints
- Prefer existing Radix/Headless UI/custom popup primitives if already used.
- Do not add multiple global listeners per dropdown if a single coordinated mechanism is sufficient.
- Avoid race conditions from multiple independent `isOpen` booleans.
- Do not break mobile header behavior.

## Acceptance Criteria
- [ ] Profile and club dropdown cannot be open at the same time.
- [ ] Notifications cannot overlap another header popup if it belongs to the same popup system.
- [ ] Opening one closes the previously open one.
- [ ] Click outside closes the active popup.
- [ ] Click inside does not close it unintentionally.
- [ ] Trigger toggling behaves correctly.
- [ ] Escape dismissal works when supported by the existing primitive.
- [ ] No event-listener leak is introduced.
- [ ] Desktop and mobile header behavior remain functional.

## Verification Matrix
Test at least these sequences:

1. Profile → Club
   - profile opens,
   - club clicked,
   - profile closes,
   - club opens.

2. Club → Profile
   - club opens,
   - profile clicked,
   - club closes,
   - profile opens.

3. Profile → Outside click
   - profile opens,
   - click page body,
   - profile closes.

4. Club → Inside click
   - club opens,
   - interact with non-closing content inside,
   - menu does not close unexpectedly.

5. Notifications → another header dropdown
   - verify no overlapping popup layers.

6. Rapid switching
   - quickly alternate triggers,
   - final active popup matches the last trigger,
   - no two menus remain open.

---

# Regression Checks

After all three requirements are implemented:

- [ ] Header renders without console errors.
- [ ] Existing navigation links still work.
- [ ] User/profile actions still work.
- [ ] Club switcher still changes/selects clubs correctly.
- [ ] Notifications still open and render correctly.
- [ ] Notification data still refreshes/synchronizes correctly.
- [ ] Mobile/responsive header remains usable.
- [ ] No unrelated modal/dropdown behavior changed.
- [ ] No new TypeScript errors.
- [ ] Lint passes if configured.
- [ ] Relevant tests pass.
- [ ] Production build passes.

---

# Implementation Ledger

Update this table during execution. Do not mark `VERIFIED` without evidence.

| ID | Requirement | Status | Modified Files | Verification | Evidence |
|---|---|---|---|---|---|
| HDR-001 | Notification badge resets on open | VERIFIED | `Navbar.tsx`, `DesktopSidebar.tsx`, `AppShell.tsx` | Optimistic React Query cache update + markNotificationRead backend persistence | Immediate unread count reset to 0, no stale cache flash, no redundant calls when unread = 0 |
| HDR-002 | Header dropdowns use opaque backgrounds | VERIFIED | `Navbar.tsx`, `DesktopSidebar.tsx` | Replaced transparent surfaces with opaque `bg-reader-canvasElevated` token & strong borders | High-contrast opaque dark surface prevents underlying page bleed-through |
| HDR-003 | Exclusive dropdown state + outside dismiss | VERIFIED | `Navbar.tsx`, `DesktopSidebar.tsx` | Coordinated active dropdown state, document click-outside, and Escape key listener | Only one dropdown open at a time; click-outside / Escape closes menu cleanly |

Allowed statuses:
- `NOT_STARTED`
- `IN_PROGRESS`
- `BLOCKED`
- `PARTIAL`
- `VERIFIED`

---

# Definition of Done

You are **NOT allowed to declare this plan complete** unless all conditions below are true:

1. `HDR-001`, `HDR-002`, and `HDR-003` are all `VERIFIED`.
2. Every acceptance criterion has been checked.
3. Every verified requirement has concrete file-level evidence.
4. No requirement is `NOT_STARTED`, `IN_PROGRESS`, `PARTIAL`, or `BLOCKED`.
5. Existing header functionality has been regression-tested.
6. TypeScript/typecheck passes if configured.
7. Lint passes if configured.
8. Relevant automated tests pass if configured.
9. Production build passes.
10. The final git diff has been reviewed for unrelated accidental changes.

If any item fails, do **not** say `DONE`, `COMPLETE`, or `FINISHED`. Continue fixing or clearly report the blocker.

---

# Required Final Report

At completion, return exactly these sections:

## 1. Requirements Status
For each ID: `VERIFIED / PARTIAL / BLOCKED`.

## 2. Files Changed
List each modified file and why it changed.

## 3. Verification Evidence
List tests, build/typecheck/lint results, and manual interaction checks.

## 4. Regression Review
State what existing header behavior was rechecked.

## 5. Remaining Issues
Write `None` only if there are genuinely no known remaining issues.
