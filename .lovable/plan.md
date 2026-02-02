
# Add Tooltip for Busy Vehicle/Driver Assignments

## Overview
Enhance the allocation dialogs to show busy vehicles and drivers as disabled options with a tooltip that displays which trip they're already assigned to on that date.

---

## Current Behavior
- Busy vehicles/drivers are completely hidden from the selection dropdowns
- Users only see "No available vehicles/drivers" when all are busy

## New Behavior
- Show ALL vehicles/drivers in the dropdown
- Busy resources appear as disabled items with a "Busy" badge
- Hovering over a busy resource shows a tooltip with trip details:
  - Request number or Pool number
  - Pickup time
  - Route (pickup → dropoff)
  - Status

---

## Implementation

### 1. Enhance `useBusyResources` Hook
Expand the query to return allocation details, not just IDs.

**New return type:**
```typescript
interface BusyAllocation {
  vehicleId: string | null;
  driverId: string | null;
  requestNumber: string | null;
  poolNumber: string | null;
  scheduledPickup: string;
  pickup: string;
  dropoff: string;
  status: string;
}

interface BusyResources {
  busyVehicleIds: string[];
  busyDriverIds: string[];
  allocations: BusyAllocation[];  // Full details for tooltips
}
```

**Query changes:**
- Join with `travel_requests` to get request_number, pickup/dropoff locations
- Join with `trip_pools` to get pool_number if applicable

### 2. Update AllocationDialog
- Show all vehicles/drivers (available + busy)
- For busy items:
  - Add `disabled` prop to prevent selection
  - Wrap in Tooltip showing assignment details
  - Add visual "Busy" badge

**UI Example:**
```
┌─────────────────────────────────────────────────┐
│ ✓ ABC-1234 (Toyota Hiace • 12 seats)           │  ← Available
│ ─────────────────────────────────────────────── │
│ 🚫 XYZ-5678 (Honda City • 4 seats)   [Busy]    │  ← Disabled + Tooltip
│    Tooltip: "Assigned to TR-2026-001           │
│              9:00 AM • HQ → Airport            │
│              Status: In Progress"              │
└─────────────────────────────────────────────────┘
```

### 3. Update MergeRequestsDialog
Apply the same changes as AllocationDialog.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useBusyResources.ts` | Add allocation details to return value |
| `src/components/allocations/AllocationDialog.tsx` | Show busy items with tooltip |
| `src/components/allocations/MergeRequestsDialog.tsx` | Show busy items with tooltip |

---

## Technical Details

### Helper Function
Create a helper to get allocation details for a specific resource:

```typescript
const getResourceAllocation = (resourceId: string, type: 'vehicle' | 'driver') => {
  return busyResources?.allocations.find(a => 
    type === 'vehicle' ? a.vehicleId === resourceId : a.driverId === resourceId
  );
};
```

### Tooltip Content Component
```typescript
const BusyTooltipContent = ({ allocation }: { allocation: BusyAllocation }) => (
  <div className="space-y-1">
    <div className="font-medium">
      {allocation.poolNumber || allocation.requestNumber}
    </div>
    <div className="text-xs">
      {format(new Date(allocation.scheduledPickup), 'h:mm a')}
    </div>
    <div className="text-xs">
      {allocation.pickup} → {allocation.dropoff}
    </div>
    <div className="text-xs capitalize">
      Status: {allocation.status.replace('_', ' ')}
    </div>
  </div>
);
```

### Select Item Rendering
```tsx
{vehicles.map((vehicle) => {
  const isBusy = busyResources?.busyVehicleIds.includes(vehicle.id);
  const allocation = isBusy ? getResourceAllocation(vehicle.id, 'vehicle') : null;
  
  if (isBusy && allocation) {
    return (
      <Tooltip key={vehicle.id}>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-2 py-1.5 opacity-50 cursor-not-allowed">
            <Car className="h-4 w-4" />
            <span>{vehicle.registration_number}</span>
            <Badge variant="secondary" className="ml-auto">Busy</Badge>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <BusyTooltipContent allocation={allocation} />
        </TooltipContent>
      </Tooltip>
    );
  }
  
  return (
    <SelectItem key={vehicle.id} value={vehicle.id}>
      {/* ... normal rendering */}
    </SelectItem>
  );
})}
```

---

## Edge Cases

1. **Vehicle/driver assigned to multiple trips**: Show first upcoming allocation
2. **No pickup/dropoff info** (edge case): Show request number only
3. **Pool vs single trip**: Display appropriate identifier (POOL-xxx vs TR-xxx)

---

## Testing
1. Create an allocation with a vehicle and driver
2. Open AllocationDialog for another request on the same date
3. Verify the assigned vehicle/driver appears disabled with "Busy" badge
4. Hover and verify tooltip shows correct trip details
5. Verify available resources can still be selected normally
