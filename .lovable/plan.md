

# Enhanced Detailed Calendar View

## Overview

Transform the current calendar view into a comprehensive, detailed layout that maximizes the available screen space. Instead of showing only status dots/bars, the new calendar will display actual trip information directly within each day cell, with a clean agenda-style layout for the selected day's trips in a side panel.

## Current State

The existing Month View shows:
- Day numbers with small status indicator bars
- Trip count in corner
- Hover popover for trip details (recently added)
- Requires switching to Day View for detailed information

**Gap**: The calendar feels compact and requires multiple interactions to see trip details. The available space below navigation and stats isn't fully utilized.

## Proposed Solution: Split Calendar Layout

A new layout with:
1. **Left Panel (70%)**: Full calendar with inline trip previews showing first 2-3 trips per day
2. **Right Panel (30%)**: Selected day's trip agenda with full details

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│  Stats Bar                                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Navigation: ◄ ►  Today  | February 2026  |    Day  Week  [Month]          │
├─────────────────────────────────────────┬───────────────────────────────────┤
│         CALENDAR GRID (70%)             │   DAY AGENDA (30%)               │
│  ┌──────┬──────┬──────┬──────┬──────┐   │   ┌─────────────────────────┐    │
│  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │   │   │  Sunday, Feb 2          │    │
│  ├──────┼──────┼──────┼──────┼──────┤   │   │  3 trips scheduled      │    │
│  │  1   │  2   │  3   │  4   │  5   │   │   ├─────────────────────────┤    │
│  │08:00 │09:00 │      │10:00 │      │   │   │ ━━━━━━━━━━━━━━━━━━━━━━━ │    │
│  │HQ→Air│Ofc→St│      │Site→H│      │   │   │ 08:00  HQ → Airport     │    │
│  │      │14:00 │      │      │      │   │   │ 🚗 ABC-123  Driver: J   │    │
│  │      │St→HQ │      │      │      │   │   │ 4 passengers  Scheduled │    │
│  ├──────┼──────┼──────┼──────┼──────┤   │   ├─────────────────────────┤    │
│  │  8   │  9   │  10  │  11  │  12  │   │   │ 10:30  Office → Site    │    │
│  │      │      │      │      │+2 mor│   │   │ 🚗 XYZ-789  Driver: M   │    │
│  │      │      │      │      │      │   │   │ 2 passengers  Dispatched│    │
│  └──────┴──────┴──────┴──────┴──────┘   │   ├─────────────────────────┤    │
│                                         │   │ 14:00  Site → HQ        │    │
│                                         │   │ 🚗 ABC-123  Driver: J   │    │
│                                         │   │ 3 passengers  Completed │    │
│                                         │   └─────────────────────────┘    │
│                                         │                                  │
│                                         │   [+ New Request]               │
└─────────────────────────────────────────┴───────────────────────────────────┘
```

## Technical Implementation

### Phase 1: Create Enhanced Month View with Split Layout

**New Component: `DetailedCalendarView.tsx`**

This becomes the new default for Month view, featuring:
- Resizable split panel using existing `react-resizable-panels`
- Calendar grid on left showing inline trip previews
- Day agenda on right with full trip cards

```typescript
// src/components/trips/DetailedCalendarView.tsx
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

interface DetailedCalendarViewProps {
  currentDate: Date;
  selectedDate: Date;
  tripData: MonthTripData;
  onSelectDate: (date: Date) => void;
  isLoading?: boolean;
}

export function DetailedCalendarView({ ... }) {
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
      <ResizablePanel defaultSize={70} minSize={50}>
        <EnhancedCalendarGrid ... />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} minSize={20}>
        <DayAgendaPanel ... />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
