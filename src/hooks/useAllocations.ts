import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export type AllocationStatus = 'scheduled' | 'dispatched' | 'in_progress' | 'completed' | 'cancelled';
export type PoolStatus = 'pending' | 'confirmed' | 'dispatched' | 'completed' | 'cancelled';

export interface Allocation {
  id: string;
  request_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  pool_id: string | null;
  allocated_by: string | null;
  allocated_at: string | null;
  scheduled_pickup: string;
  scheduled_dropoff: string | null;
  actual_pickup: string | null;
  actual_dropoff: string | null;
  odometer_start: number | null;
  odometer_end: number | null;
  notes: string | null;
  status: AllocationStatus;
  created_at: string;
  updated_at: string;
  request?: {
    id: string;
    request_number: string | null;
    purpose: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_datetime: string;
    passenger_count: number;
    priority: string;
    status: string;
    requester_id: string;
  } | null;
  vehicle?: {
    id: string;
    registration_number: string;
    make: string | null;
    model: string | null;
    capacity: number | null;
    odometer: number | null;
  } | null;
  driver?: {
    id: string;
    user_id: string;
    license_number: string;
  } | null;
}

export interface TripPool {
  id: string;
  pool_number: string | null;
  vehicle_id: string | null;
  driver_id: string | null;
  scheduled_date: string;
  scheduled_time: string;
  total_passengers: number | null;
  route_summary: string | null;
  status: PoolStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  vehicle?: {
    id: string;
    registration_number: string;
    make: string | null;
    model: string | null;
  } | null;
  driver?: {
    id: string;
    user_id: string;
  } | null;
  allocations?: Allocation[];
}

export interface AllocationInsert {
  request_id: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  pool_id?: string | null;
  scheduled_pickup: string;
  scheduled_dropoff?: string | null;
  notes?: string | null;
}

export interface TripPoolInsert {
  scheduled_date: string;
  scheduled_time: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
  route_summary?: string | null;
  request_ids: string[]; // The requests to pool together
}

// Fetch approved requests that need allocation (not yet allocated)
export function usePendingAllocation() {
  return useQuery({
    queryKey: ['pending-allocation'],
    queryFn: async () => {
      // First get existing allocations to exclude
      const { data: existingAllocations } = await supabase
        .from('allocations')
        .select('request_id')
        .neq('status', 'cancelled');
      
      const allocatedRequestIds = existingAllocations?.map(a => a.request_id) || [];

      // Get approved requests without allocations
      const { data, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('status', 'approved')
        .order('pickup_datetime', { ascending: true });
      
      if (error) throw error;
      
      // Filter out already allocated requests
      const pendingRequests = data?.filter(r => !allocatedRequestIds.includes(r.id)) || [];
      
      // Fetch requester profiles
      const requesterIds = pendingRequests.map(r => r.requester_id);
      const requestIds = pendingRequests.map(r => r.id);
      
      const [profilesResult, stopsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, email, department')
          .in('user_id', requesterIds),
        supabase
          .from('request_stops')
          .select('*')
          .in('request_id', requestIds)
          .order('stop_order', { ascending: true }),
      ]);
      
      const profiles = profilesResult.data;
      const stops = stopsResult.data || [];
      
      return pendingRequests.map(request => ({
        ...request,
        requester: profiles?.find(p => p.user_id === request.requester_id) || null,
        stops: stops.filter(s => s.request_id === request.id),
      }));
    },
  });
}

