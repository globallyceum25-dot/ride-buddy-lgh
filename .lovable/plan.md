

# Move Pooled Trips Together

## Overview

When any card in a pooled trip is dragged to a different column, all other allocations in the same pool should automatically move to the same column. This ensures pooled trips remain synchronized since they share the same vehicle and driver.

## Current State

- Individual cards can be dragged between columns
- Pooled trips are visually grouped but move independently
- `handleDragEnd` in `KanbanBoard.tsx` only updates the single dragged allocation
- `useUpdateAllocationStatus` updates one allocation at a time

## Proposed Behavior

When a pooled allocation is moved:
1. Detect if the dragged allocation has a `pool_id`
2. Find all other allocations in the same pool
3. Validate the transition is valid for ALL allocations in the pool
4. Update ALL allocations in the pool to the new status together
5. If transition requires data (odometer), apply to all pooled allocations

```text
BEFORE DRAG:                    AFTER DRAG:
+----------+ +----------+       +----------+ +----------+
| Pending  | |Dispatched|       | Pending  | |Dispatched|
+----------+ +----------+       +----------+ +----------+
| Pool A   |                    |          | | Pool A   |
| ├ REQ-1  |  ← Drag REQ-1      |          | | ├ REQ-1  |
| └ REQ-2  |    to Dispatched   |          | | └ REQ-2  |
+----------+ +----------+       +----------+ +----------+

Both REQ-1 and REQ-2 move together automatically
```

## Implementation Plan

### Phase 1: Create Bulk Status Update Hook

Add `useBulkUpdateAllocationStatus` hook to update multiple allocations at once:

```typescript
export function useBulkUpdateAllocationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ids, status, ...updates }: { 
      ids: string[]; 
      status: AllocationStatus;
      // ... other fields
    }) => {
      const { data, error } = await supabase
        .from('allocations')
        .update({ status, ...updates })
        .in('id', ids)
        .select();
      
      if (error) throw error;
      
      // Update associated request statuses
      // Update vehicle odometer if completing
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      toast.success('Pool status updated');
    },
  });
}
```

### Phase 2: Update KanbanBoard Drag Logic

Modify `handleDragEnd` to detect pooled trips and move all together:

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  // ... existing validation ...
  
  const activeAllocation = findAllocation(activeId);
  
  // Check if this is a pooled trip
  if (activeAllocation.pool_id) {
    // Find all allocations in the same pool
    const poolAllocations = filteredAllocations.filter(
      a => a.pool_id === activeAllocation.pool_id
    );
    
    // Validate transition for all
    const allValid = poolAllocations.every(
      a => a.status === activeAllocation.status
    );
    
    if (!allValid) {
      toast.error('Pool allocations have mixed statuses');
      return;
    }
    
    // Move all together
    const allIds = poolAllocations.map(a => a.id);
    
    if (requiresData(targetStatus)) {
      // Set state for bulk update with odometer
      setTrackingPool({ allocations: poolAllocations, targetStatus });
      return;
    }
    
    bulkUpdateStatus.mutate({ ids: allIds, status: targetStatus });
  } else {
    // Existing single allocation update
    updateStatus.mutate({ id: activeId, status: targetStatus });
  }
};
```

### Phase 3: Update Tracking Dialog for Pools

Modify `TripTrackingDialog` to handle multiple allocations:

```typescript
interface TripTrackingDialogProps {
  allocation: Allocation | null;
  poolAllocations?: Allocation[];  // NEW: For bulk updates
  // ...
}

// Submit handler updates all allocations in pool
const handleTrackingSubmit = (data) => {
  if (trackingPool) {
    const allIds = trackingPool.allocations.map(a => a.id);
    bulkUpdateStatus.mutate({
      ids: allIds,
      status: trackingPool.targetStatus,
      ...data,
    });
  } else if (trackingAllocation) {
    updateStatus.mutate({ id: trackingAllocation.id, ... });
  }
};
```

## Files to Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useAllocations.ts` | Update | Add `useBulkUpdateAllocationStatus` hook |
| `src/components/allocations/KanbanBoard.tsx` | Update | Modify drag handler to move pools together |
| `src/components/allocations/TripTrackingDialog.tsx` | Update | Support bulk allocation updates |

