import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { startOfMonth, subMonths, format } from 'date-fns';

export interface DashboardStats {
  totalRequests: number;
  requestsChange: number;
  activeVehicles: number;
  availableVehicles: number;
  driversOnDuty: number;
  driversOnLeave: number;
  todaysTrips: number;
  completedToday: number;
}

export interface SetupAlert {
  type: 'setup' | 'warning' | 'urgent';
  message: string;
  link: string;
}

export interface RecentActivityItem {
  id: string;
  action: string;
  requestNumber: string | null;
  timestamp: string;
}

export interface PendingApprovalItem {
  id: string;
  requestNumber: string | null;
  requesterName: string;
  purpose: string;
  createdAt: string;
}

export interface DriverTripItem {
  id: string;
  scheduledTime: string;
  pickup: string;
  dropoff: string;
  status: string;
  passengerCount: number;
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const thisMonthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd');
      const lastMonthEnd = format(startOfMonth(new Date()), 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [
        thisMonthRequests,
        lastMonthRequests,
        vehicles,
        drivers,
        todayAllocations,
      ] = await Promise.all([
        // This month's requests
        supabase
          .from('travel_requests')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', thisMonthStart),
        
        // Last month's requests
        supabase
          .from('travel_requests')
          .select('id', { count: 'exact', head: true })
          .gte('created_at', lastMonthStart)
          .lt('created_at', lastMonthEnd),
        
        // Vehicles
        supabase
          .from('vehicles')
          .select('status, is_active'),
        
        // Drivers
        supabase
          .from('drivers')
          .select('status, is_active'),
        
        // Today's allocations
        supabase
          .from('allocations')
          .select('status, scheduled_pickup')
          .gte('scheduled_pickup', `${today}T00:00:00`)
          .lt('scheduled_pickup', `${today}T23:59:59`)
          .neq('status', 'cancelled'),
      ]);

      const totalRequests = thisMonthRequests.count || 0;
      const lastMonthCount = lastMonthRequests.count || 0;
      const requestsChange = lastMonthCount > 0 
        ? Math.round(((totalRequests - lastMonthCount) / lastMonthCount) * 100)
        : 0;

      const activeVehicles = vehicles.data?.filter(v => v.is_active).length || 0;
      const availableVehicles = vehicles.data?.filter(v => v.is_active && v.status === 'available').length || 0;

      const activeDrivers = drivers.data?.filter(d => d.is_active) || [];
      const driversOnDuty = activeDrivers.filter(d => d.status === 'available' || d.status === 'on_trip').length;
      const driversOnLeave = activeDrivers.filter(d => d.status === 'on_leave').length;

      const todaysTrips = todayAllocations.data?.length || 0;
      const completedToday = todayAllocations.data?.filter(a => a.status === 'completed').length || 0;

      return {
        totalRequests,
        requestsChange,
        activeVehicles,
        availableVehicles,
        driversOnDuty,
        driversOnLeave,
        todaysTrips,
        completedToday,
      };
    },
    staleTime: 30000, // 30 seconds
  });
}

export function useSetupAlerts() {
  return useQuery({
    queryKey: ['setup-alerts'],
    queryFn: async (): Promise<SetupAlert[]> => {
      const alerts: SetupAlert[] = [];
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      const thirtyDaysStr = format(thirtyDaysFromNow, 'yyyy-MM-dd');

      const [locations, vehicles, drivers, expiringVehicles, expiringDrivers] = await Promise.all([
        supabase.from('locations').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('drivers').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase
          .from('vehicles')
          .select('registration_number, insurance_expiry, registration_expiry')
          .eq('is_active', true)
          .or(`insurance_expiry.lte.${thirtyDaysStr},registration_expiry.lte.${thirtyDaysStr}`),
        supabase
          .from('drivers')
          .select('id, license_expiry, user_id')
          .eq('is_active', true)
          .lte('license_expiry', thirtyDaysStr),
      ]);

      // Setup alerts
      if ((locations.count || 0) === 0) {
        alerts.push({
          type: 'setup',
          message: 'Add your first location to get started',
          link: '/locations',
        });
      }

      if ((vehicles.count || 0) === 0) {
        alerts.push({
          type: 'setup',
          message: 'Register vehicles for your fleet',
          link: '/vehicles',
        });
      }

      if ((drivers.count || 0) === 0) {
        alerts.push({
          type: 'setup',
          message: 'Add driver profiles to assign trips',
          link: '/drivers',
        });
      }

      // Expiring documents - vehicles
      expiringVehicles.data?.forEach(v => {
        if (v.insurance_expiry && new Date(v.insurance_expiry) <= thirtyDaysFromNow) {
          alerts.push({
            type: new Date(v.insurance_expiry) <= new Date() ? 'urgent' : 'warning',
            message: `Vehicle ${v.registration_number}: Insurance expiring soon`,
            link: '/vehicles',
          });
        }
        if (v.registration_expiry && new Date(v.registration_expiry) <= thirtyDaysFromNow) {
          alerts.push({
            type: new Date(v.registration_expiry) <= new Date() ? 'urgent' : 'warning',
            message: `Vehicle ${v.registration_number}: Registration expiring soon`,
            link: '/vehicles',
          });
        }
      });

      // Expiring documents - drivers
      if (expiringDrivers.data && expiringDrivers.data.length > 0) {
        alerts.push({
          type: 'warning',
          message: `${expiringDrivers.data.length} driver license(s) expiring soon`,
          link: '/drivers',
        });
      }

      return alerts;
    },
    staleTime: 60000, // 1 minute
  });
}

