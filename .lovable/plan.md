

# Show Location Name Alongside Address

## Problem
Currently, locations only store and display the Google Maps formatted address (e.g., "10 Raymond Rd, Nugegoda 10250, Sri Lanka"). The user wants to also see a location name (e.g., the place name from Google, like "Raymond Plaza" or a business name).

## Approach
The Google Places API provides a `name` field for each place (the business/place name). We need to:
1. Capture the place name when a location is selected in the autocomplete
2. Store it alongside the address in the database
3. Display it in the detail dialog and other views

## Database Changes (Migration)
Add name columns to `travel_requests` and `request_stops`:

```sql
ALTER TABLE travel_requests ADD COLUMN pickup_location_name text;
ALTER TABLE travel_requests ADD COLUMN dropoff_location_name text;
ALTER TABLE request_stops ADD COLUMN location_name text;
```

These are nullable so existing records are unaffected.

## Code Changes

### 1. `src/components/shared/LocationAutocomplete.tsx`
- Update `onChange` callback signature to also pass the place name: `onChange(address, coords, placeName)`
- In `handleSelect`, request the `name` field from `getDetails` (add `'name'` to `fields`)
- Pass `place.name` back through the callback

### 2. `src/components/requests/RequestDialog.tsx`
- Track `pickupLocationName`, `dropoffLocationName`, and stop location names in state
- Update the `LocationAutocomplete` `onChange` handlers to capture the name
- Pass the names into the create mutation

### 3. `src/hooks/useRequests.ts`
- Extend `CreateRequestInput` with optional `pickup_location_name`, `dropoff_location_name`
- Extend stop data with optional `location_name`
- Include these fields in the insert calls
- Include them in the select queries (for `useRequest`)

### 4. `src/components/requests/RequestDetailDialog.tsx`
- For pickup, destination, and stops: show the location name as the bold label and the address as secondary text beneath it
- Example: **Raymond Plaza** → 10 Raymond Rd, Nugegoda 10250, Sri Lanka

### 5. `src/pages/Requests.tsx` and other route displays
- Where location names are available, show them as the primary text with addresses as secondary

### 6. `src/components/allocations/RouteDisplay.tsx`
- Update the `Stop` interface and props to include optional `location_name`
- Display name above address when available

### 7. Update Supabase types
- Regenerate or manually add the new columns to `src/integrations/supabase/types.ts`

### 8. Public request form (`src/hooks/usePublicRequest.ts`)
- Same pattern: capture and store location names

## Display Format
When a location name exists:
```
📍 Pickup
   Raymond Plaza
   10 Raymond Rd, Nugegoda 10250, Sri Lanka
```
When no name (legacy records):
```
📍 Pickup
   10 Raymond Rd, Nugegoda 10250, Sri Lanka
```

## Files to modify
| File | Change |
|------|--------|
| Migration SQL | Add 3 new nullable columns |
| `supabase/types.ts` | Add new fields |
| `LocationAutocomplete.tsx` | Capture and pass place name |
| `RequestDialog.tsx` | Track and submit location names |
| `useRequests.ts` | Store and query location names |
| `RequestDetailDialog.tsx` | Display name + address |
| `Requests.tsx` | Show name in table |
| `RouteDisplay.tsx` | Show name in route tooltips |
| `usePublicRequest.ts` | Store names for public requests |

