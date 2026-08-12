# Reading Club — PDF Reader 2.0 Implementation Plan

## 1. Objective

Replace the current basic PDF viewer with a modern, full-featured reading experience while preserving all existing business logic, API contracts, authentication, backend behavior, user data, and reading progress flows.

The goal is **not** to build a PDF engine from scratch.

The recommended approach is to use **EmbedPDF** as the rendering and interaction engine, while keeping Reading Club responsible for the product-specific reading experience, progress tracking, gamification, notes, bookmarks, and future AI features.

The final experience should feel like a native part of Reading Club rather than a generic embedded PDF viewer.

---

## 2. Current State

The existing reader is primarily implemented in:

```text
frontend/src/components/reader/PdfReader.tsx
```

It currently uses:

```text
react-pdf
pdfjs-dist
```

The current reader supports only a limited feature set:

- Single-page rendering
- Previous / Next navigation
- Direct page number input
- Zoom in / out
- Zoom reset
- Fullscreen mode

It does **not** currently provide:

- Continuous scrolling
- Thumbnails
- Search inside the PDF
- Table of contents / outline
- Bookmarks
- Highlights
- Notes
- Reading session tracking
- Advanced reading modes
- Reader-specific mobile UX
- Contextual AI tools

The current `ReaderPage.tsx` already separates much of the application logic from the PDF rendering component.

This is important because it allows the PDF engine to be replaced without redesigning the existing backend flow.

---

# 3. Target Architecture

## Current

```text
ReaderPage
    ↓
PdfReader
    ↓
react-pdf
    ↓
PDF.js
```

## Target

```text
ReaderPage
    ↓
ReadingViewer
    ↓
EmbedPDF
    ↓
EmbedPDF Runtime
```

Reading Club should remain responsible for:

- Authentication
- Group context
- Book context
- Reader URL retrieval
- Reading progress persistence
- Daily check-in
- Reading goals
- Reading sessions
- Bookmarks
- Notes
- Highlights
- Gamification
- Future AI features

EmbedPDF should be responsible for:

- PDF rendering
- Page navigation
- Zoom
- Search
- Thumbnails
- Text selection
- Outline
- Annotation interaction
- Viewport behavior
- Fullscreen
- PDF-level interaction

---

# 4. Migration Strategy

The migration should be incremental.

Do **not** remove the current `react-pdf` implementation immediately.

During the first migration phase:

```text
PdfReader.tsx
```

should remain available as a fallback.

After the new reader passes compatibility testing, remove:

```text
react-pdf
pdfjs-dist direct usage
PdfReader.tsx
```

This provides a safe rollback path during development.

---

# 5. Phase 1 — Reader Engine Migration

## Goal

Replace the existing PDF rendering engine without changing product behavior.

Create:

```text
frontend/src/components/reader/ReadingViewer.tsx
```

The new component should accept the same core information already managed by `ReaderPage`.

Example responsibilities:

```ts
type ReadingViewerProps = {
  fileUrl: string;
  initialPage?: number;
  onPageChange?: (page: number) => void;
  onDocumentLoad?: (totalPages: number) => void;
};
```

## Requirements

The following existing behavior must continue working:

- Open shared PDF books
- Open local PDF files
- Restore the last saved page
- Update progress when the user changes pages
- Display loading states
- Display errors
- Support fullscreen
- Preserve RTL compatibility
- Preserve Reading Club theme behavior
- Preserve existing reader routes

## Backend Changes

None required.

The current reader progress flow should remain intact.

Existing endpoints such as:

```text
GET reader URL
GET reading progress
PUT reading progress
```

should remain unchanged.

---

# 6. Phase 2 — Reader UX Upgrade

This phase should create the largest visible improvement.

## 6.1 Reading Layout

The reader should become a dedicated reading environment.

Desktop concept:

```text
┌─────────────────────────────────────────────────────────────┐
│ ← Library      Book Title           37%         ⛶      ⋮   │
├─────────────────┬───────────────────────────────────────────┤
│                 │                                           │
│ Pages           │                                           │
│ Contents        │                 PDF                       │
│ Bookmarks       │                                           │
│ Notes           │                                           │
│                 │                                           │
├─────────────────┴───────────────────────────────────────────┤
│ Page 83 / 240                    Progress: 37%               │
└─────────────────────────────────────────────────────────────┘
```

The sidebar should not remain permanently visible.

Use a compact panel with tabs:

```text
Pages
Contents
Bookmarks
Notes
```