```

### Phase 2: Enhanced Calendar Grid with Inline Trips

Each day cell will show:
- Day number (top left)
- Trip count badge (top right)
- First 2-3 trips as compact rows (time + route)
- "+N more" indicator if more trips exist

```typescript
function CalendarDayCell({ day, trips, isSelected, onSelect }) {
  const visibleTrips = trips.slice(0, 3);
  const hiddenCount = trips.length - visibleTrips.length;
  
  return (
    <button 
      onClick={() => onSelect(day)}
      className={cn(
        "min-h-[100px] p-2 border-r border-b text-left",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <div className="flex justify-between items-center mb-1">
        <span className={cn("w-7 h-7 rounded-full flex items-center justify-center",
          isToday(day) && "bg-primary text-primary-foreground"
        )}>
          {format(day, 'd')}
        </span>
        {trips.length > 0 && (
          <Badge variant="secondary" className="text-[10px]">
            {trips.length}
          </Badge>
        )}
      </div>
      
      <div className="space-y-0.5">
        {visibleTrips.map(trip => (
          <div key={trip.id} className={cn(
            "text-[11px] px-1.5 py-0.5 rounded truncate",
            statusBgColors[trip.status]
          )}>
            <span className="font-mono">{trip.time}</span>
            <span className="ml-1 text-muted-foreground">
              {trip.pickup.slice(0, 8)}→{trip.dropoff.slice(0, 8)}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="text-[10px] text-muted-foreground text-center">
            +{hiddenCount} more
          </div>
        )}
      </div>
    </button>
  );
}
```

### Phase 3: Day Agenda Panel

A dedicated panel showing all trips for the selected day with full details:

```typescript
function DayAgendaPanel({ 
  selectedDate, 
  trips, 
  onStartTrip, 
  onCompleteTrip,
  onSelectDate 
}) {
  return (
    <div className="h-full flex flex-col bg-card border-l">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold">{format(selectedDate, 'EEEE')}</h3>
        <p className="text-2xl font-bold">{format(selectedDate, 'MMMM d, yyyy')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {trips.length} trip{trips.length !== 1 ? 's' : ''} scheduled
        </p>
      </div>
      
      {/* Trip List */}
      <ScrollArea className="flex-1 p-4">
        {trips.length === 0 ? (
          <EmptyDayState date={selectedDate} />
        ) : (
          <div className="space-y-3">
            {trips.map(trip => (
              <AgendaTripCard 
                key={trip.id} 
                trip={trip}
                onStart={onStartTrip}
                onComplete={onCompleteTrip}
              />
            ))}
          </div>
        )}
      </ScrollArea>
      
      {/* Footer Actions */}
      <div className="p-4 border-t">
        <Button variant="outline" className="w-full" onClick={() => onSelectDate(selectedDate)}>
          View Full Day
        </Button>
      </div>
    </div>
  );
}
```

### Phase 4: Agenda Trip Card Component

A compact but detailed trip card for the agenda panel:

```typescript
function AgendaTripCard({ trip, onStart, onComplete }) {
  return (
    <Card className="overflow-hidden">
      <div className={cn(
        "h-1 w-full",
        statusBarColors[trip.status]
      )} />
      <CardContent className="p-3 space-y-2">
        {/* Time & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{trip.time}</span>
          </div>
          <AllocationStatusBadge status={trip.status} />
        </div>
        
        {/* Route */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-success shrink-0" />
          <span className="truncate">{trip.pickup}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-destructive shrink-0" />
          <span className="truncate">{trip.dropoff}</span>
        </div>
        
        {/* Resources */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
        
        {/* Actions */}
        {(trip.canStart || trip.canComplete) && (
          <div className="flex gap-2 pt-2 border-t">
            {trip.canStart && onStart && (
              <Button size="sm" className="flex-1" onClick={() => onStart(trip)}>
                <Play className="h-3 w-3 mr-1" /> Start
              </Button>
            )}
            {trip.canComplete && onComplete && (
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onComplete(trip)}>
                <CheckCircle className="h-3 w-3 mr-1" /> Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Phase 5: Update TripSchedule Page

Replace the current MonthView with the new DetailedCalendarView:

```typescript
// In TripSchedule.tsx
{viewMode === 'month' && (
  <DetailedCalendarView
    currentDate={currentMonth}
    selectedDate={selectedDate}
    tripData={monthTripData}
    onSelectDate={setSelectedDate}
    onViewDay={handleMonthDaySelect}
    onStartTrip={handleStartTrip}
    onCompleteTrip={handleCompleteTrip}
    isLoading={monthLoading}
  />
)}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/trips/DetailedCalendarView.tsx` | Create | New split-panel calendar with inline trips |
| `src/components/trips/DayAgendaPanel.tsx` | Create | Day detail panel for right side |
| `src/components/trips/AgendaTripCard.tsx` | Create | Compact trip card for agenda |
| `src/pages/TripSchedule.tsx` | Modify | Use DetailedCalendarView for month mode |
| `src/hooks/useTripSchedule.ts` | Modify | Add hook for selected day's detailed trips |

## Responsive Behavior

**Desktop (lg+)**: Full split view with resizable panels
**Tablet (md)**: Side panel collapses to bottom sheet on day select
**Mobile (sm)**: Calendar shows minimal view, day details in full-screen overlay

```typescript
// Responsive handling
const isMobile = useIsMobile();

{isMobile ? (
  <>
    <MobileCalendarGrid ... />
    <Sheet open={!!selectedDate} onOpenChange={...}>
      <DayAgendaPanel ... />
    </Sheet>
  </>
) : (
  <ResizablePanelGroup ...>
    ...
  </ResizablePanelGroup>
)}
```

## Enhanced Features

1. **Keyboard Navigation**: Arrow keys to move between days
2. **Quick Actions**: Start/Complete trips directly from agenda
3. **Status Legend**: Collapsible legend at bottom
4. **Today Indicator**: Current time marker in agenda if viewing today
5. **Print View**: Optimized CSS for printing weekly schedules

## Performance Optimizations

- Only render visible day cells (virtualization for large months)
- Lazy load agenda panel content
- Memoize calendar grid calculations
- Use React Query for trip data caching

