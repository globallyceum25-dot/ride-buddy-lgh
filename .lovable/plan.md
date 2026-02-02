
# Prevent Double-Booking of Vehicles and Drivers

## Problem
Currently, when assigning a vehicle and driver to a trip, the system only checks if the vehicle/driver is marked as "available" in their master data. It doesn't check if they're already scheduled for another trip on the same day that hasn't been completed yet.

## Solution
Add logic to filter out vehicles and drivers that have non-completed allocations on the same date as the request being scheduled.

---

## Implementation

### 1. Create a New Hook: `useBusyResources`
Create a utility hook that fetches allocations for a specific date and returns lists of busy vehicle and driver IDs.

```typescript
// src/hooks/useBusyResources.ts
export function useBusyResources(date: string | null) {
  return useQuery({
    queryKey: ['busy-resources', date],
    enabled: !!date,
    queryFn: async () => {
      // Fetch allocations for the date that are NOT completed/cancelled
      const { data } = await supabase
        .from('allocations')
        .select('vehicle_id, driver_id, status')
        .gte('scheduled_pickup', `${date}T00:00:00`)
        .lte('scheduled_pickup', `${date}T23:59:59`)
        .not('status', 'in', '("completed","cancelled")');
      
      return {
        busyVehicleIds: [...new Set(data?.map(a => a.vehicle_id).filter(Boolean))],
        busyDriverIds: [...new Set(data?.map(a => a.driver_id).filter(Boolean))],
      };
    },
  });
}
```

### 2. Update AllocationDialog
- Extract the date from the request's `pickup_datetime`
- Use `useBusyResources(date)` to get busy IDs
- Filter out busy vehicles and drivers from the available lists
- Show a visual indicator for resources that are busy

**Key changes:**
```typescript
const requestDate = request ? format(new Date(request.pickup_datetime), 'yyyy-MM-dd') : null;
const { data: busyResources } = useBusyResources(requestDate);

const availableVehicles = vehicles.filter(v => 
  v.is_active && 
  v.status === 'available' && 
  (v.capacity ?? 0) >= (request?.passenger_count || 1) &&
  !busyResources?.busyVehicleIds.includes(v.id)
);

const availableDrivers = drivers.filter(d => 
  d.is_active && 
  d.status === 'available' &&
  !busyResources?.busyDriverIds.includes(d.id)
);
```

### 3. Update MergeRequestsDialog
- Extract the date from the first request
- Use `useBusyResources(date)` to get busy IDs
- Apply the same filtering logic

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useBusyResources.ts` | Hook to fetch vehicles/drivers with active allocations on a date |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/allocations/AllocationDialog.tsx` | Filter out busy vehicles/drivers |
| `src/components/allocations/MergeRequestsDialog.tsx` | Filter out busy vehicles/drivers |

---

## User Experience

### Empty state message updates
When no vehicles/drivers are available because they're all busy:
- **Vehicle**: "No available vehicles — all are assigned to trips on this date"
- **Driver**: "No available drivers — all are assigned to trips on this date"

### Optional: Show busy resources with indicator
Alternatively, show busy resources in the dropdown but disabled with a "Busy" badge, allowing users to see what's unavailable and why.

---

## Edge Cases Handled

1. **Multiple allocations on same day**: A vehicle can have multiple trips on the same day only if previous trips are completed
2. **Cancelled allocations**: Vehicles/drivers with cancelled allocations are still available
3. **Completed trips**: Once a trip is completed, the vehicle/driver becomes available again
4. **Pool allocations**: Works correctly with pooled trips since they also create allocation records

---

## Testing Checklist
1. Create allocation A with Vehicle X and Driver Y for Feb 3
2. Try to create allocation B with same vehicle/driver on Feb 3 — should NOT be available
3. Complete allocation A
4. Try again — Vehicle X and Driver Y should now be available
5. Verify cancelled allocations don't block resources
