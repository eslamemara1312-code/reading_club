# Reading Club — Visual Redesign Implementation Handoff

**Status:** Approved plan. No redesign source code has been changed yet.

**Executor:** Gemini 3.6 Flash (High)
**Reviewer:** Codex
**Scope:** Frontend visual redesign only.

---

## 1. Approved product decisions

- Build a high-fidelity Arabic reading-product experience from the supplied visual references.
- Support both **dark** and **light** themes with one UI tree, one theme toggle, and persistent user choice.
- Use reference **#4** as the main dark visual direction: deep charcoal surfaces, cyan primary actions, large book art, soft borders, and generous rounded panels.
- Use reference **#3** for the wide desktop dashboard: central active-book content, colorful metric cards, and an activity rail.
- Use reference **#1** for compact mobile navigation and mobile reading-progress density.
- Use reference **#2** for bookshelf/search/rail interaction patterns.
- Keep all app content Arabic and RTL. Reference layouts are LTR, so layout must be mirrored logically for Arabic.
- Do not copy third-party book covers, avatars, logos, names, or quotes from the reference images. Keep user/data-provided covers and use neutral fallbacks.

---

## 2. Definition of done

The redesign is complete only when all of the following are true:

1. Every existing page and modal renders in dark and light modes.
2. The theme toggle is accessible, changes all app surfaces, persists after reload, and has no white first-paint flash when dark is saved.
3. Desktop at wide widths uses a premium reading-app shell: navigation/profile rail on the RTL start side (right), main content center, contextual activity rail on the left when useful.
4. Mobile uses a compact top bar and a fixed bottom navigation without horizontal overflow or covered content.
5. Existing React Query query keys, API calls, route paths, handlers, mutations, cache invalidation, and business behavior are unchanged.
6. No backend/API/database/authentication/schema/environment change is introduced.
7. `npm run build`, `npm run lint`, and `git diff --check` pass, unless an exact pre-existing unrelated failure is documented and approved.

---

## 3. Mandatory operating rules

Read these files in full before editing anything:

1. `docs/AGENTS.md`
2. `docs/state.md`
3. `docs/STRUCTURE.md`
4. This handoff document.

Then read each file to be changed in full. Do not treat this document as a replacement for the current source.

### Hard scope boundary

- Edit only `frontend/` files required for this redesign and update `docs/state.md` only after final reviewer approval.
- Do not edit `backend/`, Alembic, backend tests, API schemas, database models, deployment settings, or environment files.
- Do not add Supabase access, secrets, raw `fetch` in components, a different frontend framework, or a component library solely for styling.
- Keep React, TypeScript, Vite, Tailwind, Zustand, TanStack Query, Framer Motion, and Lucide.
- Do not mass-rewrite Arabic strings or change encodings. Some shell output renders Arabic incorrectly; inspect in the editor before deciding a string is corrupt.

### Protect existing uncommitted reader work

The working tree already contains reader/PDF work outside this task. Preserve it fully:

- `frontend/src/api/reader.ts`
- `frontend/src/components/reader/BookAssetActions.tsx`
- `frontend/src/components/reader/BookUploadModal.tsx`
- `frontend/src/components/reader/PdfReader.tsx`
- `frontend/src/pages/ReaderPage.tsx`
- Reader route in `frontend/src/App.tsx`
- Reader-related changes in `BookPage.tsx`, `3DBookCard.tsx`, `Toast.tsx`, `frontend/package.json`, and lockfile.

Style these pieces to match the new system, but never remove/reset/discard them. Before each phase run `git status --short` and do not stage or commit unrelated work.

### Execution rhythm

- Implement exactly one phase at a time.
- Run the phase checks.
- Stop at the review gate and provide evidence.
- Wait for reviewer response: **continue**, **revise**, or **stop**.
- If this plan conflicts with actual source, stop and report the conflict; do not guess.

---

## 4. Current application facts that must remain true

### Stack

- React 18 + TypeScript + Vite.
- Tailwind CSS 3 with `darkMode: 'class'`.
- Zustand for UI/auth state.
- TanStack Query for server state.
- Framer Motion and Lucide are available.
- `<html lang="ar" dir="rtl">` is already set.

### Theme implementation already exists

`frontend/src/store/uiStore.ts` already has `ThemeMode = 'dark' | 'light'`, `setTheme`, `toggleTheme`, and `initTheme`. It stores the selection at `localStorage.theme` and adds either `dark` or `light` to `<html>`.

Keep the public store API and storage key. Do not replace this with `next-themes` or another dependency.

