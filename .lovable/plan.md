
# Add Keyboard Navigation to Calendar Grid

## Overview

Implement arrow key navigation for the calendar grid to improve accessibility. Users will be able to navigate between days using keyboard arrow keys, making the calendar fully accessible for keyboard-only users.

## Current State

- Calendar day cells are `<button>` elements with proper focus styles
- No keyboard navigation between cells - only Tab key works (tabs through all cells sequentially)
- Users must click or Tab through many cells to navigate

## Proposed Solution

Add roving tabindex pattern with arrow key navigation:
- **Left Arrow**: Move to previous day
- **Right Arrow**: Move to next day  
- **Up Arrow**: Move to same day in previous week
- **Down Arrow**: Move to same day in next week
- **Home**: Move to start of week
- **End**: Move to end of week
- **Enter/Space**: Select the focused day

## Technical Implementation

### Roving Tabindex Pattern

Only the currently focused day will have `tabIndex={0}`, all others will have `tabIndex={-1}`. This allows users to Tab into the grid once, then use arrow keys to navigate within.

```typescript
// Track focused index within the grid
const [focusedIndex, setFocusedIndex] = useState<number>(() => {
  // Initialize to selected date's index in calendarDays
  return calendarDays.findIndex(d => isSameDay(d, selectedDate));
});

// Refs for each day cell to manage focus
const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);
```

### Keyboard Handler

```typescript
const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
  let newIndex = index;
  const totalDays = calendarDays.length;
  
  switch (e.key) {
    case 'ArrowLeft':
      e.preventDefault();
      newIndex = index > 0 ? index - 1 : index;
      break;
    case 'ArrowRight':
      e.preventDefault();
      newIndex = index < totalDays - 1 ? index + 1 : index;
      break;
    case 'ArrowUp':
      e.preventDefault();
      newIndex = index >= 7 ? index - 7 : index;
      break;
    case 'ArrowDown':
      e.preventDefault();
      newIndex = index + 7 < totalDays ? index + 7 : index;
      break;
    case 'Home':
      e.preventDefault();
      // Start of current week (row)
      newIndex = Math.floor(index / 7) * 7;
      break;
    case 'End':
      e.preventDefault();
      // End of current week (row)
      newIndex = Math.min(Math.floor(index / 7) * 7 + 6, totalDays - 1);
      break;
    case 'Enter':
    case ' ':
      e.preventDefault();
      onSelectDate(calendarDays[index]);
      return;
  }
  
  if (newIndex !== index) {
    setFocusedIndex(newIndex);
    cellRefs.current[newIndex]?.focus();
  }
};
```

### Updated CalendarDayCell Props

```typescript
interface CalendarDayCellProps {
  day: Date;
  trips: MonthTripPreview[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (date: Date) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  tabIndex: number;
  cellRef: (el: HTMLButtonElement | null) => void;
  isLastInRow: boolean;
  isLastRow: boolean;
}
```

### ARIA Attributes

Add proper ARIA attributes for screen readers:

```typescript
<div 
  role="grid" 
  aria-label="Trip schedule calendar"
>
  <div role="row">
    {WEEKDAYS.map(day => (
      <div role="columnheader">{day}</div>
    ))}
  </div>
  <div role="row">
    {weekDays.map((day, i) => (
      <button
        role="gridcell"
        aria-selected={isSelected}
        aria-label={`${format(day, 'EEEE, MMMM d')}${trips.length ? `, ${trips.length} trips` : ''}`}
        ...
      />
    ))}
  </div>
</div>
```

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/trips/DetailedCalendarView.tsx` | Add keyboard navigation, roving tabindex, ARIA attributes |

## Accessibility Benefits

1. **Keyboard-only users**: Full navigation without mouse
2. **Screen reader users**: Proper announcements of day/trip counts
3. **Motor impairments**: Reduced number of keystrokes to navigate
4. **Standards compliance**: Follows WAI-ARIA grid pattern

## Edge Cases

- Focus wraps within calendar bounds (doesn't go to previous/next month)
- Maintains focus when month changes via navigation buttons
- Initial focus set to today or selected date
- Works correctly on both desktop and mobile layouts
