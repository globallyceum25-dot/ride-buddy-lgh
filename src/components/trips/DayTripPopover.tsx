import { format } from 'date-fns';
import { Car, Users } from 'lucide-react';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AllocationStatusBadge } from '@/components/allocations/AllocationStatusBadge';
import type { AllocationStatus } from '@/hooks/useAllocations';

export interface MonthTripPreview {
  id: string;
  time: string;
  pickup: string;
  dropoff: string;
  status: AllocationStatus;
  vehicleReg: string | null;
  driverName: string | null;
  passengerCount: number;
  isPooled: boolean;
}

interface DayTripPopoverProps {
  date: Date;
  trips: MonthTripPreview[];
  onSelectDate: (date: Date) => void;
  children: React.ReactNode;
}

function TripPreviewRow({ trip }: { trip: MonthTripPreview }) {
  return (
    <div className="p-3 hover:bg-accent/50 transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium">{trip.time}</span>
          <AllocationStatusBadge status={trip.status} />
        </div>
        {trip.isPooled && (
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
            POOL
          </Badge>
        )}
      </div>
      <p className="text-sm truncate">
        {trip.pickup} → {trip.dropoff}
      </p>
      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
        {trip.vehicleReg && (
          <span className="flex items-center gap-1">
            <Car className="h-3 w-3" />
            {trip.vehicleReg}
          </span>
        )}
        {trip.driverName && <span>{trip.driverName}</span>}
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {trip.passengerCount}
        </span>
      </div>
    </div>
  );
}

export function DayTripPopover({
  date,
  trips = [],
  onSelectDate,
  children,
}: DayTripPopoverProps) {
  const tripCount = trips?.length ?? 0;
  
  if (tripCount === 0) {
    return <>{children}</>;
  }

  return (
    <HoverCard openDelay={300} closeDelay={150}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>
      <HoverCardContent side="right" align="start" className="w-80 p-0">
        {/* Day header */}
        <div className="p-3 border-b bg-muted/30">
          <h4 className="font-semibold">{format(date, 'EEEE, MMMM d')}</h4>
          <p className="text-xs text-muted-foreground">
            {tripCount} scheduled trip{tripCount !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Trip list (max 5, scrollable if more) */}
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y">
            {trips.slice(0, 5).map((trip) => (
              <TripPreviewRow key={trip.id} trip={trip} />
            ))}
          </div>
          {tripCount > 5 && (
            <div className="p-2 text-center text-sm text-muted-foreground border-t">
              +{tripCount - 5} more trip{tripCount - 5 !== 1 ? 's' : ''}
            </div>
          )}
        </ScrollArea>

        {/* Footer action */}
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDate(date);
            }}
          >
            View all trips for this day →
          </Button>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
