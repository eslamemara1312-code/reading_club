# Bug Fixes

### 1. Login Button Emoji Removal
- **File:** Login / Auth page component
- **Action:** Remove `📖` emoji from the submit button label.
- **Change:** `"دخول النادي 📖"` ➔ `"دخول النادي"`

### 2. Fix Dropdown Z-Index / Stacking Context
- **File:** Header / Navbar component (Club switcher dropdown)
- **Issue:** The dropdown menu appears behind the main content layer.
- **Action:** Increase the `z-index` of the club selector dropdown container (or set `position: relative` / portal overlay) to ensure it renders above all page elements.

### 3. Header Responsiveness & Overflow Issue
- **File:** Header / Navbar component
- **Issue:** Header elements overflow horizontally, pushing the user profile avatar button off-screen on mobile devices.
- **Action:** Adjust layout spacing/padding, truncate long club names, and ensure all navbar items fit within the viewport width without horizontal scrolling.

### 4. Fix Card Overflow / Clipping Issue
- **File:** Books page component ("استكشف كتباً جديدة" section)
- **Issue:** The rightmost details card (containing PDF upload/file actions) is clipped and cut off at the bottom boundary of the parent container.
- **Action:** Adjust parent container height/padding or enable auto-layout wrapping so all card content renders fully visible without clipping.

### 5. Fix File Upload Modal / Card View Clipping
- **File:** Books page component (Local PDF file selector modal/card)
- **Issue:** Opening the local file picker ("فتح ملف محلي وحفظه") renders an expanded upload UI that gets cut off at the bottom of the section.
- **Action:** Ensure the card dynamically expands or opens in a modal/overlay, allowing full visibility of the "اختر ملف PDF من جهازك" upload dropzone without clipping.

### 6. Fix Back Button Click Handler in Reader
- **File:** Book Reader page / view component
- **Issue:** Clicking the back button (`العودة` / top navigation bar) is unresponsive and does not trigger navigation.
- **Action:** Attach the missing `onClick` handler or router navigation call (`router.back()` / `navigate(-1)`) to return the user to the previous screen.

### 7. Fix Badges Counter UI Alignment
- **File:** Achievements / Badges modal component ("معرض الأوسمة والإنجازات")
- **Issue:** The badge counter badge (`3 / 5`) has broken typography and alignment (slash wrapped vertically with numbers overlapping/misaligned).
- **Action:** Adjust CSS layout/flexbox properties on the counter container (`flex-direction: row`, `white-space: nowrap`, and proper vertical alignment) so it displays cleanly inline as `3/5` or `3 / 5`.
