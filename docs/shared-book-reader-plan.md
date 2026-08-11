# Shared In-App Book Reader Plan

## 1. Purpose

Add an in-app reader to Reading Club so every active member of a group can open shared books from the group library without leaving the application.

The first release will support PDF files. It will also let a user open a PDF from their own device locally, without uploading it or sharing it with the group. EPUB support, annotations, and other reading features are deliberately deferred until the PDF workflow is stable.

This document is an implementation plan only. It does not introduce database migrations, API endpoints, storage buckets, or code by itself.

## 2. Confirmed Product Decisions

| Area | Decision |
| --- | --- |
| Shared audience | Every active member of the book's group can read a shared file. |
| Upload permission | Any active member of that group can upload, replace, or remove a shared file. |
| Eligible books | Any book in the group library can have a readable shared file; it does not need to be the active reading-plan book. |
| Initial file format | PDF only. |
| Maximum file size | 50 MB per uploaded file. |
| Local files | A user can open a PDF from their own device. It is never uploaded, shared, or stored by the backend. |
| Reading progress | Persisted separately for each user, group, and shared book. |
| Storage design | Private object storage. The frontend accesses it only through backend-authorized, short-lived reader URLs. |
| Downloads | The initial UI is reader-focused and will not provide a download button. This reduces casual redistribution but cannot make a browser-delivered PDF impossible to copy. |

## 3. Scope

### In scope for version 1

- Uploading one PDF file for a group-library book.
- Replacing or removing that file by an active group member.
- Opening the shared PDF in a dedicated, responsive in-app reader.
- Opening a local PDF temporarily inside the same reader experience.
- Saving and restoring the last read page for shared files.
- Basic controls: next/previous page, page number input, zoom, fit-to-width, full screen, and a dark reader shell.
- Strict authorization, file validation, and audit-friendly metadata.

### Explicitly out of scope for version 1

- EPUB, MOBI, DOCX, comics, or scanned-image optimization.
- Multiple editions or multiple PDFs for the same book and group.
- Per-page comments, highlights, notes, quotes, or collaborative annotations.
- Download links, offline caching of shared files, or DRM claims.
- Importing a file from arbitrary public URLs.
- Synchronizing progress from local-only files to the server.

## 4. User Experience

### 4.1 Library states

Each group-library book card should expose a clear reading state:

| State | Active member sees |
| --- | --- |
| No shared file | `Upload PDF` and `Open local PDF` actions. |
| Shared PDF is available | `Start reading` or `Continue from page N`, plus `Open local PDF`. |
| File is being uploaded | Progress feedback and disabled duplicate actions. |
| File is unavailable or was deleted | A clear message, without exposing stale reader URLs. |

Because all active members have the same permission, the member who uploaded a file is recorded for transparency, but uploads are not owner-only.

### 4.2 Upload flow

1. A member selects `Upload PDF` from a book card or the book details view.
2. The application presents a native file picker restricted to `.pdf` / `application/pdf`.
3. Before uploading, the UI validates that a file exists and is no larger than 50 MB.
4. The backend repeats all validation and verifies that the requester is an active member of the group.
5. The user sees upload progress, then a success message that the book is now available to the group.
6. If a file already exists for that book and group, the UI asks for confirmation before replacing it.

### 4.3 Reader flow for shared files

1. The user selects `Start reading` or `Continue reading`.
2. The frontend requests reader metadata from the backend.
3. After authorization, the backend provides a short-lived URL or protected streaming response for the PDF.
4. A dedicated reader route loads the PDF and restores the user's last saved page.
5. The frontend saves progress after a page change using a debounced request, and once more when the reader is closed or hidden.
6. Returning to the library updates the action label to `Continue from page N`.

### 4.4 Local file flow

1. The user chooses `Open local PDF`.
2. The browser selects the file and creates an in-memory object URL.
3. The reader opens it without an API request or file upload.
4. Closing the reader revokes the object URL.

Local files remain private to the device and browser session. Their reading position is not included in the shared-progress database model in version 1.

## 5. Technical Architecture

```text
React library / reader
        |
        | authenticated API calls
        v
FastAPI authorization and file service
        |
        | server-side Storage API calls
        v
Private Supabase Storage bucket
        |
        v
PostgreSQL metadata and user reading progress
```

The frontend must not communicate directly with Supabase. FastAPI remains responsible for validating group membership, controlling upload operations, and granting temporary read access.

### 5.1 PDF viewer

Use a maintained PDF rendering library based on PDF.js, wrapped in a React component. The viewer must render pages on demand rather than loading every page at once. This is important for 50 MB files and lower-powered mobile devices.

The reader component should accept either:

- a protected, short-lived remote URL for a shared PDF; or
- a browser object URL for a local PDF.

It should expose callbacks for the current page, total page count, and load/error states so the page route can persist shared-file progress without coupling the renderer to the API layer.

### 5.2 Object storage

Create a private bucket dedicated to reader assets, for example `book-assets`.

Object keys should be server-generated and not derived directly from an uploaded filename. A suitable pattern is:

```text
groups/{group_id}/books/{book_id}/{asset_id}.pdf
```

The server should store the original filename only as display metadata. It should not depend on it for storage access or authorization.

### 5.3 File validation

Both client and server validate:

- File size is greater than zero and at most 50 MB.
- Declared MIME type is `application/pdf`.
- Filename extension is `.pdf` as a usability check only.
- File signature begins with the PDF magic bytes (`%PDF-`) on the server.

The backend must treat client-side validation as convenience, not security. It should reject empty, oversized, non-PDF, malformed, or unreadable files with a safe `400`/`422` error message.

### 5.4 Replacement behavior

Version 1 supports one shared asset per `(group_id, book_id)`.

When an active member replaces a file:

1. Upload the new object first.
2. Update the database reference in a transaction.
3. Delete the old object only after the database points to the new asset.
4. Reset affected reading progress because page numbers may no longer match.

This ordering avoids leaving a book with no readable file if an upload fails. The UI must make it clear that replacement resets every member's saved page.

## 6. Data Model

### 6.1 `book_assets`

Introduce a new table with one active shared asset for each group/book pair.

| Column | Type / rule | Purpose |
| --- | --- | --- |
| `id` | UUID/string primary key | Asset identifier. |
| `group_id` | FK to `groups`, required | Separates a group's shared file from any other group using the same catalog book. |
| `book_id` | FK to `books`, required | The library book represented by this asset. |
| `storage_key` | String, required, unique | Private object-storage location. |
| `original_filename` | String, required | Display/audit metadata only. |
| `mime_type` | String, required | Expected to be `application/pdf` in v1. |
| `file_size_bytes` | Integer, required | Validated to be `1..52,428,800`. |
| `uploaded_by_user_id` | FK to `users`, required | Shows who made the shared copy available. |
| `created_at` | timezone-aware datetime | Upload timestamp. |
| `updated_at` | timezone-aware datetime | Replacement timestamp. |

Add a unique constraint on `(group_id, book_id)` to enforce the one-file rule at the database layer.

### 6.2 `reading_progress`

Introduce a table for persisted shared-reader state.

| Column | Type / rule | Purpose |
| --- | --- | --- |
| `id` | UUID/string primary key | Progress identifier. |
| `user_id` | FK to `users`, required | Reader identity. |
| `group_id` | FK to `groups`, required | Ensures progress stays in the correct group context. |
| `book_id` | FK to `books`, required | Book being read. |
| `book_asset_id` | FK to `book_assets`, required | Makes replacement-reset behavior unambiguous. |
| `current_page` | Integer, minimum 1 | Last opened page. |
| `total_pages` | Integer, nullable initially | Filled after the viewer has loaded the PDF. |
| `progress_percent` | Numeric/integer, nullable | Optional display value derived from page counts. |
| `last_read_at` | timezone-aware datetime | Recent-reading sort/display value. |
| `created_at`, `updated_at` | timezone-aware datetimes | Standard audit fields. |

Add a unique constraint on `(user_id, book_asset_id)`. Do not store reading progress on the `books` table because it is user-specific and a catalog book may be used by multiple groups.

### 6.3 Migration requirements

The schema changes require a new Alembic migration. It must include:

- both new tables;
- all foreign keys and unique constraints;
- indexes for `book_assets(group_id, book_id)` and `reading_progress(user_id, book_asset_id)`;
- a reversible downgrade;
- no edits to previously applied migrations.

## 7. Backend Design

### 7.1 Service layer

Create a dedicated service module for book assets and reading progress. Route handlers should be limited to receiving requests, applying dependencies, and translating known errors to HTTP responses.

The service layer is responsible for:

- Checking that the group exists.
- Checking that the requester is an active group member.
- Checking that the target book is part of that group's library before an asset can be attached.
- Validating upload metadata and PDF bytes.
- Uploading, replacing, and removing private storage objects safely.
- Producing a limited-lifetime reader URL or protected stream only after authorization.
- Reading and upserting the current user's progress.

### 7.2 API contract

Proposed endpoints (exact paths and schemas must be added to `reading-club-full-plan.md` before implementation):

| Method and path | Authorization | Behavior |
| --- | --- | --- |
| `POST /groups/{group_id}/books/{book_id}/asset` | Active member | Uploads or replaces the group-shared PDF. Multipart request. |
| `GET /groups/{group_id}/books/{book_id}/asset` | Active member | Returns safe asset metadata and availability status, not an unrestricted public URL. |
| `GET /groups/{group_id}/books/{book_id}/reader-url` | Active member | Creates a very short-lived authorized read URL. |
| `DELETE /groups/{group_id}/books/{book_id}/asset` | Active member | Removes the shared asset and its related progress rows. |
| `GET /groups/{group_id}/books/{book_id}/progress` | Active member | Returns the caller's progress for the current asset or `null`. |
| `PUT /groups/{group_id}/books/{book_id}/progress` | Active member | Upserts the caller's current page and loaded page count. |

### 7.3 Error behavior