---

## 6.2 Continuous Scrolling

Add continuous vertical scrolling.

Reader modes:

```text
Continuous
Single Page
```

Recommended default:

```text
Continuous
```

The current click-to-next-page interaction should no longer be the primary reading mode.

---

## 6.3 Page Thumbnails

Add a virtualized page thumbnail panel.

Requirements:

- Thumbnail preview
- Current page indication
- Click thumbnail to navigate
- Efficient rendering for large documents

---

## 6.4 PDF Search

Add document text search.

Keyboard shortcut:

```text
Ctrl + F
```

Search UI example:

```text
Search: "habits"

18 results

Page 34
"...daily habit formation..."

Page 61
"...habit stacking..."
```

Clicking a result should navigate directly to the matching page and text position.

---

## 6.5 Table of Contents / Outline

If the PDF provides an outline, expose it in the sidebar.

Example:

```text
Contents

1. Introduction
2. Identity
3. Systems
4. Environment
5. Advanced Tactics
```

Selecting an item should navigate to the corresponding page.

---

## 6.6 Zoom and Fit Modes

Support:

```text
Fit Width
Fit Page
100%
125%
150%
```

Recommended default:

```text
Fit Width
```

Especially on mobile devices.

---

## 6.7 Fullscreen / Zen Mode

The reader should support a distraction-free mode.

When active:

- Main application sidebar disappears
- Mobile bottom navigation disappears
- Reader occupies the entire viewport
- Toolbar becomes visually minimal
- Controls may fade while the user is reading
- Moving the mouse or tapping should restore controls

The document should become the visual focus.

---

# 7. Phase 3 — Reading Session Experience

The reader should track the reading session separately from permanent book progress.

## Frontend Session State

Example:

```ts
interface ReadingSession {
  startedAt: Date;
  startPage: number;
  currentPage: number;
  maxPageReached: number;
  pagesVisited: number[];
  activeSeconds: number;
}
```

## Track

- Session start time
- Starting page
- Current page
- Furthest page reached
- Pages visited
- Active reading duration

Do not simply calculate:

```text
end page - start page
```

because users may move backward through a book.

---

## Session Summary

When the user exits the reader, optionally display:

```text
Reading Session Complete

Pages read
13

Reading time
28 minutes

Book progress
19% → 25%
```

This information can initially remain client-side.

Backend persistence can be added later if analytics or historical reading sessions are required.

---

# 8. Phase 4 — Reading Club Integration

This is where the PDF reader becomes part of the Reading Club product.

---

## 8.1 Daily Check-In

Add a subtle daily check-in control inside the reader.

Example:

```text
Today
7 pages read

[ Complete today's reading ✓ ]
```

If already completed:

```text
✓ Today's reading is complete
🔥 12 day streak
```

Important rule:

**Do not automatically check the user in based on page activity.**

Reading Club is based on trust and daily commitment, not surveillance.

The user should still explicitly confirm their daily reading.

---

## 8.2 Daily Reading Target

If a group or user has a daily target:

```text
Daily Goal
7 / 10 pages

██████████████░░░░░
```

When completed:

```text
🎉 Daily goal completed
```

This should be motivating but not intrusive.

---

## 8.3 Book Progress

Display progress in the reader header.

Example:

```text
Atomic Habits

83 / 240
████████░░░░░░░░
34%
```

The existing backend progress model should continue to be the source of truth for permanent reading position.

---

# 9. Phase 5 — Bookmarks, Highlights, and Notes

This phase requires backend additions.

The PDF annotation engine may be provided by EmbedPDF, but Reading Club should store user-generated reading data in its own database.

Do not rely on modified PDF files as the primary storage format.

---

## 9.1 Bookmarks

Suggested table:

```text
reader_bookmarks

id
user_id
group_id
book_id
book_asset_id
page_number
created_at
```

Suggested endpoints:

```text
GET    /groups/{groupId}/books/{bookId}/bookmarks
POST   /groups/{groupId}/books/{bookId}/bookmarks
DELETE /groups/{groupId}/books/{bookId}/bookmarks/{bookmarkId}
```

---

## 9.2 Notes

Suggested table:

```text
reader_notes

id
user_id
group_id
book_id
book_asset_id
page_number
selected_text
note_text
position_data
created_at
updated_at
```

Suggested endpoints:

```text
GET    /groups/{groupId}/books/{bookId}/notes
POST   /groups/{groupId}/books/{bookId}/notes
PATCH  /groups/{groupId}/books/{bookId}/notes/{noteId}
DELETE /groups/{groupId}/books/{bookId}/notes/{noteId}
```

