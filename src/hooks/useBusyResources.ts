import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BusyAllocation {
  vehicleId: string | null;
  driverId: string | null;
  requestNumber: string | null;
  poolNumber: string | null;
  scheduledPickup: string;
  pickup: string;
  dropoff: string;
  status: string;
}

export interface BusyResources {
  busyVehicleIds: string[];
  busyDriverIds: string[];
  allocations: BusyAllocation[];
}

type AllocationRow = {
  vehicle_id: string | null;
  driver_id: string | null;
  status: string | null;
  scheduled_pickup: string;
  travel_requests: {
    request_number: string | null;
    pickup_location: string | null;
    dropoff_location: string | null;
  } | null;
  trip_pools: {
    pool_number: string | null;
  } | null;
};

export function useBusyResources(date: string | null) {
  return useQuery<BusyResources>({
    queryKey: ['busy-resources', date],
    enabled: !!date,
    queryFn: async () => {
      // Fetch allocations for the date that are NOT completed/cancelled
      // Join with travel_requests and trip_pools for details
      const { data, error } = await supabase
        .from('allocations')
        .select(`
          vehicle_id,
          driver_id,
          status,
          scheduled_pickup,
          pool_id,
          travel_requests!inner (
            request_number,
            pickup_location,
            dropoff_location
          ),
          trip_pools (
            pool_number
          )
        `)
        .gte('scheduled_pickup', `${date}T00:00:00`)
        .lte('scheduled_pickup', `${date}T23:59:59`)
        .not('status', 'in', '("completed","cancelled")');

      if (error) {
        console.error('Error fetching busy resources:', error);
        return { busyVehicleIds: [], busyDriverIds: [], allocations: [] };
      }

      const allocations: BusyAllocation[] = ((data ?? []) as AllocationRow[]).map((a) => ({
        vehicleId: a.vehicle_id,
        driverId: a.driver_id,
        requestNumber: a.travel_requests?.request_number || null,
        poolNumber: a.trip_pools?.pool_number || null,
        scheduledPickup: a.scheduled_pickup,
        pickup: a.travel_requests?.pickup_location || '',
        dropoff: a.travel_requests?.dropoff_location || '',
        status: a.status || '',
      }));

      return {
        busyVehicleIds: [...new Set(data?.map(a => a.vehicle_id).filter((id): id is string => !!id))],
        busyDriverIds: [...new Set(data?.map(a => a.driver_id).filter((id): id is string => !!id))],
        allocations,
      };
    },
  });
}
