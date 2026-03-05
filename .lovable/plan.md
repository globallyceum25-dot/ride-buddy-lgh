

# Integrate Location Picker with Autocomplete and Mileage Calculation

## Approach: Free OpenStreetMap Stack (No API Key Required)

Using two free, open-source services:
- **Nominatim** (OpenStreetMap): Location search/autocomplete - returns place names and coordinates
- **OSRM** (Open Source Routing Machine): Distance/duration calculation between coordinates

These are free with no API key, though rate-limited (1 req/sec for Nominatim). For a corporate fleet management tool with moderate usage, this is sufficient. You can always upgrade to Google Maps later by swapping the API layer.

## Changes

### 1. New reusable `LocationAutocomplete` component
`src/components/shared/LocationAutocomplete.tsx`

- Debounced text input (300ms) that queries Nominatim's `/search` endpoint as the user types
- Dropdown list of matching places with address details
- On selection: sets the display name and stores lat/lng coordinates
- Props: `value`, `onChange(value: string, coords: {lat, lng} | null)`, `placeholder`
- Styled to match existing Input component

### 2. New `useDistanceCalculation` hook
`src/hooks/useDistanceCalculation.ts`

- Accepts an array of waypoints (lat/lng pairs): pickup -> stops -> dropoff
- Calls OSRM's `/route/v1/driving` endpoint with all waypoints
- Returns `{ distanceKm, durationMinutes, isLoading }`
- Recalculates when waypoints change (debounced)

### 3. New `MileageDisplay` component
`src/components/requests/MileageDisplay.tsx`

- Small info card shown below locations in the form
- Displays estimated distance (km) and duration
- Shows a loading spinner while calculating
- Only visible when both pickup and dropoff have valid coordinates

### 4. Update `RequestDialog.tsx`
- Replace pickup/dropoff `<Input>` fields with `<LocationAutocomplete>`
- Track coordinates in local state alongside text values
- Add `<MileageDisplay>` between locations section and the rest of the form
- Store estimated distance in form submission (add `estimated_distance_km` to the request data)

### 5. Update `SortableStops.tsx`
- Replace stop `<Input>` with `<LocationAutocomplete>`
- Track coordinates per stop so they can feed into mileage calculation
- Pass coordinates up to parent via updated `onStopsChange`

### 6. Update `PublicRequestForm.tsx`
- Same changes as RequestDialog: swap inputs for `LocationAutocomplete`, add `MileageDisplay`

### 7. Database: add `estimated_distance_km` column
- Add nullable `numeric` column `estimated_distance_km` to `travel_requests` table
- Store the OSRM-calculated distance when the request is submitted

## Technical Notes

- Nominatim API: `https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=5&countrycodes=lk` (filtered to Sri Lanka based on LKR currency usage)
- OSRM API: `https://router.project-osrm.org/route/v1/driving/{lng1},{lat1};{lng2},{lat2}?overview=false`
- All API calls are client-side (no edge function needed) since these are public APIs
- Nominatim requires a `User-Agent` header per their usage policy
- The autocomplete dropdown uses a Popover or simple absolute-positioned div

## Implementation Order
1. Create `LocationAutocomplete` component
2. Create `useDistanceCalculation` hook
3. Create `MileageDisplay` component
4. Add DB migration for `estimated_distance_km`
5. Update `RequestDialog.tsx` and `SortableStops.tsx`
6. Update `PublicRequestForm.tsx`
7. Update `useRequests.ts` / `usePublicRequest.ts` to pass distance on submit

