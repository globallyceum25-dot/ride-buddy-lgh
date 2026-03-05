

# Add Location Names to Notification Route Display

## Problem
All notification payloads build the `route` field using raw addresses: `${request.pickup_location} → ${request.dropoff_location}`. When location names (e.g., "Raymond Plaza") exist, coordinators should see those instead.

## Approach
Use a helper pattern: `pickup_location_name || pickup_location` for each side of the route arrow. This affects every place that constructs a `route:` string for notifications.

## Changes

### 1. `src/hooks/useRequests.ts`
Update all 4 occurrences of:
```
route: `${request.pickup_location} → ${request.dropoff_location}`
```
to:
```
route: `${request.pickup_location_name || request.pickup_location} → ${request.dropoff_location_name || request.dropoff_location}`
```

### 2. `src/hooks/useAllocations.ts`
Same change for all 4 occurrences of the route string construction (lines ~339, ~457, ~567, ~684).

### 3. `supabase/functions/submit-public-request/index.ts`
Same change for the route string at line ~170. The `requestData` object should already contain the location name fields if provided by the public form.

## Files to modify
| File | Occurrences |
|------|------------|
| `src/hooks/useRequests.ts` | 4 |
| `src/hooks/useAllocations.ts` | 4 |
| `supabase/functions/submit-public-request/index.ts` | 1 |

