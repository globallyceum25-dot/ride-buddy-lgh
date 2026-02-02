import { TripCard } from './TripCard';
import type { DaySchedule, ScheduledTrip } from '@/hooks/useTripSchedule';

interface DayViewProps {
  schedule: DaySchedule[];
  onStartTrip?: (trip: ScheduledTrip) => void;
  onCompleteTrip?: (trip: ScheduledTrip) => void;
  isLoading?: boolean;
}

export function DayView({ schedule, onStartTrip, onCompleteTrip, isLoading }: DayViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (schedule.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-2">📅</div>
        <h3 className="text-lg font-medium">No trips scheduled</h3>
        <p className="text-sm text-muted-foreground">
          There are no trips scheduled for the selected date(s).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {schedule.map(day => (
        <div key={day.date}>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            {day.dateLabel}
          </h3>
          <div className="space-y-3">
            {day.trips.map(trip => (
              <TripCard
                key={trip.id}
                trip={trip}
                onStartTrip={onStartTrip}
                onCompleteTrip={onCompleteTrip}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
