import { useState, useMemo } from 'react';
import { format, startOfWeek, addWeeks, subWeeks } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, List } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DayView } from '@/components/trips/DayView';
import { WeekView } from '@/components/trips/WeekView';
import { ScheduleFilters } from '@/components/trips/ScheduleFilters';
import { TripTrackingDialog } from '@/components/allocations/TripTrackingDialog';
import { 
  useTripSchedule, 
  useWeekSchedule, 
  useTripStats,
  type ScheduledTrip,
  type TripScheduleFilters,
} from '@/hooks/useTripSchedule';
import { useUpdateAllocationStatus, useAllocations, type AllocationStatus } from '@/hooks/useAllocations';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'day' | 'week';

export default function TripSchedule() {
  const { hasRole } = useAuth();
  const isDriver = hasRole('driver');
  const isAdmin = hasRole('group_admin') || hasRole('location_coordinator');

  const [viewMode, setViewMode] = useState<ViewMode>('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filters, setFilters] = useState<TripScheduleFilters>({
    myTripsOnly: isDriver,
    status: [],
  });

  // Tracking dialog state
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ScheduledTrip | null>(null);
  const [trackingMode, setTrackingMode] = useState<'start' | 'complete'>('start');

  // Fetch data
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { data: schedule = [], isLoading: scheduleLoading } = useTripSchedule({
    ...filters,
    date: dateStr,
  });
  const { data: weekDays = [], isLoading: weekLoading } = useWeekSchedule(weekStart);
  const { data: stats } = useTripStats(dateStr);
  const { data: drivers = [] } = useDrivers();
  const { data: vehicles = [] } = useVehicles();
  
  // For tracking dialog - need the full allocation data
  const { data: allocations = [] } = useAllocations({ date: dateStr });
  
  const updateAllocation = useUpdateAllocationStatus();

  // Transform drivers and vehicles for filters
  const driverOptions = useMemo(() => 
    drivers.map(d => ({ id: d.id, name: d.profile?.full_name || 'Unknown' })),
    [drivers]
  );
  const vehicleOptions = useMemo(() => 
    vehicles.map(v => ({ id: v.id, registration: v.registration_number })),
    [vehicles]
  );

  // Handlers
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
  };

  const handleWeekNav = (direction: 'prev' | 'next') => {
    const newWeekStart = direction === 'prev' 
      ? subWeeks(weekStart, 1) 
      : addWeeks(weekStart, 1);
    setWeekStart(newWeekStart);
  };

  const handleStartTrip = (trip: ScheduledTrip) => {
    setSelectedTrip(trip);
    setTrackingMode('start');
    setTrackingDialogOpen(true);
  };

  const handleCompleteTrip = (trip: ScheduledTrip) => {
    setSelectedTrip(trip);
    setTrackingMode('complete');
    setTrackingDialogOpen(true);
  };

  const handleTrackingSubmit = (data: {
    odometer_start?: number;
    odometer_end?: number;
    actual_pickup?: string;
    actual_dropoff?: string;
  }) => {
    if (!selectedTrip) return;

    const newStatus: AllocationStatus = trackingMode === 'start' ? 'in_progress' : 'completed';
    
    updateAllocation.mutate({
      id: selectedTrip.id,
      status: newStatus,
      vehicle_id: selectedTrip.vehicle?.id,
      ...data,
    }, {
      onSuccess: () => {
        setTrackingDialogOpen(false);
        setSelectedTrip(null);
      },
    });
  };

  // Get the allocation for the tracking dialog
  const selectedAllocation = selectedTrip 
    ? allocations.find(a => a.id === selectedTrip.id) 
    : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Trip Schedule</h1>
            <p className="text-muted-foreground">
              {isDriver ? 'View and manage your assigned trips' : 'View all scheduled trips'}
            </p>
          </div>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Day
              </TabsTrigger>
              <TabsTrigger value="week">
                <List className="h-4 w-4 mr-2" />
                Week
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Today
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.tripsToday}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  In Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  This Week
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingThisWeek}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <ScheduleFilters
              date={selectedDate}
              onDateChange={handleDateChange}
              driverId={filters.driverId}
              onDriverChange={(id) => setFilters(prev => ({ ...prev, driverId: id }))}
              vehicleId={filters.vehicleId}
              onVehicleChange={(id) => setFilters(prev => ({ ...prev, vehicleId: id }))}
              statusFilter={filters.status}
              onStatusFilterChange={(status) => setFilters(prev => ({ ...prev, status }))}
              myTripsOnly={filters.myTripsOnly}
              onMyTripsOnlyChange={(checked) => setFilters(prev => ({ ...prev, myTripsOnly: checked }))}
              drivers={driverOptions}
              vehicles={vehicleOptions}
              showDriverFilter={isAdmin}
              showVehicleFilter={isAdmin}
              showMyTripsToggle={isDriver}
            />
          </CardContent>
        </Card>

        {/* Week Navigation (when in week view) */}
        {viewMode === 'week' && (
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => handleWeekNav('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="font-medium">
              {format(weekStart, 'MMM d')} - {format(addWeeks(weekStart, 1), 'MMM d, yyyy')}
            </span>
            <Button variant="outline" size="icon" onClick={() => handleWeekNav('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Main Content */}
        {viewMode === 'week' && (
          <WeekView
            weekDays={weekDays}
            selectedDate={dateStr}
            onSelectDate={(date) => {
              setSelectedDate(new Date(date));
              setViewMode('day');
            }}
            isLoading={weekLoading}
          />
        )}

        <DayView
          schedule={schedule}
          onStartTrip={handleStartTrip}
          onCompleteTrip={handleCompleteTrip}
          isLoading={scheduleLoading}
        />
      </div>

      {/* Trip Tracking Dialog */}
      <TripTrackingDialog
        open={trackingDialogOpen}
        onOpenChange={setTrackingDialogOpen}
        allocation={selectedAllocation}
        mode={trackingMode}
        onSubmit={handleTrackingSubmit}
        isLoading={updateAllocation.isPending}
      />
    </DashboardLayout>
  );
}