The current UI uses `--apple-*` CSS variables and Tailwind classes such as `bg-apple-surface`. Migrate safely:

1. Create new semantic `--rc-*` tokens as the source of truth.
2. Temporarily map legacy `--apple-*` variables to `--rc-*` values.
3. Refactor pages incrementally to use new `reader-*` Tailwind colors.
4. Remove legacy aliases only after all usages are migrated and visually verified.

### Routes and behavior to retain

| Route | Page | Preserve |
|---|---|---|
| `/login` | `Login.tsx` | Login validation, mutation, redirect |
| `/register` | `Register.tsx` | Registration validation, mutation, redirect |
| `/onboarding` | `Onboarding.tsx` | Create/join group flows |
| `/dashboard` | `Dashboard.tsx` | Check-in, undo, add pages, badges, notifications, Wrapped, leaderboards |
| `/books` | `BookPage.tsx` | Catalog, reading plan, create/delete books, reader asset actions |
| `/groups/:groupId/books/:bookId/read` | `ReaderPage.tsx` | Reader and upload/read actions |
| `/calendar` | `CalendarPage.tsx` | Calendar query and month behavior |
| `/discussions` | `DiscussionPage.tsx` | Thread/reply mutations |
| `/vault` | `Vault.tsx` | Mark-paid and settle mutations |
| `/profile` | `ProfilePage.tsx` | Stats/badges/logout/settings link |
| `/settings` | `GroupSettingsPage.tsx` | Owner group-settings update |

Never remove/change a route path, query key, request payload, cache invalidation, or mutation just to simplify markup.

---

## 5. Responsive composition

| Width | Required shell behavior |
|---|---|
| 0–767px | One column, compact top bar, fixed mobile bottom nav, touch-scroll book rails, no desktop rails |
| 768–1199px | Top bar; one/two columns depending on space; move secondary activity below main content |
| 1200–1439px | Compact desktop shell with RTL navigation/profile rail; activity contextual/optional |
| 1440px+ | Full three-region dashboard: right navigation/profile rail, central main content, left activity rail |

Implementation measurements:

- Shell max width: `1536px`.
- Shell padding: `16px` mobile, `24px` medium, `32px` wide.
- Right rail: `248–272px`; desktop activity rail: `360–416px`.
- Main panel radius: `32px` wide desktop; `24px` tablet; `20–24px` mobile.
- Only use spacing scale: `4, 8, 12, 16, 24, 32, 48px`.
- Icon-only touch targets: at least `44×44px`.
- Book covers: 2:3 ratio, `object-cover`, stable fallback height.

Prefer logical alignment/direction (`start`, `end`, `ms`, `me`) instead of copying LTR `left`/`right` positions from the references.

---

## 6. Token design system

### Required files

Create `frontend/src/styles/tokens.css`, then import it near the top of `frontend/src/index.css`.

Layers in `tokens.css`:

1. Primitives: raw colors, radii, shadows, duration.
2. Semantic theme aliases: canvas, panel, surface, text, border, accent, status.
3. Component aliases: nav, cards, buttons, inputs, progress, reader.

Do not define tokens inside JSX files.

### Approved palette

