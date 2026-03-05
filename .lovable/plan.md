

# Add Location Names to Trip Schedule Views

## Summary
Extend the trip schedule data layer and all calendar view components to display location names (e.g., "Raymond Plaza") alongside addresses, matching the pattern already implemented in Requests and Allocations pages.

## Changes

### 1. `src/hooks/useTripSchedule.ts`
- **`MonthTripPreview` interface**: Add `pickupName: string | null` and `dropoffName: string | null`
- **`ScheduledTrip` interface**: Add `pickupName: string | null` and `dropoffName: string | null`
- **`useMonthSchedule` query**: Add `pickup_location_name, dropoff_location_name` to the `travel_requests` select; populate `pickupName`/`dropoffName` in trip previews
- **`useTripSchedule` query**: Same — add the two name columns to the select; populate in `ScheduledTrip` mapping
- **`useWeekTrips` query**: Same pattern

### 2. `src/components/trips/AgendaTripCard.tsx`
- Show `trip.pickupName` as primary text (bold) and `trip.pickup` (address) as secondary muted text beneath it, for both pickup and dropoff
- Fallback to address-only when name is null (legacy records)

### 3. `src/components/trips/TripCard.tsx`
- **Compact mode**: Show `pickupName → dropoffName` when available, address as fallback
- **Full mode**: Show location name as primary, address as secondary in the route section

### 4. `src/components/trips/TripPreviewCard.tsx`
- **Hover card route section**: Show location name above address for pickup and dropoff labels
- **`TripBlock` inline text**: Show `pickupName → dropoffName` when available, address as fallback

### Display Format
When name exists: **Raymond Plaza** (bold) + address below in muted text.
When no name: address only (unchanged from current behavior).

## Files to modify
| File | Change |
|------|--------|
| `src/hooks/useTripSchedule.ts` | Add name fields to interfaces + queries |
| `src/components/trips/AgendaTripCard.tsx` | Show location names |
| `src/components/trips/TripCard.tsx` | Show location names |
| `src/components/trips/TripPreviewCard.tsx` | Show location names in hover card + trip block |

