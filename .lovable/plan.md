

# Fix Map Loading and Location Name Display

## Investigation Findings

### Location Names
All records in `travel_requests` have `null` for `pickup_location_name` and `dropoff_location_name`. The save code in `RequestDialog.tsx` is correct — it captures `place.name` from Google Places and passes it to the create mutation. However, **existing records were created before this feature was implemented**, so they have no stored names.

Additionally, for plain address searches (e.g., "10 Raymond Rd"), Google Places often returns the street address as `place.name` rather than a business/POI name, so the name may not be meaningfully different from the address.

### Map
The `RouteMapPreview` component uses `useGoogleMapsLoaded` to poll for `google.maps`. The Google Maps script is loaded via `index.html` with an API key. The gray box in the screenshot suggests either: the API key is restricted and doesn't work on the preview domain, or there's a race condition in the component.

One code issue: line 70 of `RouteMapPreview.tsx` uses `stops.join('|')` directly in the dependency array, which creates a new value each render and can cause infinite re-renders or stale closures.

## Changes

### 1. Fix `RouteMapPreview.tsx` — stabilize dependency array
Replace `stops.join('|')` in the `useEffect` dependency with a memoized value, and add better error handling for when the map fails silently.

### 2. Fix `RouteMapPreview.tsx` — handle map initialization failure
Add try/catch around `new google.maps.Map()` and `DirectionsService.route()` so errors don't silently swallow. Show fallback UI if the map container fails to initialize.

### 3. Improve `LocationAutocomplete.tsx` — smarter place name detection
Only store `place.name` when it's meaningfully different from `formatted_address` (i.e., not just a substring of the address). This ensures that when a user selects a POI (like "Raymond Plaza"), the name is captured, but plain addresses don't get a redundant name.

### 4. No retroactive data fix needed
The display code in `RequestDetailDialog.tsx` is already correct — it shows location names when they exist. New requests created going forward will have names if the user selects a named place (POI/business). Existing records will continue showing just the address.

## Files to modify
| File | Change |
|------|--------|
| `src/components/requests/RouteMapPreview.tsx` | Fix dependency array, add error handling, improve initialization |
| `src/components/shared/LocationAutocomplete.tsx` | Smarter place name capture (skip if name ≈ address) |

