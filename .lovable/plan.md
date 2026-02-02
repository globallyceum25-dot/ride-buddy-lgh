

# Enhanced Trip Details on Hover for Calendar Views

## Overview

This plan transforms the calendar view experience by adding rich, contextual hover cards that display comprehensive trip details. Users will see detailed information when hovering over trip indicators in the Month View and trip blocks in the Week Timeline View, following the existing memory pattern of showing route details on hover.

## Current State Analysis

**What exists:**
- `TripPreviewCard` component using `HoverCard` for the Week Timeline's `TripBlock`
- Month View shows colored status bars with basic native `title` attributes only
- No hover interaction on Month View day cells
- Week Timeline View already has hover via `TripBlock` → `TripPreviewCard`

**Gap identified:**
- Month View lacks hover details - only shows colored dots/bars
- When hovering on a day with multiple trips, there's no summary preview
- No access to trip data in Month View (only aggregate counts)

## Proposed Solution

### Approach: Enhanced Hover Cards at Two Levels

1. **Day-Level Hover (Month View)**: When hovering on a calendar day cell, show a summary popover listing all trips for that day with key details
2. **Trip-Level Hover (already exists in Week View)**: Ensure the existing `TripPreviewCard` is comprehensive and consistent

```text
┌───────────────────────────────────────────────────────────────────┐
│                    MONTH VIEW - DAY CELL                          │
│  ┌─────────────────┐                                              │
│  │     12          │  ──── Hover ────►  ┌─────────────────────┐   │
│  │ ━━ ━━ ━━        │                    │ Wednesday, Feb 12   │   │
│  │    (3 trips)    │                    │─────────────────────│   │
│  └─────────────────┘                    │ 08:00 HQ → Airport  │   │
│                                         │ 🚗 ABC-123 │ John   │   │
│                                         │─────────────────────│   │
│                                         │ 10:30 Office → Site │   │
│                                         │ 🚗 XYZ-789 │ Mary   │   │
│                                         │─────────────────────│   │
│                                         │ 14:00 Site → HQ     │   │
│                                         │ 🚗 ABC-123 │ John   │   │
│                                         │─────────────────────│   │
│                                         │ Click to view all ↗ │   │
│                                         └─────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### Technical Implementation

#### Phase 1: Fetch Trip Details for Month View

Modify `useMonthSchedule` to optionally return trip details, not just counts:

```typescript
// New interface for detailed month data
export interface MonthTripDataDetailed {
  [date: string]: {
    total: number;
    scheduled: number;
    dispatched: number;
    inProgress: number;
    completed: number;
    trips: MonthTripPreview[]; // NEW: actual trip details
  };
}

interface MonthTripPreview {
  id: string;
  time: string;
  pickup: string;
  dropoff: string;
  status: AllocationStatus;
  vehicleReg: string | null;
  driverName: string | null;
  passengerCount: number;
  isPooled: boolean;
}
```

#### Phase 2: Create Day Hover Popover Component

New file: `src/components/trips/DayTripPopover.tsx`

```typescript
interface DayTripPopoverProps {
  date: Date;
  trips: MonthTripPreview[];
  onSelectDate: (date: Date) => void;
  children: React.ReactNode;
}

