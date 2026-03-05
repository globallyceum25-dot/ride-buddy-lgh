import { format } from 'date-fns';
import { MapPin, Car, Users, Clock, Play, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { AllocationStatusBadge } from '@/components/allocations/AllocationStatusBadge';
import type { ScheduledTrip } from '@/hooks/useTripSchedule';
import { cn } from '@/lib/utils';

interface TripPreviewCardProps {
  trip: ScheduledTrip;
  onStartTrip?: (trip: ScheduledTrip) => void;
  onCompleteTrip?: (trip: ScheduledTrip) => void;
  children: React.ReactNode;
}

export function TripPreviewCard({ 
  trip, 
  onStartTrip, 
  onCompleteTrip,
  children 
}: TripPreviewCardProps) {
  const formattedTime = format(new Date(trip.scheduledTime), 'h:mm a');

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        side="right" 
        align="start"
        className="w-80 p-0 animate-scale-in"
        sideOffset={8}
      >
        <div className="p-4 space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-semibold">{formattedTime}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {trip.pool ? trip.pool.number : trip.request?.number}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              {trip.type === 'pooled' && (
                <Badge variant="secondary" className="text-xs">
                  POOLED
                </Badge>
              )}
              <AllocationStatusBadge status={trip.status} />
            </div>
          </div>

          {/* Route visualization */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-success ring-2 ring-success/20" />
              <div className="w-0.5 h-8 bg-gradient-to-b from-success to-destructive rounded-full" />
              <div className="w-2.5 h-2.5 rounded-full bg-destructive ring-2 ring-destructive/20" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Pickup</p>
                {trip.pickupName && <p className="text-sm font-medium line-clamp-1">{trip.pickupName}</p>}
                <p className={cn("text-sm line-clamp-1", trip.pickupName ? "text-xs text-muted-foreground" : "font-medium")}>{trip.pickup}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Drop-off</p>
                {trip.dropoffName && <p className="text-sm font-medium line-clamp-1">{trip.dropoffName}</p>}
                <p className={cn("text-sm line-clamp-1", trip.dropoffName ? "text-xs text-muted-foreground" : "font-medium")}>{trip.dropoff}</p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {trip.vehicle && (
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{trip.vehicle.registration}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{trip.passengerCount} passengers</span>
            </div>
          </div>

          {trip.driver && (
            <div className="text-sm">
              <span className="text-muted-foreground">Driver: </span>
              <span className="font-medium">{trip.driver.name}</span>
            </div>
          )}

          {trip.pool && (
            <div className="text-sm text-muted-foreground">
              Pool includes {trip.pool.requestCount} requests
            </div>
          )}

          {/* Actions */}
          {(trip.canStartTrip || trip.canCompleteTrip) && (
            <div className="flex gap-2 pt-2 border-t">
              {trip.canStartTrip && onStartTrip && (
                <Button 
                  size="sm" 
                  onClick={(e) => {
                    e.stopPropagation();
                    onStartTrip(trip);
                  }}
                  className="flex-1"
                >
                  <Play className="h-4 w-4 mr-1" />
                  Start Trip
                </Button>
              )}
              {trip.canCompleteTrip && onCompleteTrip && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCompleteTrip(trip);
                  }}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Complete
                </Button>
              )}
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Compact trip block for timeline views
interface TripBlockProps {
  trip: ScheduledTrip;
  onClick?: () => void;
  onStartTrip?: (trip: ScheduledTrip) => void;
  onCompleteTrip?: (trip: ScheduledTrip) => void;
}

export function TripBlock({ trip, onClick, onStartTrip, onCompleteTrip }: TripBlockProps) {
  const formattedTime = format(new Date(trip.scheduledTime), 'HH:mm');
  
  const statusColors: Record<string, string> = {
    scheduled: 'bg-info/20 border-info text-info-foreground hover:bg-info/30',
    dispatched: 'bg-warning/20 border-warning text-warning-foreground hover:bg-warning/30',
    in_progress: 'bg-primary/20 border-primary text-primary hover:bg-primary/30',
    completed: 'bg-success/20 border-success text-success-foreground hover:bg-success/30',
    cancelled: 'bg-muted border-muted-foreground/30 text-muted-foreground',
  };

  return (
    <TripPreviewCard trip={trip} onStartTrip={onStartTrip} onCompleteTrip={onCompleteTrip}>
      <button
        onClick={onClick}
        className={cn(
          'w-full text-left p-2 rounded-md border-l-3 transition-all duration-150',
          'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50',
          statusColors[trip.status] || statusColors.scheduled
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-xs font-medium">{formattedTime}</span>
          {trip.type === 'pooled' && (
            <Badge variant="outline" className="text-[10px] px-1 py-0">
              POOL
            </Badge>
          )}
        </div>
        <p className="text-xs truncate mt-0.5">
          {trip.pickupName || trip.pickup} → {trip.dropoffName || trip.dropoff}
        </p>
        {trip.vehicle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
            {trip.vehicle.registration}
          </p>
        )}
      </button>
    </TripPreviewCard>
  );
}
