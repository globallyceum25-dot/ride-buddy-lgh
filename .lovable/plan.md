

# Replace OpenStreetMap Stack with Google Maps APIs

## Overview
Using your provided Google Maps API key (`AIzaSyBon2w3TBZg5vzd1pxGy0kZJ7THuyav5yo`), replace all Nominatim/OSRM/Leaflet usage with Google Maps APIs (Places Autocomplete, Directions, Maps JavaScript API).

## Changes

### 1. `index.html` — Add Google Maps script
Add before `</head>`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyBon2w3TBZg5vzd1pxGy0kZJ7THuyav5yo&libraries=places" async defer></script>
```

### 2. `src/index.css` — Remove Leaflet CSS
Remove line 1: `@import 'leaflet/dist/leaflet.css';`

### 3. `src/components/shared/LocationAutocomplete.tsx` — Google Places Autocomplete
- Remove Nominatim fetch logic entirely
- Use `google.maps.places.AutocompleteService` for predictions (restricted to Sri Lanka)
- Use `google.maps.places.PlacesService` with `getDetails` to get coordinates on selection
- Keep same component interface (`value`, `onChange(value, coords)`, `placeholder`, `className`)

### 4. `src/hooks/useDistanceCalculation.ts` — Google Directions API
- Replace OSRM fetch with `google.maps.DirectionsService`
- Convert waypoints to Google `DirectionsRequest` with origin, destination, and intermediate waypoints
- Extract distance (km) and duration (minutes) from response legs
- Keep same hook interface: `{ distanceKm, durationMinutes, isLoading }`

### 5. `src/components/requests/RouteMapPreview.tsx` — Google Maps + Directions
- Remove all Leaflet/react-leaflet imports and marker icon setup
- Use a `ref`-based `google.maps.Map` instance rendered in a plain `<div>`
- Use `google.maps.DirectionsService` + `google.maps.DirectionsRenderer` to geocode location names and render the route with markers automatically
- Keep same component interface: `pickup`, `dropoff`, `stops`

### 6. Cleanup
- Remove `leaflet`, `@types/leaflet`, `react-leaflet` from `package.json` dependencies

## Files summary
| File | Action |
|------|--------|
| `index.html` | Add Google Maps script tag |
| `src/index.css` | Remove Leaflet CSS import |
| `src/components/shared/LocationAutocomplete.tsx` | Full rewrite — Google Places |
| `src/hooks/useDistanceCalculation.ts` | Full rewrite — Google Directions |
| `src/components/requests/RouteMapPreview.tsx` | Full rewrite — Google Maps |
| `package.json` | Remove leaflet, @types/leaflet, react-leaflet |

