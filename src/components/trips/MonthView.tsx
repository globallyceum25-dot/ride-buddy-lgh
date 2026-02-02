import { useMemo } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { DayTripPopover, type MonthTripPreview } from './DayTripPopover';

interface MonthTripData {
  [date: string]: {
    total: number;
    scheduled: number;
    dispatched: number;
    inProgress: number;
    completed: number;
    trips: MonthTripPreview[];
  };
}

interface MonthViewProps {
  currentDate: Date;
  selectedDate: Date;
  tripData: MonthTripData;
  onSelectDate: (date: Date) => void;
  isLoading?: boolean;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthView({ 
  currentDate, 
  selectedDate, 
  tripData, 
  onSelectDate,
  isLoading 
}: MonthViewProps) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

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
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
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
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayData = tripData[dateStr];
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isSelected = isSameDay(day, selectedDate);
          const isDayToday = isToday(day);
          const hasTrips = dayData && dayData.total > 0;

          const dayButton = (
            <button
              onClick={() => onSelectDate(day)}
              className={cn(
                'relative min-h-[80px] w-full p-2 border-r border-b transition-all duration-150',
                'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-inset',
                // Row borders
                index % 7 === 6 && 'border-r-0',
                index >= calendarDays.length - 7 && 'border-b-0',
                // Current month vs other months
                !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                // Selected state
                isSelected && 'bg-primary/10 ring-2 ring-primary ring-inset',
                // Today indicator
                isDayToday && !isSelected && 'bg-accent/50'
              )}
            >
              {/* Day number */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={cn(
                    'flex items-center justify-center w-7 h-7 text-sm font-medium rounded-full',
                    isDayToday && 'bg-primary text-primary-foreground',
                    isSelected && !isDayToday && 'font-semibold text-primary'
                  )}
                >
                  {format(day, 'd')}
                </span>
                {hasTrips && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {dayData.total}
                  </span>
                )}
              </div>

              {/* Trip status indicators */}
              {hasTrips && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {dayData.scheduled > 0 && (
                    <div 
                      className="h-1.5 rounded-full bg-info flex-1 min-w-[12px] max-w-8"
                      title={`${dayData.scheduled} scheduled`}
                    />
                  )}
                  {dayData.dispatched > 0 && (
                    <div 
                      className="h-1.5 rounded-full bg-warning flex-1 min-w-[12px] max-w-8"
                      title={`${dayData.dispatched} dispatched`}
                    />
                  )}
                  {dayData.inProgress > 0 && (
                    <div 
                      className="h-1.5 rounded-full bg-primary flex-1 min-w-[12px] max-w-8"
                      title={`${dayData.inProgress} in progress`}
                    />
                  )}
                  {dayData.completed > 0 && (
                    <div 
                      className="h-1.5 rounded-full bg-success flex-1 min-w-[12px] max-w-8"
                      title={`${dayData.completed} completed`}
                    />
                  )}
                </div>
              )}

              {/* Trip dots (alternate view for small screens) */}
              {hasTrips && (
                <div className="hidden sm:flex gap-0.5 justify-center mt-2">
                  {dayData.inProgress > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                  {dayData.scheduled + dayData.dispatched > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-info" />
                  )}
                  {dayData.completed > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  )}
                </div>
              )}
            </button>
          );

          return hasTrips ? (
            <DayTripPopover
              key={dateStr}
              date={day}
              trips={dayData.trips}
              onSelectDate={onSelectDate}
            >
              {dayButton}
            </DayTripPopover>
          ) : (
            <div key={dateStr}>{dayButton}</div>
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
