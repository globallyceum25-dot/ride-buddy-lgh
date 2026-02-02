import { format } from 'date-fns';
import { Car, Clock, MapPin, Users, Play, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AllocationStatusBadge } from '@/components/allocations/AllocationStatusBadge';
import type { ScheduledTrip } from '@/hooks/useTripSchedule';

interface TripCardProps {
  trip: ScheduledTrip;
  onStartTrip?: (trip: ScheduledTrip) => void;
  onCompleteTrip?: (trip: ScheduledTrip) => void;
  compact?: boolean;
}

export function TripCard({ trip, onStartTrip, onCompleteTrip, compact = false }: TripCardProps) {
  const formattedTime = format(new Date(trip.scheduledTime), 'h:mm a');

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm">{formattedTime}</span>
          <span className="text-sm text-muted-foreground">
            {trip.pickup} → {trip.dropoff}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {trip.passengerCount} <Users className="h-3 w-3 ml-1" />
          </Badge>
          <AllocationStatusBadge status={trip.status} />
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">{formattedTime}</span>
          </div>
          <div className="flex items-center gap-2">
            {trip.type === 'pooled' && (
              <Badge variant="secondary" className="text-xs">
                POOLED
              </Badge>
            )}
            <AllocationStatusBadge status={trip.status} />
          </div>
        </div>

        {/* Route */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {trip.pickup} → {trip.dropoff}
          </span>
        </div>

        {/* Request Info */}
        <div className="flex items-center justify-between text-sm">
          <span className="font-mono text-xs text-muted-foreground">
            {trip.pool ? trip.pool.number : trip.request?.number}
          </span>
          {trip.pool ? (
            <span className="text-muted-foreground">
              {trip.pool.requestCount} requests
            </span>
          ) : (
            <span className="text-muted-foreground">
              {trip.request?.requester}
            </span>
          )}
        </div>

        {/* Vehicle & Driver */}
        <div className="flex items-center gap-4 text-sm border-t pt-3">
          {trip.vehicle && (
            <div className="flex items-center gap-1.5">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span>
                {trip.vehicle.registration}
                {trip.vehicle.makeModel && (
                  <span className="text-muted-foreground ml-1">
                    ({trip.vehicle.makeModel})
                  </span>
                )}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{trip.passengerCount} passengers</span>
          </div>
        </div>

        {trip.driver && (
          <div className="text-sm text-muted-foreground">
            Driver: {trip.driver.name}
          </div>
        )}

        {/* Actions */}
        {(trip.canStartTrip || trip.canCompleteTrip) && (
          <div className="flex justify-end gap-2 border-t pt-3">
            {trip.canStartTrip && onStartTrip && (
              <Button size="sm" onClick={() => onStartTrip(trip)}>
                <Play className="h-4 w-4 mr-1" />
                Start Trip
              </Button>
            )}
            {trip.canCompleteTrip && onCompleteTrip && (
              <Button size="sm" variant="outline" onClick={() => onCompleteTrip(trip)}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Complete Trip
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