export function DayTripPopover({ date, trips, onSelectDate, children }: DayTripPopoverProps) {
  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent side="right" className="w-80 p-0">
        {/* Day header */}
        <div className="p-3 border-b bg-muted/30">
          <h4 className="font-semibold">{format(date, 'EEEE, MMMM d')}</h4>
          <p className="text-xs text-muted-foreground">{trips.length} scheduled trips</p>
        </div>
        
        {/* Trip list (max 5, scrollable if more) */}
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y">
            {trips.slice(0, 5).map(trip => (
              <TripPreviewRow key={trip.id} trip={trip} />
            ))}
          </div>
          {trips.length > 5 && (
            <div className="p-2 text-center text-sm text-muted-foreground">
              +{trips.length - 5} more trips
            </div>
          )}
        </ScrollArea>
        
        {/* Footer action */}
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full"
            onClick={() => onSelectDate(date)}
          >
            View all trips for this day →
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
```

#### Phase 3: Compact Trip Row for Popover

```typescript
function TripPreviewRow({ trip }: { trip: MonthTripPreview }) {
  return (
    <div className="p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{trip.time}</span>
          <AllocationStatusBadge status={trip.status} compact />
        </div>
        {trip.isPooled && (
          <Badge variant="secondary" className="text-[10px]">POOL</Badge>
        )}
      </div>
      <p className="text-sm truncate">
        {trip.pickup} → {trip.dropoff}
      </p>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        {trip.vehicleReg && (
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3" /> {trip.vehicleReg}
          </span>
        )}
        {trip.driverName && (
          <span>{trip.driverName}</span>
        )}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" /> {trip.passengerCount}
        </span>
      </div>
    </div>
  );
}
```

#### Phase 4: Update MonthView to Use Hover

```typescript
// In MonthView.tsx - wrap day cell button with DayTripPopover
{hasTrips ? (
  <DayTripPopover
    date={day}
    trips={dayData.trips}
    onSelectDate={onSelectDate}
  >
    <button className={cn(...)}>
      {/* existing day content */}
    </button>
  </DayTripPopover>
) : (
  <button className={cn(...)}>
    {/* existing day content for empty days */}
  </button>
)}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useTripSchedule.ts` | Modify | Extend `useMonthSchedule` to return trip details |
| `src/components/trips/DayTripPopover.tsx` | Create | New hover card for day-level trip summaries |
| `src/components/trips/MonthView.tsx` | Modify | Integrate `DayTripPopover` for days with trips |

### Detailed Implementation Steps

**Step 1: Extend `useMonthSchedule` Hook**

Update the hook to fetch and return trip previews for each day:

```typescript
// Modify the existing hook query to include:
const { data: allocations, error } = await supabase
  .from('allocations')
  .select(`
    id,
    scheduled_pickup,
    status,
    pool_id,
    request:travel_requests(
      pickup_location,
      dropoff_location,
      passenger_count
    ),
    vehicle:vehicles(registration_number),
    driver:drivers(user_id)
  `)
  .gte('scheduled_pickup', format(calendarStart, "yyyy-MM-dd'T'00:00:00"))
  .lte('scheduled_pickup', format(calendarEnd, "yyyy-MM-dd'T'23:59:59"))
  .neq('status', 'cancelled')
  .order('scheduled_pickup', { ascending: true });

// Fetch driver profiles for names
const driverUserIds = [...new Set(allocations?.map(a => a.driver?.user_id).filter(Boolean))];
const { data: driverProfiles } = await supabase
  .from('profiles')
  .select('user_id, full_name')
  .in('user_id', driverUserIds);

// Build trip previews grouped by date
tripData[dateStr] = {
  total: 0,
  scheduled: 0,
  dispatched: 0,
  inProgress: 0,
  completed: 0,
  trips: [] // NEW array of MonthTripPreview
};
```

**Step 2: Create `DayTripPopover` Component**

Full implementation with proper positioning and styling that matches the existing `TripPreviewCard` aesthetic.

**Step 3: Update `MonthView` Component**

- Import the new `DayTripPopover` component
- Wrap each day cell that has trips in the popover
- Pass trip data and click handler
- Ensure keyboard accessibility (Enter/Space triggers day selection)

### User Experience Details

1. **Hover Delay**: 300ms delay before showing (prevents accidental triggers while scrolling)
2. **Close Delay**: 150ms delay before hiding (allows moving cursor to popover content)
3. **Max Display**: Show first 5 trips with "+N more" indicator
4. **Quick Actions**: "View all" button switches to Day View for that date
5. **Responsive**: Popover positioned `side="right"` with automatic flip for edge cases
6. **Accessible**: 
   - Keyboard users can Tab to day cells
   - Popover respects `prefers-reduced-motion`
   - Screen readers announce trip count

### Edge Cases Handled

- **Empty days**: No popover, just normal click behavior
- **Many trips**: Scroll area with max height, showing count of hidden trips
- **Loading state**: Popover shows skeleton loaders if data still loading
- **Missing data**: Graceful fallback for missing vehicle/driver info
- **Touch devices**: Tap to open popover, tap elsewhere to close

### Performance Considerations

- Fetch trip details in the same query as counts (one request)
- Use React Query caching for month data
- Lazy render popovers (only mount when needed via HoverCard)
- Limit trip preview data to essential fields only

