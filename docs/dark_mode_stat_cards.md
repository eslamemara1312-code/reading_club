### 8. Dark Mode Styling for Dashboard Stat Cards
- **File:** Dashboard / Home stat cards component
- **Issue:** Bright full-color card backgrounds look good in light mode but are overly bright/harsh in dark mode.
- **Action (Dark Mode Only):**
  - **Background:** Change card bg to dark slate `#1E293B` (keep light mode colors untouched).
  - **Accent Border:** Add a top or side accent border (2px-3px) matching the card's original color (yellow, orange, green, purple, blue).
  - **Icon Badge:** Set icon wrapper background to original card color with `opacity: 0.15` / `15%`.
  - **Typography:** Set title, values, and secondary text to light/white (`#F1F5F9`) for high contrast.