// Fetch all allocations with filters
export function useAllocations(filters?: { status?: AllocationStatus; date?: string }) {
  return useQuery({
    queryKey: ['allocations', filters],
    queryFn: async () => {
      let query = supabase
        .from('allocations')
        .select(`
          *,
          request:travel_requests(
            id, request_number, purpose, pickup_location, dropoff_location,
            pickup_datetime, passenger_count, priority, status, requester_id
          ),
          vehicle:vehicles(id, registration_number, make, model, capacity, odometer),
          driver:drivers(id, user_id, license_number),
          pool:trip_pools(pool_number)
        `)
        .order('scheduled_pickup', { ascending: true });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.date) {
        query = query.gte('scheduled_pickup', `${filters.date}T00:00:00`)
          .lte('scheduled_pickup', `${filters.date}T23:59:59`);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Fetch requester profiles for each allocation
      const requesterIds = data?.map(a => a.request?.requester_id).filter(Boolean) as string[];
      const requestIds = data?.map(a => a.request?.id).filter(Boolean) as string[];
      
      const [profilesResult, driverProfilesResult, stopsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, full_name, email, department')
          .in('user_id', requesterIds),
        // Fetch driver profiles
        supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', data?.map(a => a.driver?.user_id).filter(Boolean) as string[]),
        // Fetch stops for all requests
        supabase
          .from('request_stops')
          .select('*')
          .in('request_id', requestIds)
          .order('stop_order', { ascending: true }),
      ]);
      
      const profiles = profilesResult.data;
      const driverProfiles = driverProfilesResult.data;
      const stops = stopsResult.data || [];
      
      return data?.map(allocation => ({
        ...allocation,
        requester: profiles?.find(p => p.user_id === allocation.request?.requester_id) || null,
        driverProfile: driverProfiles?.find(p => p.user_id === allocation.driver?.user_id) || null,
        stops: stops.filter(s => s.request_id === allocation.request?.id),
      })) || [];
    },
  });
}

