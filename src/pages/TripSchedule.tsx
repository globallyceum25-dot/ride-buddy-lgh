import { useState, useMemo } from 'react';
import { format, startOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth } from 'date-fns';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { DayView } from '@/components/trips/DayView';
import { MonthView } from '@/components/trips/MonthView';
import { WeekTimelineView } from '@/components/trips/WeekTimelineView';
import { CalendarNavigation } from '@/components/trips/CalendarNavigation';
import { CalendarStatsBar } from '@/components/trips/CalendarStatsBar';
import { ScheduleFilters } from '@/components/trips/ScheduleFilters';
import { TripTrackingDialog } from '@/components/allocations/TripTrackingDialog';
import { 
  useTripSchedule, 
  useWeekSchedule,
  useMonthSchedule,
  useWeekTrips,
  useTripStats,
  type ScheduledTrip,
  type TripScheduleFilters,
} from '@/hooks/useTripSchedule';
import { useUpdateAllocationStatus, useAllocations, type AllocationStatus } from '@/hooks/useAllocations';
import { useDrivers } from '@/hooks/useDrivers';
import { useVehicles } from '@/hooks/useVehicles';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'day' | 'week' | 'month';

export default function TripSchedule() {
  const { hasRole } = useAuth();
  const isDriver = hasRole('driver');
  const isAdmin = hasRole('group_admin') || hasRole('location_coordinator');

  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [filters, setFilters] = useState<TripScheduleFilters>({
    myTripsOnly: isDriver,
    status: [],
  });

  // Tracking dialog state
  const [trackingDialogOpen, setTrackingDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<ScheduledTrip | null>(null);
  const [trackingMode, setTrackingMode] = useState<'start' | 'complete'>('start');

  // Fetch data based on view mode
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const { data: schedule = [], isLoading: scheduleLoading } = useTripSchedule({
    ...filters,
    date: dateStr,
  });
  
  const { data: monthTripData = {}, isLoading: monthLoading } = useMonthSchedule(currentMonth);
  
  const { data: weekTrips = [], isLoading: weekTripsLoading } = useWeekTrips(weekStart, filters);
  
  const { data: stats } = useTripStats(dateStr);
  const { data: drivers = [] } = useDrivers();
  const { data: vehicles = [] } = useVehicles();
  
  // For tracking dialog
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

  // Navigation title based on view mode
  const navigationTitle = useMemo(() => {
    switch (viewMode) {
      case 'day':
        return format(selectedDate, 'MMMM d, yyyy');
      case 'week':
        return format(weekStart, 'MMMM yyyy');
      case 'month':
        return format(currentMonth, 'MMMM yyyy');
    }
  }, [viewMode, selectedDate, weekStart, currentMonth]);

  // Handlers
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    setCurrentMonth(startOfMonth(date));
  };

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
  };

  const handleToday = () => {
    const today = new Date();
    setSelectedDate(today);
    setWeekStart(startOfWeek(today, { weekStartsOn: 1 }));
    setCurrentMonth(startOfMonth(today));
  };

  const handlePrevious = () => {
    switch (viewMode) {
      case 'day':
        const prevDay = new Date(selectedDate);
        prevDay.setDate(prevDay.getDate() - 1);
        handleDateChange(prevDay);
        break;
      case 'week':
        setWeekStart(subWeeks(weekStart, 1));
        break;
      case 'month':
        setCurrentMonth(subMonths(currentMonth, 1));
        break;
    }
  };

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        const nextDay = new Date(selectedDate);
        nextDay.setDate(nextDay.getDate() + 1);
        handleDateChange(nextDay);
        break;
      case 'week':
        setWeekStart(addWeeks(weekStart, 1));
        break;
      case 'month':
        setCurrentMonth(addMonths(currentMonth, 1));
        break;
    }
  };

  const handleMonthDaySelect = (date: Date) => {
    setSelectedDate(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
    setViewMode('day');
  };

  const handleWeekDaySelect = (date: Date) => {
    setSelectedDate(date);
    setViewMode('day');
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
        <div>
          <h1 className="text-3xl font-bold">Trip Schedule</h1>
          <p className="text-muted-foreground">
            {isDriver ? 'View and manage your assigned trips' : 'View all scheduled trips'}
          </p>
        </div>

        {/* Stats Bar */}
        <CalendarStatsBar stats={stats} />

        {/* Calendar Navigation */}
        <CalendarNavigation
          currentDate={viewMode === 'month' ? currentMonth : viewMode === 'week' ? weekStart : selectedDate}
          viewMode={viewMode}
          onDateChange={handleDateChange}
          onViewModeChange={handleViewModeChange}
          onToday={handleToday}
          onPrevious={handlePrevious}
          onNext={handleNext}
          title={navigationTitle}
        />

        {/* Filters - shown for day and week views */}
        {viewMode !== 'month' && (
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
        )}

        {/* Main Content - View specific */}
        <div className="animate-fade-in">
          {viewMode === 'month' && (
            <MonthView
              currentDate={currentMonth}
              selectedDate={selectedDate}
              tripData={monthTripData}
              onSelectDate={handleMonthDaySelect}
              isLoading={monthLoading}
            />
          )}

          {viewMode === 'week' && (
            <WeekTimelineView
              weekStart={weekStart}
              selectedDate={selectedDate}
              trips={weekTrips}
              onSelectDate={handleWeekDaySelect}
              onStartTrip={handleStartTrip}
              onCompleteTrip={handleCompleteTrip}
              isLoading={weekTripsLoading}
            />
          )}

          {viewMode === 'day' && (
            <DayView
              schedule={schedule}
              onStartTrip={handleStartTrip}
              onCompleteTrip={handleCompleteTrip}
              isLoading={scheduleLoading}
            />
          )}
        </div>
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
