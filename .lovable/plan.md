

# Add Timeout Fallback for Google Maps Loading

## Changes

### `src/hooks/useGoogleMapsLoaded.ts`
- Add a `timedOut` state that triggers after 10 seconds if Google Maps hasn't loaded
- Return an object `{ loaded, timedOut }` instead of just a boolean
- Clear both the polling interval and timeout on cleanup

### `src/components/shared/LocationAutocomplete.tsx`
- Destructure `{ loaded, timedOut }` from the hook
- If `timedOut`, show a disabled input with error message like "Maps failed to load"

### `src/hooks/useDistanceCalculation.ts`
- Update to use the new hook return shape (just check `loaded`)

### `src/components/requests/RouteMapPreview.tsx`
- If `timedOut`, show an error box instead of infinite skeleton

