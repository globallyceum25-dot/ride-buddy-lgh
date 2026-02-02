
# Trip Schedule Module Implementation Plan

## Overview
Create a Trip Schedule module that provides calendar/list views of scheduled trips. This serves two audiences:
- **Drivers**: View their assigned trips and manage trip execution (start/complete)
- **Coordinators/Admins**: View all scheduled trips across the fleet with filtering options

---

## Features

### 1. Schedule Views
| View | Description |
|------|-------------|
| Day View | All trips for a selected date (default: today) |
| Week View | 7-day overview with trip counts |
| List View | Filterable table of upcoming trips |

### 2. Filtering Options
- Date/Date Range picker
- Driver filter (coordinators only)
- Vehicle filter (coordinators only)
- Status filter (scheduled, dispatched, in_progress)

### 3. Driver-Specific Features
- "My Trips" toggle showing only assigned trips
- Quick actions: Start Trip, Complete Trip
- Mobile-responsive card layout for use on the go

### 4. Trip Cards Display
Each trip card shows:
- Time and status
- Pickup and dropoff locations
- Passenger count
- Vehicle and driver info
- Pool indicator (if part of a pooled trip)

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/TripSchedule.tsx` | Main page with views and filters |
| `src/hooks/useTripSchedule.ts` | Data fetching with date/filter params |
| `src/components/trips/TripCard.tsx` | Reusable trip display card |
| `src/components/trips/DayView.tsx` | Single day schedule view |
| `src/components/trips/WeekView.tsx` | Weekly overview |
| `src/components/trips/ScheduleFilters.tsx` | Filter controls component |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/trips` route |

---

## UI Layout

### Page Structure
```
+--------------------------------------------------+
| Trip Schedule                    [Today] [Week]  |
+--------------------------------------------------+
| Filters: [Date Picker] [Driver ▼] [Vehicle ▼]   |
|          [x] Show my trips only (drivers)        |
+--------------------------------------------------+
| Sunday, Feb 2, 2026                              |
+--------------------------------------------------+
| ┌──────────────────────────────────────────────┐ |
| │ 9:00 AM              DISPATCHED              │ |
| │ HQ → Airport         TR-2026-0001            │ |
| │ 2 passengers         Toyota Hiace ABC-1234   │ |
| │ Driver: John Doe                             │ |
| │                      [Start Trip]            │ |
| └──────────────────────────────────────────────┘ |
|                                                  |
| ┌──────────────────────────────────────────────┐ |
| │ 10:30 AM             SCHEDULED     [POOLED]  │ |
| │ Downtown → Hospital  POOL-2026-0001          │ |
| │ 4 passengers (2 requests)                    │ |
| │ Vehicle: XYZ-5678    Driver: Jane Smith      │ |
| └──────────────────────────────────────────────┘ |
+--------------------------------------------------+
```

### Week View
```
+--------------------------------------------------+
|        Mon   Tue   Wed   Thu   Fri   Sat   Sun   |
| 2/3   [4]   [2]   [5]   [3]   [1]   [-]   [-]   |
+--------------------------------------------------+
| Click a day to see details                       |
+--------------------------------------------------+
```

---

## Implementation Details

### useTripSchedule Hook
```typescript
interface TripScheduleFilters {
  date?: string;         // Single date filter
  startDate?: string;    // Range start
  endDate?: string;      // Range end
  driverId?: string;     // Filter by driver
  vehicleId?: string;    // Filter by vehicle
  myTripsOnly?: boolean; // For drivers
  status?: string[];     // Status filter
}

export function useTripSchedule(filters: TripScheduleFilters) {
  // Fetch allocations with related data
  // Filter by date range
  // Include pool information
  // Return grouped by date for display
}
```

### Data Structure for Display
```typescript
interface ScheduledTrip {
  id: string;
  type: 'single' | 'pooled';
  scheduledTime: string;
  status: AllocationStatus;
  pickup: string;
  dropoff: string;
  passengerCount: number;
  vehicle: { registration: string; makeModel: string };
  driver: { name: string; id: string };
  request?: { number: string; requester: string };
  pool?: { number: string; requestCount: number };
  canStartTrip: boolean;
  canCompleteTrip: boolean;
}

interface DaySchedule {
  date: string;
  trips: ScheduledTrip[];
}
```

---

## Role-Based Access

### Drivers
- See only their assigned trips by default
- Can toggle "Show all trips" (read-only view)
- Can start/complete their own trips
- Mobile-optimized card view

### Coordinators/Admins
- See all trips across the fleet
- Can filter by any driver or vehicle
- Full access to all trip management actions
- Access to week view and reporting

---

## Integration Points

### With TripTrackingDialog
Reuse the existing `TripTrackingDialog` component for Start Trip and Complete Trip actions directly from the schedule.

### With Allocations
- Schedule shows data from `allocations` table
- Links to allocation detail when needed
- Status updates sync with allocations module

---

## Implementation Order

### Phase 1: Core Page and Hook
1. Create `useTripSchedule.ts` hook with date filtering
2. Create `TripSchedule.tsx` page with day view
3. Add route to `App.tsx`

### Phase 2: Components
1. Create `TripCard.tsx` for consistent trip display
2. Create `ScheduleFilters.tsx` for filter controls
3. Create `DayView.tsx` component

### Phase 3: Enhanced Views
1. Create `WeekView.tsx` with week overview
2. Add driver/vehicle filtering
3. Add "My trips only" toggle for drivers

### Phase 4: Trip Actions
1. Integrate `TripTrackingDialog` for start/complete
2. Add status update actions
3. Mobile optimization

---

## Mobile Considerations

- Stack trip cards vertically
- Large touch targets for Start/Complete buttons
- Swipe gestures for day navigation (future)
- Bottom sheet for filters on mobile

---

## Stats Display

Show summary stats at top of page:
- Trips today: X
- In progress: X
- Completed: X
- Upcoming this week: X
