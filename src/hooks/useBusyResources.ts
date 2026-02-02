import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface BusyResources {
  busyVehicleIds: string[];
  busyDriverIds: string[];
}

export function useBusyResources(date: string | null) {
  return useQuery<BusyResources>({
    queryKey: ['busy-resources', date],
    enabled: !!date,
    queryFn: async () => {
      // Fetch allocations for the date that are NOT completed/cancelled
      const { data, error } = await supabase
        .from('allocations')
        .select('vehicle_id, driver_id, status')
        .gte('scheduled_pickup', `${date}T00:00:00`)
        .lte('scheduled_pickup', `${date}T23:59:59`)
        .not('status', 'in', '("completed","cancelled")');

      if (error) {
        console.error('Error fetching busy resources:', error);
        return { busyVehicleIds: [], busyDriverIds: [] };
      }

      return {
        busyVehicleIds: [...new Set(data?.map(a => a.vehicle_id).filter((id): id is string => !!id))],
        busyDriverIds: [...new Set(data?.map(a => a.driver_id).filter((id): id is string => !!id))],
      };
    },
  });
}