- `401`: no authenticated user.
- `403`: authenticated but not an active member of the group.
- `404`: group, library book, or shared asset does not exist in the requested context.
- `413`: file exceeds 50 MB.
- `415`: unsupported file type.
- `422`: invalid page number or invalid PDF contents.
- `409`: a replacement/deletion conflict when applicable.

Do not return storage credentials, bucket internals, or an indefinitely valid object URL in any response.

## 8. Frontend Design

### 8.1 Components and routes

Add these focused pieces:

- `BookAssetActions`: availability badge, upload, replace, remove, local-open, and reader-launch actions.
- `BookUploadDialog`: accessible file selection, validation, replacement confirmation, progress, and errors.
- `PdfReader`: reusable PDF renderer and control bar.
- `ReaderPage`: protected route that coordinates asset retrieval, progress restoration, and viewer state.

Suggested route:

```text
/groups/:groupId/books/:bookId/read
```

The existing library page remains the place to discover books. It should navigate to the reader route rather than embedding a full PDF viewer inside each book card.

### 8.2 State management

- Server data (asset metadata and shared reading progress) uses TanStack Query through the existing API layer.
- File picker state, upload progress, zoom, fullscreen mode, and the current local object URL stay as component/UI state.
- Local browser object URLs are always revoked when the reader is unmounted or another local file replaces them.

### 8.3 Accessibility and responsive behavior

- Use semantic buttons with Arabic labels and accessible names for every icon-only control.
- Keep keyboard operation for next/previous page and focus management for the upload dialog.
- Make the reader usable on phones: single-page view, fit-to-width default, large touch targets, and a collapsible toolbar.
- Respect the existing theme system; a dark reader shell should not make PDF content unreadable.

## 9. Security and Privacy

- Keep the storage bucket private.
- Validate authentication and active group membership on every asset and progress endpoint.
- Do not accept a remote URL to fetch a book. This avoids SSRF, untrusted downloads, and unclear copyright provenance.
- Apply server-side maximum request/body size appropriate for a 50 MB upload, plus a small multipart overhead allowance.
- Generate safe storage keys; never use raw filenames as paths.
- Do not trust browser-provided MIME types or file extensions.
- Rate-limit uploads if abuse becomes a concern.
- Log security-relevant events without logging file contents: upload, replacement, deletion, and authorization failures.
- Ensure cache-control headers and reader URL expiry do not leave private PDFs broadly cacheable.

Browser rendering cannot completely prevent a permitted reader from saving, copying, or screen-capturing a PDF. The product must not describe this feature as DRM.

## 10. Testing Plan

### Backend automated tests

- Active member can upload a valid PDF smaller than or equal to 50 MB.
- Unauthenticated and non-member users are rejected.
- A book that is not in the group library cannot receive an asset.
- Empty, oversized, incorrect MIME, incorrect signature, and malformed file cases are rejected.
- Uploading a second file replaces the existing asset without leaving orphaned metadata.
- Replacing an asset resets progress linked to the prior asset.
- Asset metadata and reader URL are visible only to active members.
- Deleting an asset removes/invalidates related reading progress and storage metadata.
- A member can create and update only their own progress record.
- Invalid page values are rejected.

### Frontend tests

- Library cards display the correct action for asset-present and asset-absent states.
- Upload dialog blocks files larger than 50 MB before sending the request.
- Reader restores the saved page for a shared file.
- Page changes are debounced before progress is persisted.
- A local file uses an object URL and never calls a shared-asset upload endpoint.
- Error states are understandable and do not leave the UI stuck in loading mode.

### Manual acceptance checks

1. Member A uploads a valid PDF for a non-active library book.
2. Member B in the same group opens it, reads several pages, exits, and resumes at the saved page.
3. Member C in a different group cannot inspect its metadata or open it.
4. Member B replaces the file after confirmation; prior positions are reset.
5. A user opens a local PDF and confirms it is not visible to other members.
6. An oversized or renamed non-PDF file is rejected.
7. Reader controls work on desktop and a narrow mobile viewport.

## 11. Delivery Sequence

1. Approve this plan and update the canonical product/API documentation with the selected endpoint and schema names.
2. Provision the private storage bucket and configure backend-only storage credentials as deployment secrets.
3. Implement the migration, models, schemas, and storage/progress service.
4. Implement the protected API endpoints and backend tests.
5. Add the frontend API client and TanStack Query hooks.
6. Build the upload UI and library-card availability state.
7. Build the dedicated PDF reader page with progress restoration and saving.
8. Add local PDF opening.
9. Perform security review, manual acceptance tests, and responsive QA.
10. Deploy first to development, validate object-storage lifecycle behavior, then promote through the normal pull-request workflow.

## 12. Future Enhancements

- EPUB support using a separate renderer and location-based (CFI) progress, rather than PDF page numbers.
- Multiple editions/assets per group book.
- Reader bookmarks, highlights, notes, and quotes.
- Links from a discussion post to a page or selected excerpt.
- Recently read shelf and group-level reading activity.
- Optional offline caching with explicit storage limits and revocation behavior.

