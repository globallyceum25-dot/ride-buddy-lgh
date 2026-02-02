import { format } from 'date-fns';
import { CalendarIcon, Filter } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AllocationStatus } from '@/hooks/useAllocations';

interface Driver {
  id: string;
  name: string;
}

interface Vehicle {
  id: string;
  registration: string;
}

interface ScheduleFiltersProps {
  date: Date;
  onDateChange: (date: Date) => void;
  driverId?: string;
  onDriverChange?: (driverId: string | undefined) => void;
  vehicleId?: string;
  onVehicleChange?: (vehicleId: string | undefined) => void;
  statusFilter?: AllocationStatus[];
  onStatusFilterChange?: (status: AllocationStatus[]) => void;
  myTripsOnly?: boolean;
  onMyTripsOnlyChange?: (checked: boolean) => void;
  drivers?: Driver[];
  vehicles?: Vehicle[];
  showDriverFilter?: boolean;
  showVehicleFilter?: boolean;
  showMyTripsToggle?: boolean;
}

const statusOptions: { value: AllocationStatus; label: string }[] = [
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

export function ScheduleFilters({
  date,
  onDateChange,
  driverId,
  onDriverChange,
  vehicleId,
  onVehicleChange,
  statusFilter = [],
  onStatusFilterChange,
  myTripsOnly,
  onMyTripsOnlyChange,
  drivers = [],
  vehicles = [],
  showDriverFilter = false,
  showVehicleFilter = false,
  showMyTripsToggle = false,
}: ScheduleFiltersProps) {
  const handleStatusToggle = (status: AllocationStatus) => {
    if (!onStatusFilterChange) return;
    
    if (statusFilter.includes(status)) {
      onStatusFilterChange(statusFilter.filter(s => s !== status));
    } else {
      onStatusFilterChange([...statusFilter, status]);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'justify-start text-left font-normal w-[200px]',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            initialFocus
          />
        </PopoverContent>
      </Popover>

      {/* Driver Filter */}
      {showDriverFilter && onDriverChange && (
        <Select value={driverId || 'all'} onValueChange={(v) => onDriverChange(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Drivers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Drivers</SelectItem>
            {drivers.map(driver => (
              <SelectItem key={driver.id} value={driver.id}>
                {driver.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Vehicle Filter */}
      {showVehicleFilter && onVehicleChange && (
        <Select value={vehicleId || 'all'} onValueChange={(v) => onVehicleChange(v === 'all' ? undefined : v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Vehicles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Vehicles</SelectItem>
            {vehicles.map(vehicle => (
              <SelectItem key={vehicle.id} value={vehicle.id}>
                {vehicle.registration}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Status Filter */}
      {onStatusFilterChange && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status
              {statusFilter.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary px-1.5 py-0.5 rounded text-xs">
                  {statusFilter.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px]" align="start">
            <div className="space-y-2">
              {statusOptions.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${option.value}`}
                    checked={statusFilter.includes(option.value)}
                    onCheckedChange={() => handleStatusToggle(option.value)}
                  />
                  <Label
                    htmlFor={`status-${option.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* My Trips Only Toggle */}
      {showMyTripsToggle && onMyTripsOnlyChange && (
        <div className="flex items-center space-x-2 ml-auto">
          <Checkbox
            id="my-trips"
            checked={myTripsOnly}
            onCheckedChange={(checked) => onMyTripsOnlyChange(checked === true)}
          />
          <Label
            htmlFor="my-trips"
            className="text-sm font-normal cursor-pointer"
          >
            My trips only
          </Label>
        </div>
      )}
    </div>
  );
}
