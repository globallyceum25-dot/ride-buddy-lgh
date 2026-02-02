import { cn } from '@/lib/utils';
import type { WeekDay } from '@/hooks/useTripSchedule';

interface WeekViewProps {
  weekDays: WeekDay[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  isLoading?: boolean;
}

export function WeekView({ weekDays, selectedDate, onSelectDate, isLoading }: WeekViewProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-7 gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map(i => (
          <div key={i} className="h-20 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map(day => (
        <button
          key={day.date}
          onClick={() => onSelectDate(day.date)}
          className={cn(
            'flex flex-col items-center justify-center p-3 rounded-lg border transition-colors',
            selectedDate === day.date
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card hover:bg-accent',
            day.isToday && selectedDate !== day.date && 'border-primary/50'
          )}
        >
          <span className="text-xs font-medium uppercase">
            {day.dayLabel}
          </span>
          <span className={cn(
            'text-2xl font-bold',
            day.isToday && selectedDate !== day.date && 'text-primary'
          )}>
            {day.dayNumber}
          </span>
          {day.tripCount > 0 ? (
            <span className={cn(
              'text-xs font-medium mt-1 px-2 py-0.5 rounded-full',
              selectedDate === day.date
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-primary/10 text-primary'
            )}>
              {day.tripCount} trip{day.tripCount !== 1 ? 's' : ''}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground mt-1">-</span>
          )}
        </button>
      ))}
    </div>
  );
}
