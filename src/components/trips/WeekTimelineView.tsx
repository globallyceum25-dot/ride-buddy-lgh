import { useMemo, useRef } from 'react';
import { format, startOfWeek, addDays, isSameDay, isToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { TripBlock } from './TripPreviewCard';
import type { ScheduledTrip } from '@/hooks/useTripSchedule';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface WeekTimelineViewProps {
  weekStart: Date;
  selectedDate: Date;
  trips: ScheduledTrip[];
  onSelectDate: (date: Date) => void;
  onStartTrip?: (trip: ScheduledTrip) => void;
  onCompleteTrip?: (trip: ScheduledTrip) => void;
  isLoading?: boolean;
}

const HOURS = Array.from({ length: 18 }, (_, i) => i + 5); // 5 AM to 10 PM

export function WeekTimelineView({
  weekStart,
  selectedDate,
  trips,
  onSelectDate,
  onStartTrip,
  onCompleteTrip,
  isLoading,
}: WeekTimelineViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const weekDays = useMemo(() => {
    const start = startOfWeek(weekStart, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [weekStart]);

  // Group trips by day
  const tripsByDay = useMemo(() => {
    const grouped: Record<string, ScheduledTrip[]> = {};
    trips.forEach(trip => {
      const dateStr = format(new Date(trip.scheduledTime), 'yyyy-MM-dd');
      if (!grouped[dateStr]) grouped[dateStr] = [];
      grouped[dateStr].push(trip);
    });
    return grouped;
  }, [trips]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-8 gap-2">
          <Skeleton className="h-12" />
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-8 border-b bg-muted/30">
        <div className="p-3 border-r text-center text-sm font-medium text-muted-foreground">
          Time
        </div>
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayTrips = tripsByDay[dateStr] || [];
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={cn(
                'p-3 text-center border-r last:border-r-0 transition-colors',
                'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                isSelected && 'bg-primary/10',
                isDayToday && !isSelected && 'bg-accent/50'
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, 'EEE')}
              </div>
              <div className={cn(
                'text-lg font-semibold',
                isDayToday && 'text-primary'
              )}>
                {format(day, 'd')}
              </div>
              {dayTrips.length > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">
                  {dayTrips.length} trip{dayTrips.length !== 1 ? 's' : ''}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Timeline grid */}
      <ScrollArea className="h-[600px]" ref={scrollRef}>
        <div className="min-w-[800px]">
          {HOURS.map((hour) => (
            <div key={hour} className="grid grid-cols-8 border-b last:border-b-0">
              {/* Time column */}
              <div className="p-2 border-r text-center text-xs text-muted-foreground bg-muted/10">
                {format(new Date().setHours(hour, 0), 'h a')}
              </div>

              {/* Day columns */}
              {weekDays.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayTrips = tripsByDay[dateStr] || [];
                const hourTrips = dayTrips.filter(trip => {
                  const tripHour = new Date(trip.scheduledTime).getHours();
                  return tripHour === hour;
                });
                const isSelected = isSameDay(day, selectedDate);

                return (
                  <div
                    key={`${dateStr}-${hour}`}
                    className={cn(
                      'min-h-[60px] p-1 border-r last:border-r-0 relative',
                      isSelected && 'bg-primary/5'
                    )}
                  >
                    <div className="space-y-1">
                      {hourTrips.map((trip) => (
                        <TripBlock
                          key={trip.id}
                          trip={trip}
                          onClick={() => onSelectDate(day)}
                          onStartTrip={onStartTrip}
                          onCompleteTrip={onCompleteTrip}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
