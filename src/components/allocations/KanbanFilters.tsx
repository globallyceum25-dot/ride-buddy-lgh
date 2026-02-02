import { Search, Calendar, Filter, LayoutGrid, Table2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export type ViewMode = 'board' | 'table' | 'pools';

interface KanbanFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function KanbanFilters({
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  viewMode,
  onViewModeChange,
}: KanbanFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Left side - Search and Date */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 w-[200px] sm:w-[250px]"
          />
        </div>

        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'gap-2 min-w-[140px]',
                selectedDate && 'text-primary'
              )}
            >
              <Calendar className="h-4 w-4" />
              {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'All dates'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
            />
            {selectedDate && (
              <div className="p-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => onDateChange(undefined)}
                >
                  Clear filter
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>

        {/* Today Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDateChange(new Date())}
          className={cn(
            selectedDate &&
              format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') &&
              'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          Today
        </Button>
      </div>

      {/* Right side - View Toggle */}
      <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
        <Button
          variant={viewMode === 'board' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('board')}
          className="gap-2"
        >
          <LayoutGrid className="h-4 w-4" />
          <span className="hidden sm:inline">Board</span>
        </Button>
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          className="gap-2"
        >
          <Table2 className="h-4 w-4" />
          <span className="hidden sm:inline">Table</span>
        </Button>
        <Button
          variant={viewMode === 'pools' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('pools')}
          className="gap-2"
        >
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">Pools</span>
        </Button>
      </div>
    </div>
  );
}
