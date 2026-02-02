import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfWeek, endOfWeek, format, addDays } from 'date-fns';
import type { AllocationStatus } from './useAllocations';

export interface TripScheduleFilters {
  date?: string;
  startDate?: string;
  endDate?: string;
  driverId?: string;
  vehicleId?: string;
  myTripsOnly?: boolean;
  status?: AllocationStatus[];
}

export interface ScheduledTrip {
  id: string;
  type: 'single' | 'pooled';
  scheduledTime: string;
  status: AllocationStatus;
  pickup: string;
  dropoff: string;
  passengerCount: number;
  vehicle: { id: string; registration: string; makeModel: string } | null;
  driver: { id: string; userId: string; name: string } | null;
  request: { number: string; requester: string; requesterId: string } | null;
  pool: { id: string; number: string; requestCount: number } | null;
  canStartTrip: boolean;
  canCompleteTrip: boolean;
  odometerStart: number | null;
  actualPickup: string | null;
}

export interface DaySchedule {
  date: string;
  dateLabel: string;
  trips: ScheduledTrip[];
}

export interface WeekDay {
  date: string;
  dayLabel: string;
  dayNumber: number;
  tripCount: number;
  isToday: boolean;
}

export function useTripSchedule(filters: TripScheduleFilters) {
  const { user, hasRole } = useAuth();
  
  return useQuery({
    queryKey: ['trip-schedule', filters, user?.id],
    queryFn: async () => {
      // Determine date range
      let startDate = filters.startDate || filters.date;
      let endDate = filters.endDate || filters.date;
      
      if (!startDate) {
        startDate = format(new Date(), 'yyyy-MM-dd');
      }
      if (!endDate) {
        endDate = startDate;
      }

      let query = supabase
        .from('allocations')
        .select(`
          *,
          request:travel_requests(
            id, request_number, purpose, pickup_location, dropoff_location,
            pickup_datetime, passenger_count, priority, status, requester_id
          ),
          vehicle:vehicles(id, registration_number, make, model, capacity, odometer),
          driver:drivers(id, user_id, license_number)
        `)
        .gte('scheduled_pickup', `${startDate}T00:00:00`)
        .lte('scheduled_pickup', `${endDate}T23:59:59`)
        .neq('status', 'cancelled')
        .order('scheduled_pickup', { ascending: true });

      // Apply filters
      if (filters.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      
      if (filters.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }
      
      if (filters.driverId) {
        query = query.eq('driver_id', filters.driverId);
      }

      const { data: allocations, error } = await query;
      if (error) throw error;

      // Get driver's ID if filtering by their trips
      let currentDriverId: string | null = null;
      if (filters.myTripsOnly && user) {
        const { data: driverRecord } = await supabase
          .from('drivers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        currentDriverId = driverRecord?.id || null;
      }

      // Filter for driver's own trips if requested
      let filteredAllocations = allocations || [];
      if (filters.myTripsOnly && currentDriverId) {
        filteredAllocations = filteredAllocations.filter(a => a.driver_id === currentDriverId);
      }

      // Fetch requester profiles
      const requesterIds = [...new Set(filteredAllocations.map(a => a.request?.requester_id).filter(Boolean))] as string[];
      const { data: requesterProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', requesterIds);

      // Fetch driver profiles
      const driverUserIds = [...new Set(filteredAllocations.map(a => a.driver?.user_id).filter(Boolean))] as string[];
      const { data: driverProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', driverUserIds);

      // Get pool info for pooled trips
      const poolIds = [...new Set(filteredAllocations.map(a => a.pool_id).filter(Boolean))] as string[];
      let poolInfo: Record<string, { number: string; requestCount: number }> = {};
      
      if (poolIds.length > 0) {
        const { data: pools } = await supabase
          .from('trip_pools')
          .select('id, pool_number')
          .in('id', poolIds);
        
        // Count allocations per pool
        const { data: poolAllocations } = await supabase
          .from('allocations')
          .select('pool_id')
          .in('pool_id', poolIds)
          .neq('status', 'cancelled');
        
        pools?.forEach(pool => {
          const count = poolAllocations?.filter(a => a.pool_id === pool.id).length || 0;
          poolInfo[pool.id] = {
            number: pool.pool_number || `POOL-${pool.id.slice(0, 8)}`,
            requestCount: count,
          };
        });
      }

      // Check if current user is the driver for any trips
      const isDriver = hasRole('driver');

      // Transform to ScheduledTrip format
      const trips: ScheduledTrip[] = filteredAllocations.map(allocation => {
        const requesterProfile = requesterProfiles?.find(p => p.user_id === allocation.request?.requester_id);
        const driverProfile = driverProfiles?.find(p => p.user_id === allocation.driver?.user_id);
        const pool = allocation.pool_id ? poolInfo[allocation.pool_id] : null;
        
        const isAssignedDriver = isDriver && allocation.driver?.user_id === user?.id;
        
        return {
          id: allocation.id,
          type: allocation.pool_id ? 'pooled' : 'single',
          scheduledTime: allocation.scheduled_pickup,
          status: allocation.status as AllocationStatus,
          pickup: allocation.request?.pickup_location || '',
          dropoff: allocation.request?.dropoff_location || '',
          passengerCount: allocation.request?.passenger_count || 1,
          vehicle: allocation.vehicle ? {
            id: allocation.vehicle.id,
            registration: allocation.vehicle.registration_number,
            makeModel: [allocation.vehicle.make, allocation.vehicle.model].filter(Boolean).join(' ') || 'Unknown',
          } : null,
          driver: allocation.driver ? {
            id: allocation.driver.id,
            userId: allocation.driver.user_id,
            name: driverProfile?.full_name || 'Unknown',
          } : null,
          request: allocation.request ? {
            number: allocation.request.request_number || `TR-${allocation.request.id.slice(0, 8)}`,
            requester: requesterProfile?.full_name || requesterProfile?.email || 'Unknown',
            requesterId: allocation.request.requester_id,
          } : null,
          pool: pool ? {
            id: allocation.pool_id!,
            number: pool.number,
            requestCount: pool.requestCount,
          } : null,
          canStartTrip: isAssignedDriver && allocation.status === 'dispatched',
          canCompleteTrip: isAssignedDriver && allocation.status === 'in_progress',
          odometerStart: allocation.odometer_start,
          actualPickup: allocation.actual_pickup,
        };
      });

      // Group by date
      const groupedByDate: Record<string, ScheduledTrip[]> = {};
      trips.forEach(trip => {
        const date = format(new Date(trip.scheduledTime), 'yyyy-MM-dd');
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push(trip);
      });

      // Convert to DaySchedule array
      const schedule: DaySchedule[] = Object.entries(groupedByDate).map(([date, dayTrips]) => ({
        date,
        dateLabel: format(new Date(date), 'EEEE, MMMM d, yyyy'),
        trips: dayTrips,
      }));

      return schedule;
    },
    enabled: !!user,
  });
}

export function useWeekSchedule(weekStartDate: Date) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['week-schedule', format(weekStartDate, 'yyyy-MM-dd'), user?.id],
    queryFn: async () => {
      const start = startOfWeek(weekStartDate, { weekStartsOn: 1 }); // Monday
      const end = endOfWeek(weekStartDate, { weekStartsOn: 1 }); // Sunday

      const { data: allocations, error } = await supabase
        .from('allocations')
        .select('scheduled_pickup, status')
        .gte('scheduled_pickup', format(start, "yyyy-MM-dd'T'00:00:00"))
        .lte('scheduled_pickup', format(end, "yyyy-MM-dd'T'23:59:59"))
        .neq('status', 'cancelled');

      if (error) throw error;

      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Build week days with trip counts
      const weekDays: WeekDay[] = [];
      for (let i = 0; i < 7; i++) {
        const dayDate = addDays(start, i);
        const dateStr = format(dayDate, 'yyyy-MM-dd');
        const tripCount = allocations?.filter(a => 
          format(new Date(a.scheduled_pickup), 'yyyy-MM-dd') === dateStr
        ).length || 0;

        weekDays.push({
          date: dateStr,
          dayLabel: format(dayDate, 'EEE'),
          dayNumber: dayDate.getDate(),
          tripCount,
          isToday: dateStr === today,
        });
      }

      return weekDays;
    },
    enabled: !!user,
  });
}

export function useTripStats(date?: string) {
  const { user } = useAuth();
  const targetDate = date || format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['trip-stats', targetDate, user?.id],
    queryFn: async () => {
      // Today's stats
      const { data: todayAllocations } = await supabase
        .from('allocations')
        .select('status')
        .gte('scheduled_pickup', `${targetDate}T00:00:00`)
        .lte('scheduled_pickup', `${targetDate}T23:59:59`)
        .neq('status', 'cancelled');

      // Week's upcoming
      const weekEnd = format(addDays(new Date(targetDate), 7), 'yyyy-MM-dd');
      const { data: weekAllocations } = await supabase
        .from('allocations')
        .select('id')
        .gte('scheduled_pickup', `${targetDate}T00:00:00`)
        .lte('scheduled_pickup', `${weekEnd}T23:59:59`)
        .neq('status', 'cancelled');

      const today = todayAllocations || [];
      
      return {
        tripsToday: today.length,
        inProgress: today.filter(a => a.status === 'in_progress').length,
        completed: today.filter(a => a.status === 'completed').length,
        upcomingThisWeek: weekAllocations?.length || 0,
      };
    },
    enabled: !!user,
  });
}