---

## 9.3 Highlights

Suggested table:

```text
reader_highlights

id
user_id
group_id
book_id
book_asset_id
page_number
selected_text
color
position_data
created_at
```

Suggested endpoints:

```text
GET    /groups/{groupId}/books/{bookId}/highlights
POST   /groups/{groupId}/books/{bookId}/highlights
PATCH  /groups/{groupId}/books/{bookId}/highlights/{highlightId}
DELETE /groups/{groupId}/books/{bookId}/highlights/{highlightId}
```

---

## Why Store Annotations in Reading Club?

This enables:

- Cross-device synchronization
- Persistent notes
- Persistent highlights
- Mobile / desktop continuity
- Future social reading features
- Future AI knowledge features
- Analytics
- Reliable user ownership of reading data

---

# 10. Phase 6 — AI Reading Assistant

AI should be added **after the core reading experience is complete**.

AI should remain contextual and optional.

When the user selects text:

```text
Highlight
Add Note
Explain
Summarize
Translate
Ask AI
```

Example interaction:

```text
Selected paragraph
        ↓
Explain
        ↓
Reading Assistant sidebar
```

Possible actions:

- Explain this paragraph
- Simplify
- Summarize
- Translate
- Give an example
- Ask a question about the selected text

The AI interface should appear as a lightweight side panel or bottom sheet.

Do not turn the entire reader into a chatbot interface.

The book must remain the primary focus.

---

# 11. Mobile UX

Mobile behavior should not be a smaller version of the desktop UI.

Recommended mobile layout:

```text
Book Title

PDF Content

────────────

Page 83 / 240
```

Tools should open as a bottom sheet:

```text
Search
Pages
Contents
Bookmark
Notes
Display
```

Recommended mobile interactions:

- Vertical reading by default
- Swipe navigation in Single Page mode
- Fit Width by default
- Large touch targets
- Minimal persistent controls
- Bottom sheet tools
- Fullscreen reading mode

---

# 12. Keyboard Shortcuts

Recommended desktop shortcuts:

```text
← / →       Previous / Next page
PageUp      Previous page
PageDown    Next page
+           Zoom in
-           Zoom out
0           Fit page
W           Fit width
F           Fullscreen
B           Bookmark
N           Add note
Ctrl + F    Search
Esc         Close active panel
```

---

# 13. Proposed Frontend Structure

Recommended structure:

```text
frontend/
└── src/
    ├── pages/
    │   └── ReaderPage.tsx
    │
    ├── components/
    │   └── reader/
    │       ├── PdfReader.tsx
    │       ├── ReadingViewer.tsx
    │       ├── ReaderToolbar.tsx
    │       ├── ReaderSidebar.tsx
    │       ├── ReaderBottomBar.tsx
    │       ├── ReaderSearch.tsx
    │       ├── ReaderProgress.tsx
    │       ├── ReaderSession.tsx
    │       ├── ReaderBookmarks.tsx
    │       ├── ReaderNotes.tsx
    │       └── ReaderHighlights.tsx
    │
    └── api/
        └── reader.ts
```

During migration:

```text
PdfReader.tsx
```

should remain temporarily.

After the new implementation passes testing, it can be removed.

---

# 14. Local PDF Handling

Reading Club currently supports local files differently from shared books.

This behavior should remain.

For local PDFs:

- Do not upload the file automatically
- Do not sync notes by default
- Do not sync highlights by default
- Do not send the PDF to Reading Club servers
- Allow normal reader functionality

Display a clear privacy indicator:

```text
🔒 Local file
This file is not uploaded to Reading Club.
```

Optional future enhancement:

Use IndexedDB to persist:

- Last page
- Local bookmarks
- Local notes
- Reader preferences

without uploading the document.

---

# 15. Features That Should NOT Be Prioritized Initially

Do not start with:

- OCR
- PDF editing
- Digital signatures
- Drawing tools
- Modified PDF export
- Collaborative annotations
- Shared highlights
- Complex AI workflows

These features can increase complexity without directly supporting the core Reading Club goal.

The product goal is:

> Read every day.

Not:

> Build Adobe Acrobat.

---

# 16. Recommended Pull Request Sequence

## PR 1 — Reader Engine Migration

Scope:

```text
EmbedPDF integration
Continuous viewer
Page navigation
Zoom
Fullscreen
Current progress compatibility
Shared PDFs
Local PDFs
Error handling
```

