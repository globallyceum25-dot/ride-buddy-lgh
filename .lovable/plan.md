

# Replace Nominatim/OSRM with Google Maps APIs

## Overview
Replace all OpenStreetMap-based services (Nominatim geocoding, OSRM routing) with Google Maps APIs (Places Autocomplete, Directions API, Maps JavaScript API). The Google API key will be stored as a publishable key in the codebase since it's a client-side key (restricted by HTTP referrer).

## Files affected

### 1. `src/components/shared/LocationAutocomplete.tsx` — Replace Nominatim with Google Places Autocomplete
- Remove Nominatim fetch logic
- Use Google Places Autocomplete Service (`google.maps.places.AutocompleteService` + `PlacesService.getDetails`) for suggestions and coordinates
- Keep the same component interface (`value`, `onChange` with coords, `placeholder`, `className`)
- Filter results to Sri Lanka (`componentRestrictions: { country: 'lk' }`)

### 2. `src/hooks/useDistanceCalculation.ts` — Replace OSRM with Google Directions API
- Use `google.maps.DirectionsService` to calculate distance and duration between waypoints
- Keep the same hook interface returning `{ distanceKm, durationMinutes, isLoading }`

### 3. `src/components/requests/RouteMapPreview.tsx` — Replace Leaflet + Nominatim + OSRM with Google Maps
- Remove Leaflet/react-leaflet usage
- Use Google Maps JavaScript API (`google.maps.Map`, `DirectionsRenderer`) to render the map and route
- Keep the same component interface (`pickup`, `dropoff`, `stops`)
- Use `DirectionsService` for routing (replaces both geocoding and OSRM)

### 4. `index.html` — Load Google Maps script
- Add `<script src="https://maps.googleapis.com/maps/api/js?key=API_KEY&libraries=places"></script>` in `<head>`
- The user will provide the API key

### 5. `src/index.css` — Remove Leaflet CSS import
- Remove `@import 'leaflet/dist/leaflet.css'` and any Leaflet marker fixes

### 6. Cleanup
- Can optionally remove `leaflet`, `@types/leaflet`, `react-leaflet` dependencies since they'll no longer be used

## Flow
1. User provides Google Maps API key
2. Add script tag to `index.html`
3. Rewrite `LocationAutocomplete` to use Google Places
4. Rewrite `useDistanceCalculation` to use Google Directions
5. Rewrite `RouteMapPreview` to use Google Maps + Directions
6. Remove Leaflet CSS and dependencies

