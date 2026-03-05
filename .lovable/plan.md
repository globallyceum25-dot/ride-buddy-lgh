

# Add Google Maps Loading State

## Approach
Create a `useGoogleMapsLoaded` hook that polls for `google.maps` availability and returns a boolean. Use it in components that depend on Google Maps to show a loading state until the script is ready.

## Changes

### 1. New file: `src/hooks/useGoogleMapsLoaded.ts`
A small hook that checks if `google.maps` is available, and if not, sets up an interval to poll until it is (since the script loads `async defer`).

```ts
export function useGoogleMapsLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => typeof google !== 'undefined' && !!google.maps);
  useEffect(() => {
    if (loaded) return;
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [loaded]);
  return loaded;
}
```

### 2. `src/components/shared/LocationAutocomplete.tsx`
- Use the hook; defer service initialization until `loaded` is true
- Show a disabled input with a spinner while loading

### 3. `src/hooks/useDistanceCalculation.ts`
- Use the hook; skip the directions call until loaded

### 4. `src/components/requests/RouteMapPreview.tsx`
- Use the hook; show skeleton until loaded instead of the error fallback

