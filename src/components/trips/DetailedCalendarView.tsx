import { useMemo, useState } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay,
  isToday 
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { DayAgendaPanel } from './DayAgendaPanel';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MonthTripPreview, MonthTripData } from '@/hooks/useTripSchedule';
import type { AllocationStatus } from '@/hooks/useAllocations';

interface DetailedCalendarViewProps {
  currentDate: Date;
  selectedDate: Date;
  tripData: MonthTripData;
  onSelectDate: (date: Date) => void;
  onViewDay?: (date: Date) => void;
  onStartTrip?: (trip: MonthTripPreview) => void;
  onCompleteTrip?: (trip: MonthTripPreview) => void;
  isLoading?: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const statusBgColors: Record<AllocationStatus, string> = {
  scheduled: 'bg-info/20 text-info-foreground border-info/30',
  dispatched: 'bg-warning/20 text-warning-foreground border-warning/30',
  in_progress: 'bg-primary/20 text-primary-foreground border-primary/30',
  completed: 'bg-success/20 text-success-foreground border-success/30',
  cancelled: 'bg-muted text-muted-foreground border-muted',
};

interface CalendarDayCellProps {
  day: Date;
  trips: MonthTripPreview[];
  isCurrentMonth: boolean;
  isSelected: boolean;
  isToday: boolean;
  onSelect: (date: Date) => void;
  isLastInRow: boolean;
  isLastRow: boolean;
}

function CalendarDayCell({ 
  day, 
  trips = [], 
  isCurrentMonth, 
  isSelected, 
  isToday: isDayToday,
  onSelect,
  isLastInRow,
  isLastRow
}: CalendarDayCellProps) {
  const visibleTrips = trips.slice(0, 3);
  const hiddenCount = trips.length - visibleTrips.length;

  return (
    <button
      onClick={() => onSelect(day)}
      className={cn(
        'relative min-h-[100px] w-full p-2 border-r border-b text-left transition-all duration-150',
        'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
        isLastInRow && 'border-r-0',
        isLastRow && 'border-b-0',
        !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
        isSelected && 'bg-primary/10 ring-2 ring-primary ring-inset',
        isDayToday && !isSelected && 'bg-accent/50'
      )}
    >
      {/* Day header */}
      <div className="flex justify-between items-center mb-1">
        <span
          className={cn(
            'flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full',
            isDayToday && 'bg-primary text-primary-foreground',
            isSelected && !isDayToday && 'font-semibold text-primary'
          )}
        >
          {format(day, 'd')}
        </span>
        {trips.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5">
            {trips.length}
          </Badge>
        )}
      </div>

      {/* Inline trip previews */}
      <div className="space-y-0.5">
        {visibleTrips.map(trip => (
          <div 
            key={trip.id} 
            className={cn(
              'text-[11px] px-1.5 py-0.5 rounded truncate border',
              statusBgColors[trip.status]
            )}
          >
            <span className="font-mono font-medium">{trip.time}</span>
            <span className="ml-1 opacity-70">
              {trip.pickup.slice(0, 10)}→{trip.dropoff.slice(0, 10)}
            </span>
          </div>
        ))}
        {hiddenCount > 0 && (
          <div className="text-[10px] text-muted-foreground text-center pt-0.5">
            +{hiddenCount} more
          </div>
        )}
      </div>
    </button>
  );
}

function CalendarGrid({ 
  currentDate, 
  selectedDate, 
  tripData, 
  onSelectDate,
  calendarDays 
}: {
  currentDate: Date;
  selectedDate: Date;
  tripData: MonthTripData;
  onSelectDate: (date: Date) => void;
  calendarDays: Date[];
}) {
  return (
    <div className="h-full flex flex-col bg-card rounded-xl border shadow-sm overflow-hidden">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b bg-muted/30">
        {WEEKDAYS.map((day) => (
          <div 
            key={day} 
            className="py-3 text-center text-sm font-semibold text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 flex-1">
        {calendarDays.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = tripData[dateStr];
          const trips = dayData?.trips || [];
          
          return (
            <CalendarDayCell
              key={dateStr}
              day={day}
              trips={trips}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isSelected={isSameDay(day, selectedDate)}
              isToday={isToday(day)}
              onSelect={onSelectDate}
              isLastInRow={index % 7 === 6}
              isLastRow={index >= calendarDays.length - 7}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 py-3 border-t bg-muted/20 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-info" />
          <span className="text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="text-muted-foreground">Dispatched</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-muted-foreground">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-muted-foreground">Completed</span>
        </div>
      </div>
    </div>
  );
}

export function DetailedCalendarView({ 
  currentDate, 
  selectedDate, 
  tripData, 
  onSelectDate,
  onViewDay,
  onStartTrip,
  onCompleteTrip,
  isLoading 
}: DetailedCalendarViewProps) {
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const selectedDayTrips = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    return tripData[dateStr]?.trips || [];
  }, [selectedDate, tripData]);

  const handleSelectDate = (date: Date) => {
    onSelectDate(date);
    if (isMobile) {
      setMobileSheetOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((day) => (
            <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // Mobile: Calendar + Sheet for day agenda
  if (isMobile) {
    return (
      <>
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          tripData={tripData}
          onSelectDate={handleSelectDate}
          calendarDays={calendarDays}
        />
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] p-0">
            <DayAgendaPanel
              selectedDate={selectedDate}
              trips={selectedDayTrips}
              onViewDay={onViewDay}
              onStartTrip={onStartTrip}
              onCompleteTrip={onCompleteTrip}
            />
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // Desktop: Resizable split view
  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-xl border">
      <ResizablePanel defaultSize={70} minSize={50}>
        <CalendarGrid
          currentDate={currentDate}
          selectedDate={selectedDate}
          tripData={tripData}
          onSelectDate={handleSelectDate}
          calendarDays={calendarDays}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={30} minSize={20}>
        <DayAgendaPanel
          selectedDate={selectedDate}
          trips={selectedDayTrips}
          onViewDay={onViewDay}
          onStartTrip={onStartTrip}
          onCompleteTrip={onCompleteTrip}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
