

# Show Estimated Distance on Allocation Cards

## Changes

### 1. Update `useAllocations.ts` — add `estimated_distance_km` to the query
In the `useAllocations` hook (line ~176), add `estimated_distance_km` to the `travel_requests` select fields. Also update the `Allocation` interface's `request` type (line ~38) to include `estimated_distance_km: number | null`.

Similarly update `usePendingAllocation` if it's used in allocation views.

### 2. Update `AllocationCard.tsx` — display the distance
After the Time section (line ~245) and before the Vehicle & Driver section, add a small row showing the estimated distance when available:
```
{allocation.request?.estimated_distance_km && (
  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
    <Route className="h-3 w-3" />
    <span>{allocation.request.estimated_distance_km} km</span>
  </div>
)}
```
Import `Route` from `lucide-react`.

### Files to edit
- `src/hooks/useAllocations.ts` — interface + query (2 spots)
- `src/components/allocations/AllocationCard.tsx` — display row