## Technical Details

### Bulk Update Hook

```typescript
export function useBulkUpdateAllocationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      ids, 
      status, 
      vehicle_id,
      ...updates 
    }: { 
      ids: string[]; 
      status: AllocationStatus;
      vehicle_id?: string | null;
      actual_pickup?: string;
      actual_dropoff?: string;
      odometer_start?: number;
      odometer_end?: number;
    }) => {
      // Update all allocations in the pool
      const { data, error } = await supabase
        .from('allocations')
        .update({ status, ...updates })
        .in('id', ids)
        .select('id, request_id');
      
      if (error) throw error;
      
      // Update travel request statuses
      const requestStatusMap: Record<AllocationStatus, string | null> = {
        'dispatched': null,
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': null,
        'scheduled': null,
      };
      
      if (requestStatusMap[status] && data) {
        const requestIds = data.map(a => a.request_id);
        await supabase
          .from('travel_requests')
          .update({ status: requestStatusMap[status] })
          .in('id', requestIds);
      }
      
      // Update vehicle odometer when trip completes
      if (status === 'completed' && updates.odometer_end && vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ odometer: updates.odometer_end })
          .eq('id', vehicle_id);
      }
      
      return data;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(`Updated ${ids.length} allocations`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update allocations: ${error.message}`);
    },
  });
}
```

### Updated KanbanBoard State

```typescript
// New state for tracking pool movements
const [trackingPool, setTrackingPool] = useState<{
  allocations: Allocation[];
  targetStatus: AllocationStatus;
} | null>(null);

// Use bulk update hook
const bulkUpdateStatus = useBulkUpdateAllocationStatus();
```

### Modified Drag End Handler

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveId(null);
  setOverId(null);

  if (!over) return;

  const activeId = active.id as string;
  const activeAllocation = findAllocation(activeId);
  if (!activeAllocation) return;

  // Determine target column...
  
  // Skip if dropped in same column
  if (activeAllocation.status === targetStatus) return;

  // Validate transition
  if (!isValidTransition(activeAllocation.status, targetStatus)) {
    toast.error(`Cannot move directly to ${columns.find((c) => c.id === targetStatus)?.title}`);
    return;
  }

  // Handle pooled trips - move all together
  if (activeAllocation.pool_id) {
    const poolAllocations = filteredAllocations.filter(
      (a) => a.pool_id === activeAllocation.pool_id
    );

    // Verify all pool allocations are in the same status
    const allSameStatus = poolAllocations.every(
      (a) => a.status === activeAllocation.status
    );
    if (!allSameStatus) {
      toast.error('Pool has allocations in different statuses');
      return;
    }

    const allIds = poolAllocations.map((a) => a.id);

    if (requiresData(targetStatus)) {
      setTrackingPool({ allocations: poolAllocations, targetStatus });
      return;
    }

    // Bulk update all pool allocations
    bulkUpdateStatus.mutate({ ids: allIds, status: targetStatus });
    toast.success(`Moved ${poolAllocations.length} pooled trips`);
  } else {
    // Single allocation update (existing logic)
    if (requiresData(targetStatus)) {
      // ... existing tracking dialog logic
    } else {
      updateStatus.mutate({ id: activeId, status: targetStatus });
    }
  }
};
```

## User Experience

- **Visual feedback**: When dragging a pooled card, show a badge indicating "Moving X trips"
- **Toast message**: "Moved 3 pooled trips to Dispatched"
- **Odometer entry**: Single odometer value applies to all trips in pool (shared vehicle)
- **Validation**: Prevents moving if pool allocations are in mixed states

## Edge Cases Handled

1. **Mixed statuses in pool**: Show error, prevent move
2. **Individual card in pool**: Moves entire pool, not just the card
3. **Odometer for pool**: One entry, applies to shared vehicle
4. **Cancel in pool**: Each allocation can be cancelled individually (special case)

