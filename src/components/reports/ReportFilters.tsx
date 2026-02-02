import { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subDays, startOfYear } from 'date-fns';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ReportFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onExport?: () => void;
}

type PresetKey = 'today' | 'this-week' | 'this-month' | 'last-30' | 'this-year' | 'custom';

export function ReportFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onExport,
}: ReportFiltersProps) {
  const [preset, setPreset] = useState<PresetKey>('this-month');

  const handlePresetChange = (value: PresetKey) => {
    setPreset(value);
    const today = new Date();

    switch (value) {
      case 'today':
        onStartDateChange(format(today, 'yyyy-MM-dd'));
        onEndDateChange(format(today, 'yyyy-MM-dd'));
        break;
      case 'this-week':
        onStartDateChange(format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        onEndDateChange(format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
        break;
      case 'this-month':
        onStartDateChange(format(startOfMonth(today), 'yyyy-MM-dd'));
        onEndDateChange(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'last-30':
        onStartDateChange(format(subDays(today, 30), 'yyyy-MM-dd'));
        onEndDateChange(format(today, 'yyyy-MM-dd'));
        break;
      case 'this-year':
        onStartDateChange(format(startOfYear(today), 'yyyy-MM-dd'));
        onEndDateChange(format(today, 'yyyy-MM-dd'));
        break;
      case 'custom':
        // Keep current dates
        break;
    }
  };

  const handleDateSelect = (type: 'start' | 'end', date: Date | undefined) => {
    if (!date) return;
    setPreset('custom');
    if (type === 'start') {
      onStartDateChange(format(date, 'yyyy-MM-dd'));
    } else {
      onEndDateChange(format(date, 'yyyy-MM-dd'));
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      <Select value={preset} onValueChange={(v) => handlePresetChange(v as PresetKey)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Select period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">Today</SelectItem>
          <SelectItem value="this-week">This Week</SelectItem>
          <SelectItem value="this-month">This Month</SelectItem>
          <SelectItem value="last-30">Last 30 Days</SelectItem>
          <SelectItem value="this-year">This Year</SelectItem>
          <SelectItem value="custom">Custom Range</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !startDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate ? format(new Date(startDate), 'MMM d, yyyy') : 'Start date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate ? new Date(startDate) : undefined}
              onSelect={(date) => handleDateSelect('start', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-muted-foreground">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-[140px] justify-start text-left font-normal',
                !endDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {endDate ? format(new Date(endDate), 'MMM d, yyyy') : 'End date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate ? new Date(endDate) : undefined}
              onSelect={(date) => handleDateSelect('end', date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {onExport && (
        <Button variant="outline" onClick={onExport} className="ml-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      )}
    </div>
  );
}