// Fetch trip pools
export function useTripPools(filters?: { status?: PoolStatus }) {
  return useQuery({
    queryKey: ['trip-pools', filters],
    queryFn: async () => {
      let query = supabase
        .from('trip_pools')
        .select(`
          *,
          vehicle:vehicles(id, registration_number, make, model),
          driver:drivers(id, user_id)
        `)
        .order('scheduled_date', { ascending: true });
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Get allocations for each pool
      const poolIds = data?.map(p => p.id) || [];
      const { data: allocations } = await supabase
        .from('allocations')
        .select(`
          *,
          request:travel_requests(
            id, request_number, purpose, pickup_location, dropoff_location,
            pickup_datetime, passenger_count, requester_id
          )
        `)
        .in('pool_id', poolIds);
      
      // Fetch driver profiles
      const driverUserIds = data?.map(p => p.driver?.user_id).filter(Boolean) as string[];
      const { data: driverProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', driverUserIds);
      
      return data?.map(pool => ({
        ...pool,
        allocations: allocations?.filter(a => a.pool_id === pool.id) || [],
        driverProfile: driverProfiles?.find(p => p.user_id === pool.driver?.user_id) || null,
      })) || [];
    },
  });
}

// Create allocation (assign vehicle/driver to request)
export function useCreateAllocation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (allocation: AllocationInsert) => {
      // Create the allocation
      const { data, error } = await supabase
        .from('allocations')
        .insert({
          ...allocation,
          allocated_by: user?.id,
          status: 'scheduled',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Update request status to 'allocated'
      await supabase
        .from('travel_requests')
        .update({ status: 'allocated' })
        .eq('id', allocation.request_id);
      
      // Fire-and-forget: send notification to requester
      (async () => {
        try {
          // Fetch request details, vehicle info, and driver name
          const [requestRes, vehicleRes, driverRes] = await Promise.all([
            supabase.from('travel_requests').select('request_number, pickup_location, dropoff_location, pickup_datetime, requester_id').eq('id', allocation.request_id).single(),
            allocation.vehicle_id ? supabase.from('vehicles').select('registration_number, make, model').eq('id', allocation.vehicle_id).single() : Promise.resolve({ data: null }),
            allocation.driver_id ? supabase.from('drivers').select('user_id').eq('id', allocation.driver_id).single() : Promise.resolve({ data: null }),
          ]);
          
          const request = requestRes.data;
          const vehicle = vehicleRes.data;
          let driverName = "N/A";
          
          if (driverRes.data?.user_id) {
            const { data: driverProfile } = await supabase.from('profiles').select('full_name').eq('user_id', driverRes.data.user_id).single();
            driverName = driverProfile?.full_name || "N/A";
          }
          
          if (request) {
            const vehicleInfo = vehicle ? `${vehicle.registration_number} (${[vehicle.make, vehicle.model].filter(Boolean).join(' ')})` : "N/A";
            await supabase.functions.invoke('send-notification', {
              body: {
                recipientUserId: request.requester_id,
                type: 'allocation_assigned',
                details: {
                  requestNumber: request.request_number || 'N/A',
                  route: `${request.pickup_location} → ${request.dropoff_location}`,
                  vehicleInfo,
                  driverName,
                  pickupDatetime: request.pickup_datetime,
                },
              },
            });
          }
        } catch (e) {
          console.error('Failed to send allocation notification:', e);
        }
      })();
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success('Allocation created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create allocation: ${error.message}`);
    },
  });
}

// Create trip pool (merge requests)
export function useCreateTripPool() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (poolData: TripPoolInsert) => {
      const { request_ids, ...poolInsert } = poolData;
      
      // Calculate total passengers
      const { data: requests } = await supabase
        .from('travel_requests')
        .select('passenger_count, pickup_location, dropoff_location')
        .in('id', request_ids);
      
      const totalPassengers = requests?.reduce((sum, r) => sum + r.passenger_count, 0) || 0;
      
      // Create route summary
      const pickups = [...new Set(requests?.map(r => r.pickup_location))];
      const dropoffs = [...new Set(requests?.map(r => r.dropoff_location))];
      const routeSummary = poolInsert.route_summary || 
        `${pickups.join(', ')} → ${dropoffs.join(', ')}`;
      
      // Create the pool
      const { data: pool, error: poolError } = await supabase
        .from('trip_pools')
        .insert({
          ...poolInsert,
          total_passengers: totalPassengers,
          route_summary: routeSummary,
          created_by: user?.id,
          status: 'pending',
        })
        .select()
        .single();
      
      if (poolError) throw poolError;
      
      // Create allocations for each request linked to this pool
      const allocations = request_ids.map(request_id => ({
        request_id,
        pool_id: pool.id,
        vehicle_id: poolInsert.vehicle_id,
        driver_id: poolInsert.driver_id,
        scheduled_pickup: `${poolInsert.scheduled_date}T${poolInsert.scheduled_time}`,
        allocated_by: user?.id,
        status: 'scheduled' as AllocationStatus,
      }));
      
      const { error: allocError } = await supabase
        .from('allocations')
        .insert(allocations);
      
      if (allocError) throw allocError;
      
      // Update request statuses to 'allocated'
      await supabase
        .from('travel_requests')
        .update({ status: 'allocated' })
        .in('id', request_ids);
      
      // Fire-and-forget: send notifications to all requesters in the pool
      (async () => {
        try {
          const { data: poolRequests } = await supabase
            .from('travel_requests')
            .select('id, request_number, pickup_location, dropoff_location, pickup_datetime, requester_id')
            .in('id', request_ids);
          
          let vehicleInfo = "N/A";
          if (poolInsert.vehicle_id) {
            const { data: vehicle } = await supabase.from('vehicles').select('registration_number, make, model').eq('id', poolInsert.vehicle_id).single();
            if (vehicle) vehicleInfo = `${vehicle.registration_number} (${[vehicle.make, vehicle.model].filter(Boolean).join(' ')})`;
          }
          
          let driverName = "N/A";
          if (poolInsert.driver_id) {
            const { data: driver } = await supabase.from('drivers').select('user_id').eq('id', poolInsert.driver_id).single();
            if (driver?.user_id) {
              const { data: driverProfile } = await supabase.from('profiles').select('full_name').eq('user_id', driver.user_id).single();
              driverName = driverProfile?.full_name || "N/A";
            }
          }
          
          for (const req of poolRequests || []) {
            supabase.functions.invoke('send-notification', {
              body: {
                recipientUserId: req.requester_id,
                type: 'allocation_assigned',
                details: {
                  requestNumber: req.request_number || 'N/A',
                  route: `${req.pickup_location} → ${req.dropoff_location}`,
                  vehicleInfo,
                  driverName,
                  pickupDatetime: req.pickup_datetime,
                },
              },
            }).catch(e => console.error('Pool notification failed:', e));
          }
        } catch (e) {
          console.error('Failed to send pool allocation notifications:', e);
        }
      })();
      
      return pool;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-pools'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success('Trip pool created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create trip pool: ${error.message}`);
    },
  });
}

// Update allocation status
export function useUpdateAllocationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, vehicle_id, ...updates }: { 
      id: string; 
      status: AllocationStatus;
      vehicle_id?: string | null;
      actual_pickup?: string;
      actual_dropoff?: string;
      odometer_start?: number;
      odometer_end?: number;
    }) => {
      const { data, error } = await supabase
        .from('allocations')
        .update({ status, ...updates })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      // Update travel request status based on allocation status
      type RequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'allocated' | 'in_progress' | 'completed' | 'cancelled';
      const requestStatusMap: Record<AllocationStatus, RequestStatus | null> = {
        'dispatched': null,
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': null,
        'scheduled': null,
      };
      
      if (data && requestStatusMap[status]) {
        await supabase
          .from('travel_requests')
          .update({ status: requestStatusMap[status] })
          .eq('id', data.request_id);
      }
      
      // Update vehicle odometer when trip completes
      if (status === 'completed' && updates.odometer_end && vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ odometer: updates.odometer_end })
          .eq('id', vehicle_id);
      }
      
      // Fire-and-forget: send notification for dispatched/in_progress
      if (data && (status === 'dispatched' || status === 'in_progress')) {
        (async () => {
          try {
            const { data: allocation } = await supabase
              .from('allocations')
              .select(`
                request:travel_requests(request_number, pickup_location, dropoff_location, pickup_datetime, requester_id),
                vehicle:vehicles(registration_number, make, model),
                driver:drivers(user_id)
              `)
              .eq('id', id)
              .single();
            
            const request = allocation?.request;
            if (!request) return;
            
            let driverName = "N/A";
            if (allocation?.driver?.user_id) {
              const { data: dp } = await supabase.from('profiles').select('full_name').eq('user_id', allocation.driver.user_id).single();
              driverName = dp?.full_name || "N/A";
            }
            
            const v = allocation?.vehicle;
            const vehicleInfo = v ? `${v.registration_number} (${[v.make, v.model].filter(Boolean).join(' ')})` : "N/A";
            
            await supabase.functions.invoke('send-notification', {
              body: {
                recipientUserId: request.requester_id,
                type: status === 'dispatched' ? 'trip_dispatched' : 'trip_in_progress',
                details: {
                  requestNumber: request.request_number || 'N/A',
                  route: `${request.pickup_location} → ${request.dropoff_location}`,
                  vehicleInfo,
                  driverName,
                  pickupDatetime: request.pickup_datetime,
                },
              },
            });
          } catch (e) {
            console.error('Failed to send trip status notification:', e);
          }
        })();
      }
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Allocation status updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update allocation: ${error.message}`);
    },
  });
}

