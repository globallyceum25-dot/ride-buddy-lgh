import { format } from 'date-fns';
import { Clock, MapPin, Car, Users, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AllocationStatusBadge } from '@/components/allocations/AllocationStatusBadge';
import { cn } from '@/lib/utils';
import type { MonthTripPreview } from '@/hooks/useTripSchedule';
import type { AllocationStatus } from '@/hooks/useAllocations';

interface AgendaTripCardProps {
  trip: MonthTripPreview;
  canStart?: boolean;
  canComplete?: boolean;
  onStart?: () => void;
  onComplete?: () => void;
}

const statusBarColors: Record<AllocationStatus, string> = {
  scheduled: 'bg-info',
  dispatched: 'bg-warning',
  in_progress: 'bg-primary',
  completed: 'bg-success',
  cancelled: 'bg-muted',
};

export function AgendaTripCard({ 
  trip, 
  canStart = false, 
  canComplete = false,
  onStart, 
  onComplete 
}: AgendaTripCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className={cn("h-1 w-full", statusBarColors[trip.status])} />
      <CardContent className="p-3 space-y-2">
        {/* Time & Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold font-mono">{trip.time}</span>
          </div>
          <div className="flex items-center gap-2">
            {trip.isPooled && (
              <Badge variant="secondary" className="text-[10px]">POOL</Badge>
            )}
            <AllocationStatusBadge status={trip.status} />
          </div>
        </div>
        
        {/* Route */}
        <div className="space-y-1">
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div className="min-w-0">
              {trip.pickupName && <span className="font-medium block truncate">{trip.pickupName}</span>}
              <span className={cn("truncate block", trip.pickupName && "text-xs text-muted-foreground")}>{trip.pickup}</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
            <div className="min-w-0">
              {trip.dropoffName && <span className="font-medium block truncate">{trip.dropoffName}</span>}
              <span className={cn("truncate block", trip.dropoffName && "text-xs text-muted-foreground")}>{trip.dropoff}</span>
            </div>
          </div>
        </div>
        
        {/* Resources */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
          {trip.vehicleReg && (
            <span className="flex items-center gap-1">
              <Car className="h-3 w-3" /> {trip.vehicleReg}
            </span>
          )}
          {trip.driverName && (
            <span className="truncate">{trip.driverName}</span>
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {trip.passengerCount}
          </span>
        </div>
        
        {/* Actions */}
        {(canStart || canComplete) && (
          <div className="flex gap-2 pt-2 border-t">
            {canStart && onStart && (
              <Button size="sm" className="flex-1" onClick={onStart}>
                <Play className="h-3 w-3 mr-1" /> Start
              </Button>
            )}
            {canComplete && onComplete && (
              <Button size="sm" variant="outline" className="flex-1" onClick={onComplete}>
                <CheckCircle className="h-3 w-3 mr-1" /> Complete
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
