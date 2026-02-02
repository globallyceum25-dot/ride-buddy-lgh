import { Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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
}

export function PoolGroup({
  poolNumber,
  allocations,
  onStartTrip,
  onCompleteTrip,
  onCancel,
  onDispatch,
}: PoolGroupProps) {
  const totalPassengers = allocations.reduce(
    (sum, a) => sum + (a.request?.passenger_count || 0),
    0
  );

  // Get shared vehicle/driver info from first allocation
  const sharedVehicle = allocations[0]?.vehicle?.registration_number;
  const sharedDriver = allocations[0]?.driverProfile?.full_name;

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-dashed border-accent/50',
        'bg-gradient-to-br from-accent/10 to-accent/5',
        'p-2'
      )}
    >
      {/* Pool Header */}
      <div
        className={cn(
          'flex items-center justify-between',
          'px-2 py-1.5 mb-2 rounded-md bg-accent/20'
        )}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <span className="font-medium text-sm text-accent-foreground">
            {poolNumber ? `Pool ${poolNumber}` : 'Pooled Trip'}
          </span>
        </div>
        <Badge variant="secondary" className="text-xs">
          {totalPassengers} passengers
        </Badge>
      </div>

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
            onStartTrip={() => onStartTrip(allocation)}
            onCompleteTrip={() => onCompleteTrip(allocation)}
            onCancel={() => onCancel(allocation)}
            onDispatch={() => onDispatch(allocation)}
          />
        ))}
      </div>
    </div>
  );
}
