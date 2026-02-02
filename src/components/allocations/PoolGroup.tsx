import { useState } from 'react';
import { Users, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AllocationCard } from './AllocationCard';
import { Allocation } from '@/hooks/useAllocations';
import { cn } from '@/lib/utils';

interface PoolGroupProps {
  poolId: string;
  poolNumber?: string | null;
  allocations: Array<
    Allocation & {
      requester?: { full_name: string; department: string | null } | null;
      driverProfile?: { full_name: string } | null;
      stops?: { location: string; stop_order: number }[];
    }
  >;
  onStartTrip: (allocation: Allocation) => void;
  onCompleteTrip: (allocation: Allocation) => void;
  onCancel: (allocation: Allocation) => void;
  onDispatch: (allocation: Allocation) => void;
  isHighlighted?: boolean;
  onHover?: (poolId: string | null) => void;
}

export function PoolGroup({
  poolId,
  poolNumber,
  allocations,
  onStartTrip,
  onCompleteTrip,
  onCancel,
  onDispatch,
  isHighlighted = false,
  onHover,
}: PoolGroupProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const totalPassengers = allocations.reduce(
    (sum, a) => sum + (a.request?.passenger_count || 0),
    0
  );

  // Get shared vehicle/driver info from first allocation
  const sharedVehicle = allocations[0]?.vehicle?.registration_number;
  const sharedDriver = allocations[0]?.driverProfile?.full_name;

  const handleMouseEnter = () => {
    onHover?.(poolId);
  };

  const handleMouseLeave = () => {
    onHover?.(null);
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed',
        'bg-gradient-to-br from-accent/10 to-accent/5',
        'p-2 transition-all duration-200',
        isHighlighted
          ? 'border-primary ring-2 ring-primary/30 shadow-lg scale-[1.02]'
          : 'border-accent/50'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Pool Header - Clickable to toggle */}
      <div
        className={cn(
          'flex items-center justify-between',
          'px-2 py-1.5 rounded-md',
          'cursor-pointer select-none transition-colors',
          isHighlighted ? 'bg-primary/20' : 'bg-accent/20 hover:bg-accent/30',
          !isCollapsed && 'mb-2'
        )}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4 text-accent-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-accent-foreground" />
            )}
          </Button>
          <Users className="h-4 w-4 text-accent" />
          <span className="font-medium text-sm text-accent-foreground">
            {poolNumber ? `Pool ${poolNumber}` : 'Pooled Trip'}
          </span>
          {isCollapsed && (
            <span className="text-xs text-muted-foreground">
              ({allocations.length} trips)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isHighlighted && (
            <Badge variant="default" className="text-xs animate-pulse">
              Move together
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {totalPassengers} passengers
          </Badge>
        </div>
      </div>

      {/* Collapsed Summary */}
      {isCollapsed && (sharedVehicle || sharedDriver) && (
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          {sharedVehicle && <span>🚗 {sharedVehicle}</span>}
          {sharedDriver && <span>• {sharedDriver}</span>}
        </div>
      )}

      {/* Expanded Content */}
      {!isCollapsed && (
        <>
          {/* Shared Resources Info */}
          {(sharedVehicle || sharedDriver) && (
            <div className="flex items-center gap-2 px-2 mb-2 text-xs text-muted-foreground">
              {sharedVehicle && <span>🚗 {sharedVehicle}</span>}
              {sharedDriver && <span>• {sharedDriver}</span>}
            </div>
          )}

          {/* Grouped Cards */}
          <div className="space-y-1.5">
            {allocations.map((allocation) => (
              <AllocationCard
                key={allocation.id}
                allocation={allocation}
                isGrouped
                isPoolHighlighted={isHighlighted}
                onStartTrip={() => onStartTrip(allocation)}
                onCompleteTrip={() => onCompleteTrip(allocation)}
                onCancel={() => onCancel(allocation)}
                onDispatch={() => onDispatch(allocation)}
                onPoolHover={onHover}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
