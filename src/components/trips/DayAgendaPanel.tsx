import { format } from 'date-fns';
import { CalendarDays, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { AgendaTripCard } from './AgendaTripCard';
import type { MonthTripPreview } from '@/hooks/useTripSchedule';

interface DayAgendaPanelProps {
  selectedDate: Date;
  trips: MonthTripPreview[];
  onViewDay?: (date: Date) => void;
  onStartTrip?: (trip: MonthTripPreview) => void;
  onCompleteTrip?: (trip: MonthTripPreview) => void;
  isLoading?: boolean;
}

function EmptyDayState({ date }: { date: Date }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
      <h4 className="font-medium text-muted-foreground">No trips scheduled</h4>
      <p className="text-sm text-muted-foreground/70 mt-1">
        {format(date, 'MMMM d')} has no scheduled trips
      </p>
    </div>
  );
}

export function DayAgendaPanel({ 
  selectedDate, 
  trips = [],
  onViewDay,
  onStartTrip,
  onCompleteTrip,
  isLoading 
}: DayAgendaPanelProps) {
  const tripCount = trips?.length ?? 0;

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold text-muted-foreground">
          {format(selectedDate, 'EEEE')}
        </h3>
        <p className="text-2xl font-bold">
          {format(selectedDate, 'MMMM d, yyyy')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {tripCount} trip{tripCount !== 1 ? 's' : ''} scheduled
        </p>
      </div>
      
      {/* Trip List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {tripCount === 0 ? (
            <EmptyDayState date={selectedDate} />
          ) : (
            <div className="space-y-3">
              {trips.map(trip => (
                <AgendaTripCard 
                  key={trip.id} 
                  trip={trip}
                  canStart={trip.status === 'dispatched'}
                  canComplete={trip.status === 'in_progress'}
                  onStart={() => onStartTrip?.(trip)}
                  onComplete={() => onCompleteTrip?.(trip)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Footer Actions */}
      {onViewDay && (
        <div className="p-4 border-t">
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => onViewDay(selectedDate)}
          >
            View Full Day Details
          </Button>
        </div>
      )}
    </div>
  );
}
