# state.md — Live State of "Reading Club"

> This file is updated continuously. If a new AI model starts working on the project, it should read this file right after `AGENTS.md`.

**Last updated:** January 18, 2025

---

## Current phase

**Phase 2 — PDF Reader Upgrade (In Progress).** The basic PDF viewer (react-pdf) is being replaced with EmbedPDF-based ReadingViewer for a modern, full-featured reading experience. Phase 1 (basic EmbedPDF integration) is complete. Phase 2 (reader UX improvements) is partially complete.

---

## Recent decisions

| Date | Decision | Reason |
|---|---|---|
| Jan 18, 2025 | Implement PDF reader upgrade in two phases | Phase 1: basic EmbedPDF integration; Phase 2: UX improvements (thumbnails, search, zoom, keyboard shortcuts, mobile) |
| Jan 18, 2025 | Defer search and outline features to later phase | EmbedPDF search/bookmark APIs are complex and changed significantly; focusing on stable features first |
| Jan 18, 2025 | Keep legacy PdfReader.tsx as fallback | Rollback path until new reader is fully tested and verified |
| Aug 12, 2026 | Full high-fidelity Arabic RTL visual redesign executed across all pages | Upgrade UX to world-class dark/light aesthetic matching contract in `docs/visual-redesign-handoff.md` |
| Aug 12, 2026 | Integrated 3-layer CSS design token system (`tokens.css`) mapped to Tailwind | Consistent semantic color tokens (`reader.*`), anti-flash paint script, and clean theme switching |
| Aug 12, 2026 | Built 3-region responsive `AppShell` with standalone reader variant | Prevents fixed sidebar & mobile navigation bars from covering PDF reader controls in reader view |
| Aug 7, 2026 | Database on Supabase (managed Postgres only, not Auth, not Edge Functions) | Managed backups/administration without hand-rolling infra |
| Aug 7, 2026 | Backend stays FastAPI (Python), hosted separately on Railway (or Fly.io) | Supabase doesn't host Python; the logic (streak/freeze/fines) is branchy and better suited to Python with full control than RLS |
| Aug 7, 2026 | Frontend hosted on Vercel, separate from the backend | Static build, automatic deploys, no need for a manual VPS/nginx setup |
| Aug 7, 2026 | Two separate Supabase projects (`reading-club-dev` / `reading-club-prod`) | Avoid touching real data during development |
| Aug 7, 2026 | Final name: **Reading Club** — technical slug: `reading-club` | Eslam's final decision |
| Aug 7, 2026 | Backend hosting: Railway | Eslam already has Vercel and Supabase accounts; Railway is a simpler starting point than Fly.io for a solo developer |
| Aug 7, 2026 | All foundational docs written in English | Easier for AI models working on the codebase to parse and follow |
| Aug 8, 2026 | Development happens in Antigravity IDE, using ECC ([affaan-m/ECC](https://github.com/affaan-m/ECC)) for planning/TDD/review/security | Eslam's chosen setup; docs reorganized under `docs/` + `.agent/rules/project-reading-club.md` added since Antigravity doesn't auto-load a root `AGENTS.md` |
| Aug 8, 2026 | Phase 0 scaffolding initialized (FastAPI backend + React/Vite/TS/Tailwind frontend + Alembic + pytest + docs/) | Established clean monorepo architecture matching `STRUCTURE.md` |
| Aug 8, 2026 | Phase 1 Core MVP implemented (JWT Auth, Group Creation/Joining, Checkins, Streaks, Leaderboard, live React integration) | Delivered full core user workflow |
| Aug 8, 2026 | Phase 2 Fines & Calendar implemented (Fines, Fine Vault, APScheduler daily close job, Freeze consumption, Calendar grid) | Automated background penalty/freeze processing |
| Aug 8, 2026 | Phase 3 Gamification implemented (Badges engine, User Badges, XP levelling, Weekly Titles job, Confetti, Avatar Frames) | Full motivation & rewards system |
| Aug 8, 2026 | Phase 4 Books & Discussion implemented (Books catalog, Group active reading plan, Pace calculator, Discussions, Replies) | Full book management & social discussion features |
| Aug 8, 2026 | Phase 5 WhatsApp Integration & Notifications implemented (Meta Cloud API, Webhook, 22:00 PM alerts, In-app Notif Center) | Full notifications & WhatsApp reminder workflow |
| Aug 9, 2026 | Documented `discussions` and `discussion_replies` in `reading-club-full-plan.md` | Align plan docs with added Discussions/Replies feature |
| Aug 9, 2026 | Made `daily_close` job idempotent & added grace period support to check-ins | Prevent duplicate fines and handle after-midnight check-in attribution |

See `GOVERNANCE.md` §3 for full context.

---

## Current work

**PDF Reader Phase 2 - Reader UX Improvements (Mostly Complete).**
- ✅ Page thumbnails panel with virtualized rendering via EmbedPDF ThumbnailsPane
- ✅ Zoom controls (in/out/reset, percentage display, FitWidth default)
- ✅ Reader sidebar on desktop and a dedicated mobile bottom sheet with pages, outline, and display tabs
- ✅ Table of contents/outline using EmbedPDF bookmark plugin
- ✅ Keyboard shortcuts (ArrowLeft/Right for navigation, Escape to close sidebar)
- ✅ Mobile UX improvements (fixed reading viewport, safe-area bottom navigation, modal bottom sheet, large touch targets, backdrop/escape/outside-click dismissal)
- ⏳ PDF search functionality (deferred due to EmbedPDF search API complexity - draft implementation kept in comments)
- Production build passes successfully
- Legacy PdfReader.tsx retained as fallback

**Implementation details:**
- New file: `frontend/src/components/reader/ReadingViewer.tsx` (532 lines)
- Uses EmbedPDF packages: @embedpdf/core, @embedpdf/engines, @embedpdf/plugin-viewport, @embedpdf/plugin-scroll, @embedpdf/plugin-document-manager, @embedpdf/plugin-render, @embedpdf/plugin-thumbnail, @embedpdf/plugin-bookmark, @embedpdf/plugin-zoom, @embedpdf/plugin-interaction-manager
- Integrated with ReaderPage.tsx, preserving existing progress tracking and page restoration
- Arabic RTL styling with Reading Club theme tokens
- Responsive design: keeps persistent controls minimal on mobile and moves display controls into the bottom sheet
- Mobile bottom-sheet tabs: Thumbnails (الصفحات), Outline (المحتويات), and Display (العرض)

---

## Next Steps

1. Manual testing of new ReadingViewer with shared PDFs and local files
2. Verify page navigation, thumbnails, zoom, and keyboard shortcuts work correctly
3. Consider adding search and outline features after EmbedPDF API stabilizes
4. Remove legacy PdfReader.tsx once new reader is fully verified
5. Update documentation to reflect new reader capabilities

---

## Open items (need a decision or follow-up)

- PDF search and outline features deferred due to EmbedPDF API complexity - decision needed on whether to pursue these with EmbedPDF or use alternative approach
- Manual acceptance testing required for new reader with real PDF files
- Legacy reader removal pending final verification

---

## Session log

### Session — January 18, 2025 (PDF Reader Phase 2 - Reader UX Improvements - Part 2)

- Implemented: Table of contents/outline using EmbedPDF bookmark plugin with hierarchical bookmark rendering
- Implemented: Sidebar tabs switching between Thumbnails (الصفحات) and Outline (المتويات)
- Implemented: Recursive bookmark rendering with depth-based indentation for nested outline items
- Implemented: Loading state for outline with ReaderStatus component
- Added: Arabic labels for outline tab and empty state message
- Deferred: PDF search functionality (draft implementation kept in comments but not integrated due to EmbedPDF search API complexity)
- Verified: Production build passes successfully (`npm run build`)
- Files modified: `frontend/src/components/reader/ReadingViewer.tsx` (expanded to 532 lines with outline support)
- Packages installed: @embedpdf/plugin-bookmark, @embedpdf/plugin-search (search installed but not integrated)

### Session — January 18, 2025 (PDF Reader Phase 2 - Reader UX Improvements)

- Implemented: Page thumbnails panel using EmbedPDF ThumbnailsPane with virtualized rendering
- Implemented: Zoom controls (in/out/reset, percentage display, FitWidth default via ZoomMode)
- Implemented: Reader sidebar with thumbnails, toggleable, full-screen on mobile with close button
- Implemented: Keyboard shortcuts (ArrowLeft/Right for page navigation, Escape to close sidebar)
- Implemented: Mobile UX improvements (responsive sidebar layout, hidden zoom controls on mobile, full-width sidebar in fullscreen mode)
- Deferred: PDF search functionality (attempts made but removed due to EmbedPDF search API complexity and breaking changes)
- Deferred: Table of contents/outline (bookmark plugin has breaking changes; deferred to later phase)
- Verified: Production build passes successfully (`npm run build`)
- Verified: Legacy PdfReader.tsx retained in codebase as fallback
- Files modified: `frontend/src/components/reader/ReadingViewer.tsx` (complete rewrite with new features), `frontend/src/pages/ReaderPage.tsx` (integration update)
- Packages installed: @embedpdf/plugin-thumbnail, @embedpdf/plugin-zoom

### Session — August 12, 2026 (Visual Redesign Review Remediation)

- Fixed: Replaced unsupported opacity modifiers on raw CSS-variable colors with explicit semantic glass, subdued, and disabled tokens; confirmed the new utilities exist in production CSS.
- Fixed: Added a real dashboard activity rail and aligned responsive behavior with the approved 768px, 1200px, and 1440px thresholds.
- Fixed: Centralized badge and notification overlays in `AppShell`, so their controls work on every protected page rather than only on Dashboard.
- Fixed: Migrated `NudgeButton` from hard-coded legacy colors to theme tokens and improved touch targets, labels, and modal dialog semantics.
- Fixed: Added the missing ESLint toolchain/configuration and resolved all reported errors and warnings, including reader effect dependencies.
- Restored: Reinstated all historical decisions and session-log entries removed by the earlier redesign update.
- Verified: `npm run lint` passes with zero warnings; `npm run build` passes; `git diff --check` passes.
- Visually checked: Login in light and dark themes at 1440×900 and 390×844; no browser-console errors. Authenticated workflows remain for final user acceptance.

### Session — August 9, 2026 (Part 2 — Junction Fix, Coverage & Idempotency, Real-World Walkthrough)
- Done: Untracked duplicate `.agents/` files from Git index (`git rm -r --cached .agents`) and added `.agents` to `.gitignore`. Standardized on `.agent/` as single canonical source of truth while keeping local NT junction.
- Fixed: Added idempotency checks to `monthly_summary.py`, `weekly_titles.py`, and `reminder_job.py` to prevent duplicate row creation on background job re-runs.
- Fixed: Resolved `MissingGreenlet` exception in `mark_fine_paid` (`fines.py`) caused by expired lazy relationships after `db.commit()`.
- Verified: Expanded unit test coverage across 22 passing test suites: `checkins.py` (87%), `fines.py` (86%), `calendar.py` (90%), achieving 80% overall backend statement coverage.
- Verified: Conducted manual real-world walkthrough with 3 test accounts on live FastAPI server, confirming streak, freeze, and fine behavior per `docs/reading-club-full-plan.md §7`.

### Session — August 9, 2026 (Audit & Cleanup)

- Done: Removed stray `files.zip` and `mnt/` directory from repository.
- Done: Added `*.zip` to `.gitignore`.
- Done: Investigated `.agents` (plural) vs `.agent` (singular): confirmed `.agents` is an NT junction to `.agent` and serves as Antigravity's active Workspace Customizations Root.
- Verified: Ran full backend test suite (`pytest`) — 12 test suites passing (70% overall statement coverage). Corrected inaccurate "100% test coverage" claims in docs.
- Verified: Ran Vite frontend build (`npm run build`) — succeeded with 0 errors.
- Fixed: Resolved `daily_close` non-idempotency (prevented duplicate fines/freezes when job runs multiple times for same date).
- Fixed: Added grace period checking in `log_checkin` to properly attribute after-midnight checkins within grace window to yesterday with `is_late=True`.
- Fixed: Documented `discussions` and `discussion_replies` tables and API endpoints in `reading-club-full-plan.md`.
- Fixed: Consolidated `state.md` to single "Open items" and single "Session log" section in reverse-chronological order.

### Session — August 8, 2026 (Part 3)
- Done: Built Phase 1 ORM models (`User`, `Group`, `GroupMember`, `Checkin`, `Streak`).
- Done: Created Alembic migration `2026_08_08_0001_phase1_tables.py`.
- Done: Built JWT authentication endpoints (`/auth/register`, `/auth/login`, `/auth/refresh`) and `get_current_user` dependency.
- Done: Built Group endpoints (`/groups`, `/groups/join`, `/groups/{id}`, `/groups/{id}/settings`).
- Done: Built Checkins & Streak service (`/checkins`, `/checkins/today`, `bump_streak_on_checkin`).
- Done: Built Commitment-rate Leaderboard endpoint (`/groups/{id}/leaderboard`).
- Done: Created automated TDD test suite (`test_auth.py`, `test_groups.py`, `test_checkins.py`).
- Done: Connected frontend React components (`Login.tsx`, `Register.tsx`, `Onboarding.tsx`, `Dashboard.tsx`) to live backend APIs via TanStack Query and Axios.
- Verified: `npm run build` completed in 3.24s with 0 errors.

### Session — August 8, 2026 (Part 2)
- Done: Reorganized all planning docs into `docs/` directory per `STRUCTURE.md`.
- Done: Created root `.gitignore`.
- Done: Built `backend/` scaffold (FastAPI, pydantic-settings `config.py`, `session.py`, `base.py`, `main.py`, `Dockerfile`, `alembic` setup, `pytest.ini`, and green unit test `tests/test_health.py`).
- Done: Built `frontend/` scaffold (React 18, Vite, TypeScript, Tailwind CSS, TanStack Query, Zustand, Axios client with auto refresh interceptor, pages `Login`, `Register`, `Onboarding`, `Dashboard`, and `ProtectedRoute`).
- Verified: `pytest` passed and `npm run build` completed successfully.

### Session — August 8, 2026 (Part 1)
- Done: reorganized all docs under `docs/` to match the documented repo structure.
- Done: investigated ECC ([affaan-m/ECC](https://github.com/affaan-m/ECC)) and its Antigravity integration (`.agent/` directory convention).
- Done: added `.agent/rules/project-reading-club.md` (condensed rules Antigravity auto-loads), since Antigravity doesn't read a root `AGENTS.md`.
- Done: updated `AGENTS.md` (§9) and `GOVERNANCE.md` (§4) to delegate planning/TDD/review/security to ECC's agents instead of duplicating them.

### Session — August 7, 2026
- Done: the full plan (`reading-club-full-plan.md`) with all 15 sections.
- Done: infrastructure decision (Supabase + Railway + Vercel) after discussing the options.
- Done: the five foundational docs.
- Done: renamed the project to "Reading Club" and translated all docs to English.
