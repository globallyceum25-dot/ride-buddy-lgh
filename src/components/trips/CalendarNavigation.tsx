import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarNavigationProps {
  currentDate: Date;
  viewMode: ViewMode;
  onDateChange: (date: Date) => void;
  onViewModeChange: (mode: ViewMode) => void;
  onToday: () => void;
  onPrevious: () => void;
  onNext: () => void;
  title: string;
}

export function CalendarNavigation({
  currentDate,
  viewMode,
  onDateChange,
  onViewModeChange,
  onToday,
  onPrevious,
  onNext,
  title,
}: CalendarNavigationProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
      {/* Left side - Navigation */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border bg-card shadow-sm">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onPrevious}
            className="rounded-r-none hover:bg-accent"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-px bg-border" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onNext}
            className="rounded-l-none hover:bg-accent"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={onToday}
          className="font-medium"
        >
          Today
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className="text-lg font-semibold hover:bg-accent px-3"
            >
              <CalendarIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              {title}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={(d) => d && onDateChange(d)}
              initialFocus
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Right side - View mode tabs */}
      <div className="flex items-center">
        <div className="inline-flex items-center rounded-lg border bg-card p-1 shadow-sm">
          {(['day', 'week', 'month'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'relative px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200',
                viewMode === mode
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