```css
/* Primitive layer */
:root {
  --rc-ink-950: #0b1213;
  --rc-ink-925: #10191a;
  --rc-ink-900: #141f20;
  --rc-ink-850: #182526;
  --rc-ink-800: #1e2c2d;
  --rc-ink-700: #2a393a;
  --rc-white: #f7fbfa;
  --rc-slate-300: #b4c0be;
  --rc-slate-400: #899897;
  --rc-slate-600: #53605f;
  --rc-cyan-300: #79d2eb;
  --rc-cyan-400: #58bddb;
  --rc-cyan-500: #36a8cb;
  --rc-cyan-700: #1c7189;
  --rc-gold-400: #ffe46f;
  --rc-gold-500: #f5c94d;
  --rc-violet-400: #c19aff;
  --rc-lime-400: #aff06b;
  --rc-sky-400: #7ed2ef;
  --rc-coral-400: #ff9b70;
  --rc-red-400: #fa7e7e;
  --rc-green-400: #69d49a;
  --rc-radius-sm: 12px;
  --rc-radius-md: 18px;
  --rc-radius-lg: 24px;
  --rc-radius-xl: 32px;
  --rc-shadow-dark: 0 20px 52px rgb(0 0 0 / 0.28);
  --rc-shadow-light: 0 16px 40px rgb(26 49 50 / 0.12);
  --rc-duration-fast: 160ms;
  --rc-duration-normal: 240ms;
}

/* Dark is the default to prevent a white flash. */
:root,
html.dark {
  --rc-canvas: var(--rc-ink-950);
  --rc-canvas-elevated: #101a1b;
  --rc-panel: var(--rc-ink-925);
  --rc-surface: var(--rc-ink-900);
  --rc-surface-raised: var(--rc-ink-850);
  --rc-surface-hover: var(--rc-ink-800);
  --rc-text: var(--rc-white);
  --rc-text-muted: var(--rc-slate-300);
  --rc-text-subtle: var(--rc-slate-400);
  --rc-border: rgb(255 255 255 / 0.09);
  --rc-border-strong: rgb(121 210 235 / 0.34);
  --rc-accent: var(--rc-cyan-400);
  --rc-accent-hover: var(--rc-cyan-300);
  --rc-accent-foreground: #071416;
  --rc-accent-soft: rgb(88 189 219 / 0.14);
  --rc-focus: rgb(121 210 235 / 0.70);
  --rc-shadow: var(--rc-shadow-dark);
  --rc-reader-page: #eef1e9;
}

html.light {
  --rc-canvas: #edf3f2;
  --rc-canvas-elevated: #e6eeee;
  --rc-panel: #f8fbfa;
  --rc-surface: #ffffff;
  --rc-surface-raised: #f2f7f6;
  --rc-surface-hover: #e8f1f0;
  --rc-text: #102021;
  --rc-text-muted: #405352;
  --rc-text-subtle: #6c7d7b;
  --rc-border: rgb(16 32 33 / 0.11);
  --rc-border-strong: rgb(28 113 137 / 0.38);
  --rc-accent: var(--rc-cyan-700);
  --rc-accent-hover: #155d71;
  --rc-accent-foreground: #ffffff;
  --rc-accent-soft: rgb(28 113 137 / 0.10);
  --rc-focus: rgb(28 113 137 / 0.65);
  --rc-shadow: var(--rc-shadow-light);
  --rc-reader-page: #fffdf7;
}
```

### Tailwind contract

Extend `frontend/tailwind.config.js` with `reader` colors that point to semantic variables:

- `reader.canvas`, `reader.panel`, `reader.surface`, `reader.raised`, `reader.hover`
- `reader.text`, `reader.muted`, `reader.subtle`, `reader.border`, `reader.borderStrong`
- `reader.accent`, `reader.accentHover`, `reader.accentSoft`, `reader.focus`, `reader.readerPage`
- `reader.metric.gold`, `.coral`, `.violet`, `.lime`, `.sky`

Important: do not use Tailwind opacity modifiers on raw CSS variable colors (for example `bg-reader-accent/10`). Use explicit semantic tokens such as `reader.accentSoft`.

Keep current `apple`, `paper`, and `editorial` config mappings until final cleanup. Map old CSS variables to new semantic tokens in `index.css` so legacy pages remain functional during the migration.

### States

| Component | Default | Hover/focus | Disabled/loading |
|---|---|---|---|
| Primary button | accent background + accent foreground | accent hover + 3px focus ring | 55% opacity; only disable when real action is pending |
| Secondary button | raised surface + border | hover surface + focus ring | muted/unchanged geometry |
| Panel/card | surface/panel + border + radius | small pointer-only lift permitted | no lift required |
| Input | raised surface + border | strong border + focus ring | native semantics kept |
| Active nav | accent-soft + accent text + active marker | no layout jump | inactive remains readable |
| Progress | raised track + accent/metric fill | no semantic change | show visible value as well as color |

---

## 7. Planned reusable components

Create only when there is real reuse. Pages stay in `pages/`, presentational shared blocks go in `components/`.

| File | Action | Purpose |
|---|---|---|
| `src/styles/tokens.css` | Create | All three token layers |
| `src/components/layout/AppShell.tsx` | Create | Responsive shell/background/content slots |
| `src/components/layout/DesktopSidebar.tsx` | Create | RTL profile/navigation rail |
| `src/components/layout/MobileBottomNav.tsx` | Create | Accessible mobile navigation |
| `src/components/layout/ThemeToggle.tsx` | Create | Shared dark/light switch |
| `src/components/reading/BookCover.tsx` | Create | 2:3 cover with stable fallback/progress overlay |
| `src/components/reading/ReadingProgress.tsx` | Create | Accessible reusable progress display |
| `src/components/reading/MetricCard.tsx` | Create | Dashboard metric-card variants |
| `src/components/reading/SectionHeading.tsx` | Create | Title/action row |
| `src/components/Navbar.tsx` | Refactor | Retain its data/actions; compose the new shell/navigation |
| `src/index.css` | Refactor | Tokens import, global RTL/typography, compatibility aliases, utilities |
| `tailwind.config.js` | Refactor | Reader semantic colors/radii/shadows while retaining legacy aliases |
| `index.html` | Small edit | Apply theme class synchronously before Vite loads |
| `App.tsx` | Small edit | Root theme init; preserve routes/query/auth behavior |

