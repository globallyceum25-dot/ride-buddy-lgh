import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { KanbanColumn } from './KanbanColumn';
import { AllocationCard } from './AllocationCard';
import { TripTrackingDialog } from './TripTrackingDialog';
import {
  Allocation,
  AllocationStatus,
  useAllocations,
  useUpdateAllocationStatus,
  useBulkUpdateAllocationStatus,
  useCancelAllocation,
} from '@/hooks/useAllocations';

interface ColumnConfig {
  id: AllocationStatus;
  title: string;
  color: string;
  headerGradient: string;
  allowedTransitionsFrom: AllocationStatus[];
}

const columns: ColumnConfig[] = [
  {
    id: 'scheduled',
    title: 'Pending',
    color: 'bg-info',
    headerGradient: 'bg-gradient-to-r from-info/20 to-info/10',
    allowedTransitionsFrom: [],
  },
  {
    id: 'dispatched',
    title: 'Dispatched',
    color: 'bg-warning',
    headerGradient: 'bg-gradient-to-r from-warning/20 to-warning/10',
    allowedTransitionsFrom: ['scheduled'],
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'bg-primary',
    headerGradient: 'bg-gradient-to-r from-primary/20 to-primary/10',
    allowedTransitionsFrom: ['dispatched'],
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-success',
    headerGradient: 'bg-gradient-to-r from-success/20 to-success/10',
    allowedTransitionsFrom: ['in_progress'],
  },
];

interface KanbanBoardProps {
  searchQuery: string;
  dateFilter: Date | undefined;
}

