

# Add Location Names to DayTripPopover

## Analysis
- `DayAgendaPanel` already uses `AgendaTripCard`, which was updated in the previous round — **no changes needed**.
- `DayTripPopover` has its own **local** `MonthTripPreview` interface (lines 14-24) that lacks `pickupName` and `dropoffName`. Its `TripPreviewRow` displays only `trip.pickup → trip.dropoff`.

## Changes

### `src/components/trips/DayTripPopover.tsx`
1. Add `pickupName?: string | null` and `dropoffName?: string | null` to the local `MonthTripPreview` interface.
2. In `TripPreviewRow` (line 47-49), show location names as primary text with address fallback:
   - `{trip.pickupName || trip.pickup} → {trip.dropoffName || trip.dropoff}`
   - If a name exists and differs from the address, show the address as a secondary line in muted text below.

No other files need changes.