Do not duplicate existing functionality. `ThreeDBookCard`, `CalendarGrid`, `NudgeButton`, `BadgesModal`, `NotificationCenterModal`, `WrappedModal`, `Toast`, and reader components must remain working.

---

## 8. Implementation phases and review gates

### Phase A — Baseline only

1. Run:

   ```powershell
   git status --short
   git diff --stat
   Set-Location C:\Users\es\Desktop\READING-CLUB\frontend
   npm run build
   npm run lint
   ```

2. Open each route if local auth/backend data are available; record access/data limits.
3. Capture baseline screenshots at 390×844 and 1440×900 if rendering is possible.
4. Do not edit source in this phase.

**Gate A:** report baseline results, screenshots or exact screenshot limitation, and planned Phase B file list.

### Phase B — Theme foundation

1. Create `tokens.css` using Section 6.
2. Refactor `index.css` to import tokens; preserve RTL, safe area, scrollbar, reduced-motion, book-cover and reader utilities.
3. Add temporary `--apple-*` aliases to `--rc-*` values so current UI does not break during migration.
4. Add `reader` token colors/radii/shadows to Tailwind config.
5. Add a minimal safe script in `index.html` `<head>` that reads `localStorage.theme`, defaults to `dark`, removes both classes, and applies one class before paint. It must make no request and read no secrets.
6. Initialize theme at `App.tsx` root so auth pages also follow it; remove navbar-only initialization only after root behavior is verified.
7. Keep `uiStore` API/storage key. Optionally update browser `theme-color` in `setTheme`.
8. Manually verify: dark → light → reload → dark → reload. Ensure `<html>` has only one theme class each time.

**Gate B acceptance:** every current page still renders; saved dark mode has no white flash; both current and new token classes work.

### Phase C — Shared shell and navigation

1. Build `AppShell`, `DesktopSidebar`, `MobileBottomNav`, and `ThemeToggle`.
2. Refactor `Navbar.tsx` visually, but preserve:
   - current group query/dropdown;
   - notification query/count and callback;
   - badge callback;
   - profile menu/settings/logout;
   - current `NavLink` route behavior.
3. Apply the shell to protected normal pages.
4. Create a focused reader-shell variant. Reader controls must never be hidden by a sidebar or fixed mobile bottom nav.
5. Desktop: right profile/navigation rail, central content, optional left activity rail.
6. Mobile bottom nav: Home, Books, Calendar, Club, Profile. Vault/settings remain available through profile/menu.
7. Account for `env(safe-area-inset-bottom)`.

**Gate C acceptance:** all links/actions work; no 320px horizontal overflow; no mobile footer on desktop; current group/profile/notification actions are intact.

### Phase D — Dashboard pilot

Touch `Dashboard.tsx` and shared components only as required. Preserve all current queries/hooks/mutations and all modal handlers.

Visual order:

1. Reader identity and XP strip.
2. Large active book (cover, title, author, progress, daily target, primary action).
3. Metric cards inspired by reference #3: progress, pages/time, level, streak, badges.
4. Check-in panel, easy to reach without scrolling past analytics.
5. Participation/leaderboard.
6. Weekly titles/activity as secondary dashboard rail/section.

Mobile must show current reading + daily check-in before secondary data. Wide desktop must visibly resemble reference #3's hierarchy, not a dark single-column list.

Use metric variants: gold, coral, violet, lime, sky. Keep the calm charcoal canvas behind them. Keep real empty/loading states; never invent API data.

**Gate D acceptance:** test check-in, undo, add pages, notifications, badges, Wrapped, and nudge actions. Capture both themes at 390×844 and 1440×900.

### Phase E — Books and reader

#### `/books`

- Preserve all group/catalog/plan queries and mutations, owner permissions, search autocomplete, book creation, deletion, and reader asset actions.
- Build active-book presentation, continue-reading rail, search/filter row, group shelf, catalog shelf, and status chips.
- Refactor `ThreeDBookCard` only as needed; preserve its props and asset actions.
- Make image load failure retain card dimensions.

#### Reader route

