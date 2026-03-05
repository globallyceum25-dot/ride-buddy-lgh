

# Add Leaflet Route Map Preview to Request Detail Dialog

## Problem
Coordinates are not stored in the database — only location names are saved. To show a map, we need to geocode the location names at display time.

## Approach
1. Install `leaflet` and `react-leaflet` (free, OSM-based)
2. Create a `RouteMapPreview` component that:
   - Takes pickup, dropoff, and optional intermediate stop location names
   - Geocodes them via Nominatim (same API already used in the app)
   - Fetches the route geometry from OSRM with `overview=full&geometries=geojson`
   - Renders a Leaflet map with markers and the route polyline
   - Auto-fits bounds to show all waypoints
3. Add `RouteMapPreview` to `RequestDetailDialog.tsx` after the estimated distance row, inside the Trip Details section
4. The map only renders when location names are available; shows a small loading state while geocoding

## New Dependencies
- `leaflet` + `@types/leaflet`
- `react-leaflet`

## Files

### New: `src/components/requests/RouteMapPreview.tsx`
- Props: `pickup: string`, `dropoff: string`, `stops?: string[]`
- Internal state: geocoded coordinates, route geometry, loading/error
- On mount: geocode all locations via Nominatim, then fetch OSRM route with `overview=full&geometries=geojson`
- Render: `MapContainer` with `TileLayer` (OSM), `Marker` for each point (colored: green=pickup, red=dropoff, blue=stops), `GeoJSON` or `Polyline` for the route
- Height: ~250px, rounded corners, contained within the dialog

### Modified: `src/components/requests/RequestDetailDialog.tsx`
- Import and render `RouteMapPreview` after the estimated distance row (around line 164)
- Pass `pickup_location`, `dropoff_location`, and stops array

### New: `src/index.css` addition
- Add Leaflet CSS import: `@import 'leaflet/dist/leaflet.css';`
- Fix default marker icon issue (known Leaflet+webpack/vite bug) by setting icon paths

## Technical Notes
- Nominatim geocoding is rate-limited (1 req/sec), so requests are sequential with small delays
- The map is read-only (no interaction needed beyond zoom/pan)
- Route polyline color: blue, matching standard map conventions
- Leaflet's default marker icons need a manual fix in Vite environments (missing icon URLs)