No database changes.

---

## PR 2 — Reader UX

Scope:

```text
Thumbnails
Search
Outline / Table of Contents
Fit Width
Fit Page
Responsive mobile controls
Keyboard shortcuts
Zen reading mode
Reader sidebar
Reader toolbar
```

No major backend changes.

---

## PR 3 — Reading Experience

Scope:

```text
Reading session tracking
Active reading timer
Pages read
Daily goal
Book progress indicator
Session summary
Daily check-in integration
```

Prefer minimal backend additions unless historical session data is required.

---

## PR 4 — Knowledge Layer

Scope:

```text
Bookmarks
Highlights
Notes
Database migrations
API endpoints
Cloud synchronization
Cross-device persistence
```

---

## PR 5 — AI Reading Assistant

Scope:

```text
Selected-text actions
Explain
Summarize
Translate
Ask AI
Contextual assistant panel
```

Only after the reader experience is stable.

---

# 17. Database and Migration Rules

Any new persistence layer must use proper database migrations.

Do not manually modify production tables.

Add migrations for:

```text
reader_bookmarks
reader_notes
reader_highlights
```

Potential future table:

```text
reading_sessions
```

only if historical session analytics becomes a product requirement.

---

# 18. Testing Checklist

## Reader Compatibility

- [ ] Shared books open correctly
- [ ] Local PDFs open correctly
- [ ] Last page restores correctly
- [ ] Progress updates correctly
- [ ] Reader URL expiration is handled
- [ ] Large PDFs remain usable
- [ ] Corrupted PDFs show a proper error state
- [ ] Password-protected PDFs fail gracefully

## Navigation

- [ ] Continuous scroll works
- [ ] Single page mode works
- [ ] Thumbnails navigate correctly
- [ ] Outline navigation works
- [ ] Search navigation works
- [ ] Direct page navigation works

## Responsive UX

- [ ] Desktop layout
- [ ] Tablet layout
- [x] Mobile portrait
- [ ] Mobile landscape
- [x] Touch interactions
- [x] Bottom sheet controls

## Progress

- [ ] Current page is saved
- [ ] Total pages are detected
- [ ] Progress percentage is accurate
- [ ] Session tracking does not corrupt permanent progress
- [ ] Returning to the book resumes correctly

## Accessibility

- [ ] Keyboard navigation
- [ ] Visible focus states
- [ ] ARIA labels on icon buttons
- [ ] Reduced motion support
- [ ] Appropriate touch target sizes

## Performance

- [ ] Large documents use virtualization
- [ ] Thumbnails are lazy loaded
- [ ] Search does not block the UI
- [ ] Reader does not rerender the entire document unnecessarily
- [ ] Memory usage remains acceptable

---

# 19. Product Design Principles

The new reader should follow these principles.

## The Book Is the Hero

The PDF should occupy most of the screen.

UI controls should be secondary.

---

## Progressive Disclosure

Do not show every tool permanently.

Tools should appear only when needed.

---

## Calm Gamification

Reading streaks, goals, and progress should motivate the user without distracting from reading.

---

## Reading First

Every feature should answer:

> Does this make it easier to read consistently?

If not, it is probably not a priority.

---

## Native Reading Club Experience

Do not ship the default EmbedPDF interface unchanged.

Use EmbedPDF as the engine and build Reading Club's own design system around it.

---

# 20. Recommended Final Experience

Current flow:

```text
Open PDF
→ Click next page
→ Zoom
→ Close
```

Target flow:

```text
Open book
→ Resume from page 83
→ Read using continuous scrolling
→ Search when needed
→ Highlight useful passages
→ Add notes
→ Track daily progress
→ Complete daily check-in
→ View session summary
→ Return tomorrow exactly where you stopped
```

The PDF reader should become one of the core experiences of Reading Club rather than a utility embedded inside the application.

---

# 21. Recommended Starting Point

Begin with:

```text
PR 1 — Reader Engine Migration
PR 2 — Reader UX
```

Do not begin with notes, highlights, AI, or database changes.

The first milestone should be:

> Replace the current basic viewer with a polished, fast, responsive, full-featured reader while preserving all existing Reading Club behavior.

Once the new reader is stable and feels correct, continue with:

```text
PR 3 — Reading Experience
PR 4 — Knowledge Layer
PR 5 — AI Assistant
```

This keeps the implementation low-risk, incremental, and easy to validate.