export function useRecentActivity(limit: number = 5) {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: async (): Promise<RecentActivityItem[]> => {
      const { data, error } = await supabase
        .from('request_history')
        .select(`
          id,
          action,
          created_at,
          request:travel_requests(request_number)
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        action: item.action,
        requestNumber: item.request?.request_number || null,
        timestamp: item.created_at,
      }));
    },
    staleTime: 30000,
  });
}

export function usePendingApprovalsPreview(limit: number = 3, isAdmin = false) {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pending-approvals-preview', user?.id, limit, isAdmin],
    queryFn: async (): Promise<PendingApprovalItem[]> => {
      if (!user?.id) return [];

      let query = supabase
        .from('travel_requests')
        .select('id, request_number, purpose, created_at, requester_id')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!isAdmin) {
        query = query.eq('approver_id', user.id);
      }

      const { data: requests, error } = await query;

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Fetch requester names separately
      const requesterIds = [...new Set(requests.map(r => r.requester_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', requesterIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      return requests.map(item => ({
        id: item.id,
        requestNumber: item.request_number,
        requesterName: profileMap.get(item.requester_id) || 'Unknown',
        purpose: item.purpose,
        createdAt: item.created_at,
      }));
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export function usePendingApprovalsCount() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['pending-approvals-count', user?.id],
    queryFn: async (): Promise<number> => {
      if (!user?.id) return 0;

      const { count, error } = await supabase
        .from('travel_requests')
        .select('id', { count: 'exact', head: true })
        .eq('approver_id', user.id)
        .eq('status', 'pending_approval');

      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}

export interface HailingSpendStats {
  thisMonthSpend: number;
  lastMonthSpend: number;
  tripCount: number;
  percentChange: number;
}

export function useHailingSpendStats() {
  return useQuery({
    queryKey: ['hailing-spend-stats'],
    queryFn: async (): Promise<HailingSpendStats> => {
      const now = new Date();
      const thisMonthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const lastMonthStart = format(startOfMonth(subMonths(now, 1)), 'yyyy-MM-dd');
      const lastMonthEnd = thisMonthStart;

      const [thisMonth, lastMonth] = await Promise.all([
        supabase
          .from('allocations')
          .select('fare_amount')
          .not('hailing_service', 'is', null)
          .gte('scheduled_pickup', thisMonthStart),
        supabase
          .from('allocations')
          .select('fare_amount')
          .not('hailing_service', 'is', null)
          .gte('scheduled_pickup', lastMonthStart)
          .lt('scheduled_pickup', lastMonthEnd),
      ]);

      const thisMonthSpend = (thisMonth.data || []).reduce((sum, a) => sum + (a.fare_amount || 0), 0);
      const tripCount = (thisMonth.data || []).length;
      const lastMonthSpend = (lastMonth.data || []).reduce((sum, a) => sum + (a.fare_amount || 0), 0);
      const percentChange = lastMonthSpend > 0
        ? Math.round(((thisMonthSpend - lastMonthSpend) / lastMonthSpend) * 100)
        : 0;

      return { thisMonthSpend, lastMonthSpend, tripCount, percentChange };
    },
    staleTime: 60000,
  });
}

export function useDriverTodayTrips() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['driver-today-trips', user?.id],
    queryFn: async (): Promise<DriverTripItem[]> => {
      if (!user?.id) return [];

      // First get driver id for current user
      const { data: driver } = await supabase
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!driver) return [];

      const today = format(new Date(), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('allocations')
        .select(`
          id,
          scheduled_pickup,
          status,
          request:travel_requests(
            pickup_location,
            dropoff_location,
            passenger_count
          )
        `)
        .eq('driver_id', driver.id)
        .gte('scheduled_pickup', `${today}T00:00:00`)
        .lt('scheduled_pickup', `${today}T23:59:59`)
        .neq('status', 'cancelled')
        .order('scheduled_pickup', { ascending: true });

      if (error) throw error;

      return (data || []).map(item => ({
        id: item.id,
        scheduledTime: item.scheduled_pickup,
        pickup: item.request?.pickup_location || 'Unknown',
        dropoff: item.request?.dropoff_location || 'Unknown',
        status: item.status || 'scheduled',
        passengerCount: item.request?.passenger_count || 1,
      }));
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });
}