- Read all reader files before editing.
- Preserve `react-pdf`, `pdfjs-dist`, uploads and route parameters.
- Add accessible back/context controls and theme-aware panels.
- Keep a light document reading surface using `reader.readerPage` even in dark theme.
- Never cover PDF controls with fixed navigation.

**Gate E acceptance:** show `/books` at mobile/desktop in both themes plus a reader screenshot; list book/reader actions exercised.

### Phase F — Remaining pages and overlays

| Target | Visual requirement | Preserve |
|---|---|---|
| Calendar | Calendar card, labeled legend, readable states | same query/month behavior |
| Discussions | Activity-feed cards, composer, reply hierarchy | thread/reply mutations/invalidation |
| Vault | Clear paid/unpaid and owner actions; icon/text plus color | mark-paid/settle behavior |
| Profile | Identity, XP, badges, stats | existing queries/logout/settings nav |
| Settings | Grouped form areas, save feedback | settings mutation/permissions |
| Onboarding | Create/join guided cards | create/join flow |
| Login/Register | Focused auth surface and theme toggle | validation/mutations/redirects |
| Modals/Toasts | Theme, focus, z-index, safe area | existing stores/callbacks |

**Gate F acceptance:** every route/modal has both-theme styling and no broken interaction.

### Phase G — Cleanup and final verification

1. Search `frontend/src` for hard-coded hex values; replace UI colors with tokens. Document exceptional values only.
2. Search `apple-*` usage. Keep compatibility aliases until all usages are safely migrated.
3. Test keyboard navigation: theme toggle, nav, menus, dialogs, fields, submit buttons.
4. Verify visible focus, contrast, Arabic RTL, and reduced-motion.
5. Test widths: 320, 390, 768, 1024, 1280, 1440px plus 200% zoom on key pages.
6. Run:

   ```powershell
   Set-Location C:\Users\es\Desktop\READING-CLUB\frontend
   npm run build
   npm run lint
   Set-Location C:\Users\es\Desktop\READING-CLUB
   git diff --check
   git status --short
   ```

7. Only after reviewer approval, truthfully update `docs/state.md` with scope, actual tests, and limitations.

Do not commit or push unless the owner explicitly asks and unrelated working-tree changes are safe.

---

## 9. Global acceptance checklist

- [ ] Dark mode is deep charcoal/cyan, not the current warm brown/amber system.
- [ ] Light mode is cool paper/stone/cyan, not a simple inverted dark screen.
- [ ] Cyan is the primary action color; gold is reserved for reward/highlights.
- [ ] Canvas → panel → surface → raised-control hierarchy is clear.
- [ ] Progress bars show text values/percentages as well as color.
- [ ] Status colors are supported by text or icon.
- [ ] Arabic RTL text, menus, cards, arrows, and overlays are natural and not clipped.
- [ ] Book covers have stable 2:3 layout and failure fallbacks.
- [ ] Dashboard maps to references #3/#1; books map to #4/#2.
- [ ] Reader never gets fixed navigation over its controls.
- [ ] The theme default, toggle, persistence, and first paint work for auth and protected pages.
- [ ] No backend/API/data contract changes exist.

---

## 10. Failure modes to avoid

1. Rewriting hooks/mutations while moving UI. Extract presentational components and pass current values/handlers as props.
2. Deleting current reader/PDF implementation.
3. Duplicating complete page markup for dark/light themes.
4. Raw hex colors in JSX, which defeats theme switching.
5. Fake data filling empty API states.
6. Forcing every desktop route into three columns. Forms and reader pages need focused layouts.
7. Forgetting mobile overflow checks for long Arabic labels, fixed navigation, and horizontal book rails.
8. Making all dark panels black without subtle border/surface separation.
9. Delaying light-mode testing to the final phase.
10. Claiming visual fidelity without screenshots or an explicit reason screenshots were unavailable.

---

## 11. Required review handoff format

At every phase gate, send this report exactly:

````md
## Visual redesign — Phase <letter> complete

### Scope completed
- <changed files and why>

### Behavior preserved
- <routes/actions manually exercised>

### Verification
- `npm run build`: <pass/fail + exact summary>
- `npm run lint`: <pass/fail + exact summary>
- `git diff --check`: <pass/fail>
- Theme persistence: <steps + result>

### Visual evidence
- <absolute screenshot paths with viewport and theme>
- Or: screenshots unavailable because <specific limitation>

### Working-tree safety
```text
<exact git status --short output>
```

### Risks / decisions needed
- <real blockers/deviations only>
````

The reviewer responds only with: **continue**, **revise these exact items**, or **stop because of this conflict**.
