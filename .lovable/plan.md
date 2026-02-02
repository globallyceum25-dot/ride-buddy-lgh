
# Trip Tracking with Odometer Recording

## Overview
Add trip tracking dialogs that capture odometer readings when trips start and complete. This provides accurate mileage data for reporting and vehicle maintenance tracking.

---

## Components to Create

### 1. TripTrackingDialog Component
A reusable dialog for both "Start Trip" and "Complete Trip" actions.

| Mode | Fields Captured |
|------|-----------------|
| Start | odometer_start, actual_pickup (auto: now) |
| Complete | odometer_end, actual_dropoff (auto: now) |

**Features:**
- Displays current allocation details (vehicle, route, driver)
- Shows vehicle's last known odometer reading for reference
- Validates odometer_end > odometer_start
- Auto-populates timestamp to current time

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `src/components/allocations/TripTrackingDialog.tsx` | Create | Dialog for odometer entry |
| `src/pages/Allocations.tsx` | Modify | Add dialog state and triggers |
| `src/hooks/useAllocations.ts` | Modify | Add vehicle odometer update on trip complete |

---

## UI Design

### Start Trip Dialog
```
+------------------------------------------+
| Start Trip                           [X] |
+------------------------------------------+
| Request: TR-2026-0001                    |
| Vehicle: ABC-1234 (Toyota Hiace)         |
| Route: HQ → Airport                      |
|                                          |
| Starting Odometer *                      |
| [123456_______] km                       |
| Last reading: 123,400 km                 |
|                                          |
| Pickup Time                              |
| [Feb 2, 2026 10:30 AM] (auto)           |
|                                          |
|              [Cancel] [Start Trip]       |
+------------------------------------------+
```

### Complete Trip Dialog
```
+------------------------------------------+
| Complete Trip                        [X] |
+------------------------------------------+
| Request: TR-2026-0001                    |
| Started: Feb 2, 10:30 AM (123,456 km)   |
|                                          |
| Ending Odometer *                        |
| [123512_______] km                       |
| Trip distance: 56 km                     |
|                                          |
| Dropoff Time                             |
| [Feb 2, 2026 11:45 AM] (auto)           |
|                                          |
|              [Cancel] [Complete Trip]    |
+------------------------------------------+
```

---

## Implementation Details

### TripTrackingDialog Props
```typescript
interface TripTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: Allocation | null;
  mode: 'start' | 'complete';
}
```

### Validation Rules
- **Start Trip**: odometer_start required, must be >= vehicle's last reading
- **Complete Trip**: odometer_end required, must be > odometer_start

### Post-Completion Actions
When trip completes:
1. Update allocation with odometer_end and actual_dropoff
2. Update vehicle's odometer field with new reading
3. Change allocation status to 'completed'
4. Change travel request status to 'completed'

---

## Active Allocations Table Enhancements

Add columns to show trip progress:

| Column | Shows |
|--------|-------|
| Odometer | Start reading (if started), or "—" |
| Distance | Calculated km (on completion), or "In progress" |

---

## Code Changes Summary

### useAllocations.ts
Add logic to update vehicle odometer when trip completes:
```typescript
// In useUpdateAllocationStatus mutation
if (status === 'completed' && updates.odometer_end) {
  // Update vehicle's current odometer
  await supabase
    .from('vehicles')
    .update({ odometer: updates.odometer_end })
    .eq('id', allocation.vehicle_id);
}
```

### Allocations.tsx
Replace direct status updates with dialog triggers:
```typescript
// State for tracking dialog
const [trackingAllocation, setTrackingAllocation] = useState(null);
const [trackingMode, setTrackingMode] = useState<'start' | 'complete'>('start');

// In dropdown menu actions
onClick={() => {
  setTrackingAllocation(allocation);
  setTrackingMode('start');
}}
```

---

## Implementation Order

1. Create `TripTrackingDialog.tsx` component
2. Update `useAllocations.ts` to update vehicle odometer on completion
3. Modify `Allocations.tsx` to use the new dialog
4. Add odometer display columns to active allocations table
