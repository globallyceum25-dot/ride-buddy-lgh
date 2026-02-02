import { useMemo } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { AllocationCard } from './AllocationCard';
import { PoolGroup } from './PoolGroup';
import { Allocation, AllocationStatus } from '@/hooks/useAllocations';
import { ScrollArea } from '@/components/ui/scroll-area';

type EnrichedAllocation = Allocation & {
  requester?: { full_name: string; department: string | null } | null;
  driverProfile?: { full_name: string } | null;
  stops?: { location: string; stop_order: number }[];
  pool?: { pool_number: string | null } | null;
};

interface KanbanColumnProps {
  id: AllocationStatus;
  title: string;
  color: string;
  headerGradient: string;
  allocations: EnrichedAllocation[];
  onStartTrip: (allocation: Allocation) => void;
  onCompleteTrip: (allocation: Allocation) => void;
  onCancel: (allocation: Allocation) => void;
  onDispatch: (allocation: Allocation) => void;
  isOver?: boolean;
}

interface KanbanColumnContentProps {
  allocations: EnrichedAllocation[];
  onStartTrip: (allocation: Allocation) => void;
  onCompleteTrip: (allocation: Allocation) => void;
  onCancel: (allocation: Allocation) => void;
  onDispatch: (allocation: Allocation) => void;
}

function KanbanColumnContent({
  allocations,
  onStartTrip,
  onCompleteTrip,
  onCancel,
  onDispatch,
}: KanbanColumnContentProps) {
  // Separate pooled and non-pooled allocations
  const { pooledGroups, standaloneAllocations } = useMemo(() => {
    const pooled: Record<string, { poolNumber: string | null; allocations: EnrichedAllocation[] }> = {};
    const standalone: EnrichedAllocation[] = [];

    allocations.forEach((allocation) => {
      if (allocation.pool_id) {
        if (!pooled[allocation.pool_id]) {
          pooled[allocation.pool_id] = {
            poolNumber: allocation.pool?.pool_number || null,
            allocations: [],
          };
        }
        pooled[allocation.pool_id].allocations.push(allocation);
      } else {
        standalone.push(allocation);
      }
    });

    return {
      pooledGroups: Object.entries(pooled),
      standaloneAllocations: standalone,
    };
  }, [allocations]);

  if (allocations.length === 0) {
    return (
      <div className="p-3">
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>No trips</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3">
      {/* Render Pool Groups first */}
      {pooledGroups.map(([poolId, { poolNumber, allocations: poolAllocations }]) => (
        <PoolGroup
          key={poolId}
          poolId={poolId}
          poolNumber={poolNumber}
          allocations={poolAllocations}
          onStartTrip={onStartTrip}
          onCompleteTrip={onCompleteTrip}
          onCancel={onCancel}
          onDispatch={onDispatch}
        />
      ))}

      {/* Render standalone allocations */}
      {standaloneAllocations.map((allocation) => (
        <AllocationCard
          key={allocation.id}
          allocation={allocation}
          onStartTrip={() => onStartTrip(allocation)}
          onCompleteTrip={() => onCompleteTrip(allocation)}
          onCancel={() => onCancel(allocation)}
          onDispatch={() => onDispatch(allocation)}
        />
      ))}
    </div>
  );
}

export function KanbanColumn({
  id,
  title,
  color,
  headerGradient,
  allocations,
  onStartTrip,
  onCompleteTrip,
  onCancel,
  onDispatch,
  isOver = false,
}: KanbanColumnProps) {
  const { setNodeRef } = useDroppable({
    id,
    data: {
      type: 'column',
      status: id,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col bg-muted/30 rounded-xl min-w-[280px] max-w-[320px] flex-shrink-0',
        'border border-border/50 transition-all duration-200',
        isOver && 'ring-2 ring-primary ring-offset-2 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          'px-4 py-3 rounded-t-xl',
          headerGradient
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn('w-3 h-3 rounded-full', color)} />
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <span className="bg-background/80 text-foreground text-xs font-medium px-2 py-0.5 rounded-full">
            {allocations.length}
          </span>
        </div>
      </div>

      {/* Cards Container */}
      <ScrollArea className="flex-1 max-h-[calc(100vh-320px)]">
        <SortableContext
          items={allocations.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <KanbanColumnContent
            allocations={allocations}
            onStartTrip={onStartTrip}
            onCompleteTrip={onCompleteTrip}
            onCancel={onCancel}
            onDispatch={onDispatch}
          />
        </SortableContext>
      </ScrollArea>
    </div>
  );
}
