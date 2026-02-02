

# Modern Calendar View for Trip Schedule

## Overview

Transform the Trip Schedule page with a visually stunning, modern calendar interface featuring interactive views, smooth animations, and an improved user experience. The design will incorporate contemporary UI patterns while maintaining the clean corporate aesthetic.

## Current State

- Basic Day/Week view toggle with simple card layout
- Week view shows 7-column grid with trip counts
- Day view shows TripCards in a vertical list
- Standard date picker in a popover
- Stats displayed in small cards at the top

## Proposed Modern Calendar Features

### 1. Full Month Calendar View

A new full month view with:
- Grid layout showing all days of the month
- Trip indicators as colored dots/pills on each day
- Click-to-select navigation to day view
- Current day highlighted
- Days with trips show visual density indicators

### 2. Enhanced Week View with Timeline

Replace the simple grid with a timeline-style view:
- Horizontal timeline header with hours
- Trips displayed as blocks on the timeline
- Color-coded by status (scheduled, in progress, completed)
- Hover cards showing trip details
- Drag-to-scroll for timeline navigation

### 3. Modern Navigation Header

- Sleek month/year navigation with smooth transitions
- Today button for quick navigation
- Animated view switcher (Day/Week/Month)
- Mini calendar dropdown for date jumping

### 4. Trip Preview Cards

- Hover-triggered preview popups on calendar events
- Smooth scale-in animations
- Quick action buttons visible on hover
- Visual trip route indicator

### 5. Visual Enhancements

- Gradient backgrounds for selected dates
- Status-based color coding throughout
- Subtle shadows and depth
- Smooth transitions between views
- Loading skeletons with shimmer effect

## Implementation Plan

### Phase 1: New Month View Component

Create `src/components/trips/MonthView.tsx`:

```text
+--------------------------------------------------+
|  < February 2026 >         [Day][Week][Month]    |
+--------------------------------------------------+
| Mon | Tue | Wed | Thu | Fri | Sat | Sun          |
+-----+-----+-----+-----+-----+-----+-----+--------+
|  26 |  27 |  28 |  29 |  30 |  31 |  1  |        |
|     |     |     |     |  ** |     |     |        |
+-----+-----+-----+-----+-----+-----+-----+--------+
|  2  |  3  |  4  |  5  |  6  |  7  |  8  |        |
| *** | **  |     |  *  |     |     |     |        |
+-----+-----+-----+-----+-----+-----+-----+--------+
|  9  | 10  | 11  | 12  | 13  | 14  | 15  |        |
|     |  *  |     |     | *** |     |     |        |
+-----+-----+-----+-----+-----+-----+-----+--------+
|     ... more rows ...                            |
+--------------------------------------------------+
* = trip indicator (colored by status)
```

### Phase 2: Enhanced Week Timeline View

Update `src/components/trips/WeekView.tsx`:

```text
+--------------------------------------------------+
| Time  | Mon 2  | Tue 3  | Wed 4  | Thu 5  | ...  |
+-------+--------+--------+--------+--------+------+
| 06:00 |        |        |        |        |      |
+-------+--------+--------+--------+--------+------+
| 08:00 | [Trip] |        |        | [Trip] |      |
|       | 09:00  |        |        | 08:30  |      |
+-------+--------+--------+--------+--------+------+
| 10:00 |        | [Trip] |        |        |      |
|       |        | 10:30  |        |        |      |
+-------+--------+--------+--------+--------+------+
| 12:00 |        |        | [Trip] |        |      |
|       |        |        | 12:00  |        |      |
+-------+--------+--------+--------+--------+------+
```

### Phase 3: Modern Navigation Component

Create `src/components/trips/CalendarNavigation.tsx`:

- Sleek header with month/year display
- Animated chevron buttons for navigation
- View mode tabs with pill-style indicator
- "Today" quick action button
- Mini calendar popup for date jumping

### Phase 4: Trip Preview Hover Card

Create `src/components/trips/TripPreviewCard.tsx`:

- Uses HoverCard component for smooth popup
- Shows trip summary, route, and status
- Quick action buttons for start/complete
- Animated entrance with scale-in effect

### Phase 5: Update Main TripSchedule Page

Integrate all components with:
- View mode state (day/week/month)
- Smooth transitions between views
- Unified filtering across all views
- Mobile-responsive layout adjustments

## New Hooks

### useMonthSchedule

Fetch trip counts for entire month to populate calendar dots:

```typescript
export function useMonthSchedule(month: Date) {
  // Returns: { [date: string]: { count: number; hasInProgress: boolean; hasCompleted: boolean } }
}
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/trips/MonthView.tsx` | Create | Full month calendar grid |
| `src/components/trips/CalendarNavigation.tsx` | Create | Modern navigation header |
| `src/components/trips/TripPreviewCard.tsx` | Create | Hover preview for trips |
| `src/components/trips/WeekView.tsx` | Update | Enhanced timeline layout |
| `src/hooks/useTripSchedule.ts` | Update | Add useMonthSchedule hook |
| `src/pages/TripSchedule.tsx` | Update | Integrate new components |
| `src/index.css` | Update | Add calendar-specific animations |

## Technical Details

### Month View Data Structure

```typescript
interface MonthDay {
  date: string;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  trips: {
    total: number;
    scheduled: number;
    inProgress: number;
    completed: number;
  };
}
```

### View Transition Animation

```css
.calendar-view-enter {
  opacity: 0;
  transform: translateX(20px);
}
.calendar-view-enter-active {
  opacity: 1;
  transform: translateX(0);
  transition: all 0.3s ease-out;
}
```

### Status Color Palette

| Status | Color | CSS Variable |
|--------|-------|--------------|
| Scheduled | Blue | `--info` |
| Dispatched | Amber | `--warning` |
| In Progress | Purple | `--primary` |
| Completed | Green | `--success` |

### Month Calendar Dot Indicators

```tsx
// Dots under each day number
<div className="flex gap-0.5 justify-center mt-1">
  {trips.scheduled > 0 && <div className="w-1.5 h-1.5 rounded-full bg-info" />}
  {trips.inProgress > 0 && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
  {trips.completed > 0 && <div className="w-1.5 h-1.5 rounded-full bg-success" />}
</div>
```

## Mobile Responsiveness

- Month view: Full width, compact day cells
- Week view: Scrollable horizontally on small screens
- Day view: Card-based layout maintained
- Navigation: Simplified controls on mobile
- View switcher: Icon-only on small screens

## Accessibility

- Keyboard navigation for date selection
- ARIA labels for calendar cells
- Focus indicators on interactive elements
- Screen reader announcements for date changes