// Bulk update allocation statuses (for pooled trips)
export function useBulkUpdateAllocationStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      ids, 
      status, 
      vehicle_id,
      ...updates 
    }: { 
      ids: string[]; 
      status: AllocationStatus;
      vehicle_id?: string | null;
      actual_pickup?: string;
      actual_dropoff?: string;
      odometer_start?: number;
      odometer_end?: number;
    }) => {
      // Update all allocations in the pool
      const { data, error } = await supabase
        .from('allocations')
        .update({ status, ...updates })
        .in('id', ids)
        .select('id, request_id');
      
      if (error) throw error;
      
      // Update travel request statuses based on allocation status
      type RequestStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'allocated' | 'in_progress' | 'completed' | 'cancelled';
      const requestStatusMap: Record<AllocationStatus, RequestStatus | null> = {
        'dispatched': null,
        'in_progress': 'in_progress',
        'completed': 'completed',
        'cancelled': null,
        'scheduled': null,
      };
      
      if (requestStatusMap[status] && data) {
        const requestIds = data.map(a => a.request_id);
        await supabase
          .from('travel_requests')
          .update({ status: requestStatusMap[status] })
          .in('id', requestIds);
      }
      
      // Update vehicle odometer when trip completes
      if (status === 'completed' && updates.odometer_end && vehicle_id) {
        await supabase
          .from('vehicles')
          .update({ odometer: updates.odometer_end })
          .eq('id', vehicle_id);
      }
      
      // Fire-and-forget: send notifications for dispatched/in_progress
      if (data && (status === 'dispatched' || status === 'in_progress')) {
        (async () => {
          try {
            const requestIds = data.map(a => a.request_id);
            const { data: requests } = await supabase
              .from('travel_requests')
              .select('id, request_number, pickup_location, dropoff_location, pickup_datetime, requester_id')
              .in('id', requestIds);
            
            // Fetch vehicle & driver info from first allocation
            const { data: firstAlloc } = await supabase
              .from('allocations')
              .select('vehicle:vehicles(registration_number, make, model), driver:drivers(user_id)')
              .eq('id', ids[0])
              .single();
            
            let vehicleInfo = "N/A";
            if (firstAlloc?.vehicle) {
              const v = firstAlloc.vehicle;
              vehicleInfo = `${v.registration_number} (${[v.make, v.model].filter(Boolean).join(' ')})`;
            }
            
            let driverName = "N/A";
            if (firstAlloc?.driver?.user_id) {
              const { data: dp } = await supabase.from('profiles').select('full_name').eq('user_id', firstAlloc.driver.user_id).single();
              driverName = dp?.full_name || "N/A";
            }
            
            for (const req of requests || []) {
              supabase.functions.invoke('send-notification', {
                body: {
                  recipientUserId: req.requester_id,
                  type: status === 'dispatched' ? 'trip_dispatched' : 'trip_in_progress',
                  details: {
                    requestNumber: req.request_number || 'N/A',
                    route: `${req.pickup_location} → ${req.dropoff_location}`,
                    vehicleInfo,
                    driverName,
                    pickupDatetime: req.pickup_datetime,
                  },
                },
              }).catch(e => console.error('Bulk trip notification failed:', e));
            }
          } catch (e) {
            console.error('Failed to send bulk trip status notifications:', e);
          }
        })();
      }
      
      return data;
    },
    onSuccess: (_, { ids }) => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success(`Updated ${ids.length} allocation${ids.length > 1 ? 's' : ''}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to update allocations: ${error.message}`);
    },
  });
}

