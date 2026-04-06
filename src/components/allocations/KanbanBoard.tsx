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
import { Users, ChevronDown } from 'lucide-react';
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
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const [trackingPool, setTrackingPool] = useState<{
    allocations: Allocation[];
    targetStatus: AllocationStatus;
  } | null>(null);
  const [hoveredPoolId, setHoveredPoolId] = useState<string | null>(null);
  const [openColumns, setOpenColumns] = useState<string[]>(['scheduled', 'dispatched', 'in_progress']);

  const isMobile = useIsMobile();
  const { data: allocations = [], isLoading } = useAllocations();
  const updateStatus = useUpdateAllocationStatus();
  const bulkUpdateStatus = useBulkUpdateAllocationStatus();
  const cancelAllocation = useCancelAllocation();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredAllocations = useMemo(() => {
    let result = allocations;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.request?.request_number?.toLowerCase().includes(query) ||
          a.vehicle?.registration_number?.toLowerCase().includes(query) ||
          a.requester?.full_name?.toLowerCase().includes(query)
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

  const findAllocation = (id: string) => filteredAllocations.find((a) => a.id === id);

  const isValidTransition = (fromStatus: AllocationStatus, toStatus: AllocationStatus): boolean => {
    const targetColumn = columns.find((c) => c.id === toStatus);
    if (!targetColumn) return false;
    return targetColumn.allowedTransitionsFrom.includes(fromStatus);
  };

  const requiresData = (toStatus: AllocationStatus): boolean => {
    return toStatus === 'in_progress' || toStatus === 'completed';
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const over = event.over;
    if (over) {
      const overData = over.data.current;
      if (overData?.type === 'column') {
        setOverId(over.id as string);
      } else {
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

    const activeIdStr = active.id as string;
    const activeAllocation = findAllocation(activeIdStr);
    if (!activeAllocation) return;

    let targetStatus: AllocationStatus;
    const overData = over.data.current;
    if (overData?.type === 'column') {
      targetStatus = overData.status;
    } else {
      const overAllocation = findAllocation(over.id as string);
      if (!overAllocation) return;
      targetStatus = overAllocation.status;
    }

    if (activeAllocation.status === targetStatus) return;

    if (!isValidTransition(activeAllocation.status, targetStatus)) {
      toast.error(`Cannot move directly to ${columns.find((c) => c.id === targetStatus)?.title}`);
      return;
    }

    if (activeAllocation.pool_id) {
      const poolAllocations = filteredAllocations.filter(
        (a) => a.pool_id === activeAllocation.pool_id
      );
      const allSameStatus = poolAllocations.every(
        (a) => a.status === activeAllocation.status
      );
      if (!allSameStatus) {
        toast.error('Pool has allocations in different statuses');
        return;
      }
      const allIds = poolAllocations.map((a) => a.id);
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
      bulkUpdateStatus.mutate({ ids: allIds, status: targetStatus });
      return;
    }

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

    updateStatus.mutate({ id: activeIdStr, status: targetStatus });
  };

  const handleStartTrip = (allocation: Allocation) => {
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
    const isPooled = !!allocation.pool_id;
    const message = isPooled
      ? 'This will cancel only this allocation, not the entire pool. The request will return to "Approved" status. Continue?'
      : 'Are you sure you want to cancel this allocation? The request will return to "Approved" status.';
    if (confirm(message)) {
      cancelAllocation.mutate(allocation.id);
    }
  };

  const handleDispatch = (allocation: Allocation) => {
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
    if (trackingPool) {
      const newStatus = trackingPool.targetStatus;
      const allIds = trackingPool.allocations.map((a) => a.id);
      const vehicle_id = trackingPool.allocations[0]?.vehicle_id;
      bulkUpdateStatus.mutate(
        { ids: allIds, status: newStatus, vehicle_id, ...data },
        { onSuccess: () => setTrackingPool(null) }
      );
      return;
    }

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
      { onSuccess: () => setTrackingAllocation(null) }
    );
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setTrackingAllocation(null);
      setTrackingPool(null);
    }
  };

  const activeAllocation = activeId ? findAllocation(activeId) : null;
  const dragPoolCount = activeAllocation?.pool_id
    ? filteredAllocations.filter((a) => a.pool_id === activeAllocation.pool_id).length
    : undefined;
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

  // Mobile: vertical accordion layout
  if (isMobile) {
    return (
      <>
        <div className="space-y-3">
          {columns
            .filter((col) => col.id !== 'cancelled')
            .map((column) => {
              const colAllocations = groupedAllocations[column.id] || [];
              const isOpen = openColumns.includes(column.id);
              return (
                <Collapsible
                  key={column.id}
                  open={isOpen}
                  onOpenChange={(open) => {
                    setOpenColumns((prev) =>
                      open ? [...prev, column.id] : prev.filter((c) => c !== column.id)
                    );
                  }}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-3 h-3 rounded-full', column.color)} />
                      <span className="font-semibold text-sm">{column.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        {colAllocations.length}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        isOpen && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2 space-y-2">
                    {colAllocations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No allocations
                      </p>
                    ) : (
                      colAllocations.map((allocation) => (
                        <AllocationCard
                          key={allocation.id}
                          allocation={allocation}
                          onStartTrip={() => handleStartTrip(allocation)}
                          onCompleteTrip={() => handleCompleteTrip(allocation)}
                          onCancel={() => handleCancel(allocation)}
                          onDispatch={() => handleDispatch(allocation)}
                        />
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
        </div>

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

  // Desktop: drag-and-drop columns
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
                hoveredPoolId={hoveredPoolId}
                onPoolHover={setHoveredPoolId}
              />
            ))}
        </div>

        <DragOverlay>
          {activeAllocation && (
            <div className="relative">
              {dragPoolCount && dragPoolCount > 1 && (
                <div className="absolute -top-3 -right-2 z-10 flex items-center gap-1 bg-accent text-accent-foreground px-2 py-1 rounded-full text-xs font-semibold shadow-lg animate-pulse">
                  <Users className="h-3 w-3" />
                  Moving {dragPoolCount} trips
                </div>
              )}
              <AllocationCard allocation={activeAllocation} isDragging />
            </div>
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