export function KanbanBoard({ searchQuery, dateFilter }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [trackingAllocation, setTrackingAllocation] = useState<Allocation | null>(null);
  const [trackingMode, setTrackingMode] = useState<'start' | 'complete'>('start');
  
  // State for tracking pooled trips
  const [trackingPool, setTrackingPool] = useState<{
    allocations: Allocation[];
    targetStatus: AllocationStatus;
  } | null>(null);

  const { data: allocations = [], isLoading } = useAllocations();
  const updateStatus = useUpdateAllocationStatus();
  const bulkUpdateStatus = useBulkUpdateAllocationStatus();
  const cancelAllocation = useCancelAllocation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Filter allocations by search and date
  const filteredAllocations = useMemo(() => {
    let result = allocations;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.request?.request_number?.toLowerCase().includes(query) ||
          a.vehicle?.registration_number?.toLowerCase().includes(query) ||
          (a as any).requester?.full_name?.toLowerCase().includes(query)
      );
    }

    if (dateFilter) {
      const filterDate = format(dateFilter, 'yyyy-MM-dd');
      result = result.filter(
        (a) => format(new Date(a.scheduled_pickup), 'yyyy-MM-dd') === filterDate
      );
    }

    return result;
  }, [allocations, searchQuery, dateFilter]);

  // Group allocations by status
  const groupedAllocations = useMemo(() => {
    const groups: Record<AllocationStatus, typeof filteredAllocations> = {
      scheduled: [],
      dispatched: [],
      in_progress: [],
      completed: [],
      cancelled: [],
    };

    filteredAllocations.forEach((allocation) => {
      if (groups[allocation.status]) {
        groups[allocation.status].push(allocation);
      }
    });

    return groups;
  }, [filteredAllocations]);

  // Find allocation by ID
  const findAllocation = (id: string) => {
    return filteredAllocations.find((a) => a.id === id);
  };

  // Check if transition is valid
  const isValidTransition = (fromStatus: AllocationStatus, toStatus: AllocationStatus): boolean => {
    const targetColumn = columns.find((c) => c.id === toStatus);
    if (!targetColumn) return false;
    return targetColumn.allowedTransitionsFrom.includes(fromStatus);
  };

  // Check if transition requires additional data
  const requiresData = (toStatus: AllocationStatus): boolean => {
    return toStatus === 'in_progress' || toStatus === 'completed';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const over = event.over;
    if (over) {
      // Check if we're over a column
      const overData = over.data.current;
      if (overData?.type === 'column') {
        setOverId(over.id as string);
      } else {
        // Over another card - find its column
        const overAllocation = findAllocation(over.id as string);
        if (overAllocation) {
          setOverId(overAllocation.status);
        }
      }
    } else {
      setOverId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);

    if (!over) return;

    const activeId = active.id as string;
    const activeAllocation = findAllocation(activeId);
    if (!activeAllocation) return;

    // Determine target column
    let targetStatus: AllocationStatus;
    const overData = over.data.current;

    if (overData?.type === 'column') {
      targetStatus = overData.status;
    } else {
      // Dropped on a card, get that card's status
      const overAllocation = findAllocation(over.id as string);
      if (!overAllocation) return;
      targetStatus = overAllocation.status;
    }

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

      // Check if transition requires data
      if (requiresData(targetStatus)) {
        if (targetStatus === 'in_progress') {
          setTrackingPool({ allocations: poolAllocations, targetStatus });
          setTrackingMode('start');
        } else if (targetStatus === 'completed') {
          setTrackingPool({ allocations: poolAllocations, targetStatus });
          setTrackingMode('complete');
        }
        return;
      }

      // Bulk update all pool allocations
      bulkUpdateStatus.mutate({ ids: allIds, status: targetStatus });
      return;
    }

    // Single allocation update
    if (requiresData(targetStatus)) {
      if (targetStatus === 'in_progress') {
        setTrackingAllocation(activeAllocation);
        setTrackingMode('start');
      } else if (targetStatus === 'completed') {
        setTrackingAllocation(activeAllocation);
        setTrackingMode('complete');
      }
      return;
    }

    // Direct status update
    updateStatus.mutate({ id: activeId, status: targetStatus });
  };

  const handleStartTrip = (allocation: Allocation) => {
    // Check if this allocation is part of a pool
    if (allocation.pool_id) {
      const poolAllocations = filteredAllocations.filter(
        (a) => a.pool_id === allocation.pool_id
      );
      setTrackingPool({ allocations: poolAllocations, targetStatus: 'in_progress' });
    } else {
      setTrackingAllocation(allocation);
    }
    setTrackingMode('start');
  };

  const handleCompleteTrip = (allocation: Allocation) => {
    // Check if this allocation is part of a pool
    if (allocation.pool_id) {
      const poolAllocations = filteredAllocations.filter(
        (a) => a.pool_id === allocation.pool_id
      );
      setTrackingPool({ allocations: poolAllocations, targetStatus: 'completed' });
    } else {
      setTrackingAllocation(allocation);
    }
    setTrackingMode('complete');
  };

  const handleCancel = (allocation: Allocation) => {
    // Individual cancellation - even for pooled trips
    const isPooled = !!allocation.pool_id;
    const message = isPooled
      ? 'This will cancel only this allocation, not the entire pool. The request will return to "Approved" status. Continue?'
      : 'Are you sure you want to cancel this allocation? The request will return to "Approved" status.';
    
    if (confirm(message)) {
      cancelAllocation.mutate(allocation.id);
    }
  };

  const handleDispatch = (allocation: Allocation) => {
    // Check if this allocation is part of a pool
    if (allocation.pool_id) {
      const poolAllocations = filteredAllocations.filter(
        (a) => a.pool_id === allocation.pool_id
      );
      const allIds = poolAllocations.map((a) => a.id);
      bulkUpdateStatus.mutate({ ids: allIds, status: 'dispatched' });
    } else {
      updateStatus.mutate({ id: allocation.id, status: 'dispatched' });
    }
  };

  const handleTrackingSubmit = (data: {
    odometer_start?: number;
    odometer_end?: number;
    actual_pickup?: string;
    actual_dropoff?: string;
  }) => {
    // Handle pooled trip tracking
    if (trackingPool) {
      const newStatus = trackingPool.targetStatus;
      const allIds = trackingPool.allocations.map((a) => a.id);
      const vehicle_id = trackingPool.allocations[0]?.vehicle_id;

      bulkUpdateStatus.mutate(
        {
          ids: allIds,
          status: newStatus,
          vehicle_id,
          ...data,
        },
        {
          onSuccess: () => {
            setTrackingPool(null);
          },
        }
      );
      return;
    }

    // Handle single allocation tracking
    if (!trackingAllocation) return;

    const newStatus: AllocationStatus =
      trackingMode === 'start' ? 'in_progress' : 'completed';

    updateStatus.mutate(
      {
        id: trackingAllocation.id,
        status: newStatus,
        vehicle_id: trackingAllocation.vehicle_id,
        ...data,
      },
      {
        onSuccess: () => {
          setTrackingAllocation(null);
        },
      }
    );
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setTrackingAllocation(null);
      setTrackingPool(null);
    }
  };

  const activeAllocation = activeId ? findAllocation(activeId) : null;

  // Get the allocation to show in dialog (single or first of pool)
  const dialogAllocation = trackingPool
    ? trackingPool.allocations[0]
    : trackingAllocation;

  const dialogPoolCount = trackingPool ? trackingPool.allocations.length : undefined;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading allocations...</p>
      </div>
    );
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
          {columns
            .filter((col) => col.id !== 'cancelled')
            .map((column) => (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                headerGradient={column.headerGradient}
                allocations={groupedAllocations[column.id] || []}
                onStartTrip={handleStartTrip}
                onCompleteTrip={handleCompleteTrip}
                onCancel={handleCancel}
                onDispatch={handleDispatch}
                isOver={overId === column.id}
              />
            ))}
        </div>

        <DragOverlay>
          {activeAllocation && (
            <AllocationCard
              allocation={activeAllocation}
              isDragging
            />
          )}
        </DragOverlay>
      </DndContext>

      <TripTrackingDialog
        open={!!dialogAllocation}
        onOpenChange={handleDialogClose}
        allocation={dialogAllocation}
        mode={trackingMode}
        onSubmit={handleTrackingSubmit}
        isLoading={updateStatus.isPending || bulkUpdateStatus.isPending}
        poolCount={dialogPoolCount}
      />
    </>
  );
}
