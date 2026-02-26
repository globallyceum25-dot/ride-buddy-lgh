
# Mobile Responsive Overhaul

## Overview
The app has a solid desktop layout with a responsive sidebar (hamburger menu on mobile), but data-heavy pages use wide HTML tables and horizontal layouts that break on small screens. The best approach is to introduce **mobile card layouts** as an alternative to tables, and fix specific overflow/layout issues across all pages.

## Strategy
Rather than just adding `overflow-x-auto` (which forces horizontal scrolling -- poor UX), we will render **stacked card views on mobile** and keep tables on desktop. This uses the existing `useIsMobile()` hook to conditionally render the appropriate layout.

## Changes by File

### 1. Create a reusable `MobileCardList` pattern component
**New file:** `src/components/shared/ResponsiveTable.tsx`

A wrapper that accepts both a table and a mobile card renderer. On desktop (>=768px) it shows the table; on mobile it renders a vertical card list. This avoids duplicating the conditional logic in every page.

### 2. Requests page (`src/pages/Requests.tsx`)
- Replace the raw `<Table>` with the responsive pattern
- Mobile card: shows request number, status badge, route, date, and an actions button
- Each card is a compact vertical layout with key info

### 3. Approvals page (`src/pages/Approvals.tsx`)
- Same pattern for the three tabs (pending/approved/rejected)
- Mobile cards show requester, request number, route, priority, and Review/View button

### 4. Allocations page (`src/pages/Allocations.tsx`)
- **Pending Allocation table**: mobile card layout with assign/reschedule/close actions
- **Kanban Board**: on mobile, switch from horizontal scroll `flex` columns to a **vertical stacked accordion** -- each status column becomes a collapsible section so users can tap to expand
- **Table view**: responsive card layout

### 5. Vehicles page (`src/pages/Vehicles.tsx`)
- Mobile card with registration number, vehicle name, status badge, location, and action menu

### 6. Drivers page (`src/pages/Drivers.tsx`)
- Mobile card with driver name, license info, status, location, and action menu

### 7. Users page (`src/pages/Users.tsx`)
- Mobile card with name, email, role badges, status, and action menu
- Wrap the table in `overflow-x-auto` as a fallback

### 8. Locations page (`src/pages/Locations.tsx`)
- Mobile card with location name, code, city, status, and action menu

### 9. Reports page (`src/pages/Reports.tsx`)
- Make the TabsList scrollable on mobile (already `grid-cols-4` which is tight)
- Report sub-components likely have their own tables -- add `overflow-x-auto` wrappers

### 10. Settings page (`src/pages/Settings.tsx`)
- The `TabsList` with 6 tabs needs horizontal scroll on mobile -- add `overflow-x-auto` and `w-full` with `flex-nowrap` instead of `flex-wrap`

### 11. Kanban Board mobile view (`src/components/allocations/KanbanBoard.tsx`)
- Replace horizontal column layout with vertical collapsible sections using the existing `Collapsible` component
- Each column header shows title + count badge, tapping expands to show cards
- Drag-and-drop is disabled on mobile (poor touch UX) -- instead, use action buttons on each card

### 12. Trip Schedule calendar views
- `DetailedCalendarView.tsx` already uses `useIsMobile()` with a Sheet -- verify it works well
- `WeekTimelineView.tsx`: on mobile, switch from 7-column grid to a scrollable day-by-day list

## Technical Approach

- Use the existing `useIsMobile()` hook throughout
- Create a simple `MobileCard` component pattern (not a full abstraction -- just a consistent styling approach)
- Mobile cards use: `Card` with padding, flex layout, key-value pairs stacked vertically
- Action menus remain as `DropdownMenu` (already mobile-friendly)
- All changes are purely presentational -- no data/hook changes needed

## Implementation Order
1. Requests + Approvals (most used by staff/approvers on phones)
2. Allocations page (Kanban + tables)
3. Vehicles, Drivers, Users, Locations (similar pattern)
4. Settings + Reports (minor fixes)
5. Trip Schedule refinements