// Cancel allocation
export function useCancelAllocation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get the allocation first
      const { data: allocation } = await supabase
        .from('allocations')
        .select('request_id')
        .eq('id', id)
        .single();
      
      // Cancel the allocation
      const { error } = await supabase
        .from('allocations')
        .update({ status: 'cancelled' })
        .eq('id', id);
      
      if (error) throw error;
      
      // Revert request status to 'approved'
      if (allocation) {
        await supabase
          .from('travel_requests')
          .update({ status: 'approved' })
          .eq('id', allocation.request_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['pending-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      toast.success('Allocation cancelled');
    },
    onError: (error: Error) => {
      toast.error(`Failed to cancel allocation: ${error.message}`);
    },
  });
}

// Check if requests are compatible for pooling
export function checkPoolCompatibility(requests: Array<{
  pickup_datetime: string;
  pickup_location: string;
  dropoff_location: string;
  passenger_count: number;
}>, maxCapacity: number = 12): { compatible: boolean; reason?: string } {
  if (requests.length < 2) {
    return { compatible: false, reason: 'Need at least 2 requests to pool' };
  }
  
  // Check if all requests are on the same date
  const dates = requests.map(r => new Date(r.pickup_datetime).toDateString());
  const uniqueDates = [...new Set(dates)];
  if (uniqueDates.length > 1) {
    return { compatible: false, reason: 'Requests are on different dates' };
  }
  
  // Check if times are within 30 minutes of each other
  const times = requests.map(r => new Date(r.pickup_datetime).getTime());
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  const timeDiffMinutes = (maxTime - minTime) / (1000 * 60);
  if (timeDiffMinutes > 30) {
    return { compatible: false, reason: 'Pickup times are more than 30 minutes apart' };
  }
  
  // Check total passenger capacity
  const totalPassengers = requests.reduce((sum, r) => sum + r.passenger_count, 0);
  if (totalPassengers > maxCapacity) {
    return { compatible: false, reason: `Total passengers (${totalPassengers}) exceeds vehicle capacity (${maxCapacity})` };
  }
  
  return { compatible: true };
}
