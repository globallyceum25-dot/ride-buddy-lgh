import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ReportFilters {
  startDate: string;
  endDate: string;
}

// Vehicle Report Types
export interface VehicleReportItem {
  vehicleId: string;
  registrationNumber: string;
  make: string | null;
  model: string | null;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalDistance: number;
  avgPassengers: number;
}

export interface VehicleReportData {
  items: VehicleReportItem[];
  totals: {
    totalTrips: number;
    totalDistance: number;
    avgUtilization: number;
  };
}

// Driver Report Types
export interface DriverReportItem {
  driverId: string;
  driverName: string;
  licenseNumber: string;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalHours: number;
  avgTripDuration: number;
}

export interface DriverReportData {
  items: DriverReportItem[];
  totals: {
    totalTrips: number;
    totalDrivers: number;
    avgTripsPerDriver: number;
  };
}

// Location Report Types
export interface LocationReportItem {
  locationId: string;
  locationName: string;
  locationCode: string;
  tripsAsOrigin: number;
  tripsAsDestination: number;
  totalTrips: number;
}

export interface RouteReportItem {
  pickup: string;
  dropoff: string;
  count: number;
}

export interface LocationReportData {
  items: LocationReportItem[];
  routes: RouteReportItem[];
  totals: {
    totalTrips: number;
    uniqueRoutes: number;
  };
}

// Department Report Types
export interface DepartmentReportItem {
  department: string;
  totalRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  pendingRequests: number;
  totalPassengers: number;
  avgPassengers: number;
}

export interface DepartmentReportData {
  items: DepartmentReportItem[];
  totals: {
    totalRequests: number;
    totalDepartments: number;
    overallCompletionRate: number;
  };
}

// Vehicle Report Hook
export function useVehicleReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['vehicle-report', filters],
    queryFn: async (): Promise<VehicleReportData> => {
      const { data: allocations, error } = await supabase
        .from('allocations')
        .select(`
          id,
          vehicle_id,
          status,
          odometer_start,
          odometer_end,
          scheduled_pickup,
          vehicles (
            id,
            registration_number,
            make,
            model
          ),
          travel_requests (
            passenger_count
          )
        `)
        .gte('scheduled_pickup', filters.startDate)
        .lte('scheduled_pickup', filters.endDate + 'T23:59:59');

      if (error) throw error;

      // Aggregate by vehicle
      const vehicleMap = new Map<string, VehicleReportItem>();

      allocations?.forEach((allocation) => {
        const vehicle = allocation.vehicles;
        if (!vehicle || !allocation.vehicle_id) return;

        const existing = vehicleMap.get(allocation.vehicle_id) || {
          vehicleId: allocation.vehicle_id,
          registrationNumber: vehicle.registration_number,
          make: vehicle.make,
          model: vehicle.model,
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0,
          totalDistance: 0,
          avgPassengers: 0,
        };

        existing.totalTrips += 1;
        if (allocation.status === 'completed') existing.completedTrips += 1;
        if (allocation.status === 'cancelled') existing.cancelledTrips += 1;
        
        const distance = (allocation.odometer_end || 0) - (allocation.odometer_start || 0);
        existing.totalDistance += Math.max(0, distance);
        
        const passengers = allocation.travel_requests?.passenger_count || 0;
        existing.avgPassengers = (existing.avgPassengers * (existing.totalTrips - 1) + passengers) / existing.totalTrips;

        vehicleMap.set(allocation.vehicle_id, existing);
      });

      const items = Array.from(vehicleMap.values()).sort((a, b) => b.totalTrips - a.totalTrips);

      const totalTrips = items.reduce((sum, v) => sum + v.totalTrips, 0);
      const totalDistance = items.reduce((sum, v) => sum + v.totalDistance, 0);
      const avgUtilization = items.length > 0 
        ? (items.reduce((sum, v) => sum + (v.completedTrips / Math.max(v.totalTrips, 1)), 0) / items.length) * 100
        : 0;

      return {
        items,
        totals: {
          totalTrips,
          totalDistance,
          avgUtilization: Math.round(avgUtilization),
        },
      };
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Driver Report Hook
export function useDriverReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['driver-report', filters],
    queryFn: async (): Promise<DriverReportData> => {
      const { data: allocations, error } = await supabase
        .from('allocations')
        .select(`
          id,
          driver_id,
          status,
          actual_pickup,
          actual_dropoff,
          scheduled_pickup,
          drivers (
            id,
            license_number,
            user_id
          )
        `)
        .gte('scheduled_pickup', filters.startDate)
        .lte('scheduled_pickup', filters.endDate + 'T23:59:59');

      if (error) throw error;

      // Get driver user IDs for profile lookup
      const driverUserIds = [...new Set(allocations?.map(a => a.drivers?.user_id).filter(Boolean) as string[])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', driverUserIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      // Aggregate by driver
      const driverMap = new Map<string, DriverReportItem>();

      allocations?.forEach((allocation) => {
        const driver = allocation.drivers;
        if (!driver || !allocation.driver_id) return;

        const existing = driverMap.get(allocation.driver_id) || {
          driverId: allocation.driver_id,
          driverName: profileMap.get(driver.user_id) || 'Unknown Driver',
          licenseNumber: driver.license_number,
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0,
          totalHours: 0,
          avgTripDuration: 0,
        };

        existing.totalTrips += 1;
        if (allocation.status === 'completed') existing.completedTrips += 1;
        if (allocation.status === 'cancelled') existing.cancelledTrips += 1;
        
        if (allocation.actual_pickup && allocation.actual_dropoff) {
          const hours = (new Date(allocation.actual_dropoff).getTime() - new Date(allocation.actual_pickup).getTime()) / (1000 * 60 * 60);
          existing.totalHours += Math.max(0, hours);
        }

        driverMap.set(allocation.driver_id, existing);
      });

      const items = Array.from(driverMap.values()).map(driver => ({
        ...driver,
        avgTripDuration: driver.totalTrips > 0 ? driver.totalHours / driver.totalTrips : 0,
      })).sort((a, b) => b.totalTrips - a.totalTrips);

      return {
        items,
        totals: {
          totalTrips: items.reduce((sum, d) => sum + d.totalTrips, 0),
          totalDrivers: items.length,
          avgTripsPerDriver: items.length > 0 ? items.reduce((sum, d) => sum + d.totalTrips, 0) / items.length : 0,
        },
      };
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Location Report Hook
export function useLocationReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['location-report', filters],
    queryFn: async (): Promise<LocationReportData> => {
      const { data: requests, error } = await supabase
        .from('travel_requests')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          status
        `)
        .gte('pickup_datetime', filters.startDate)
        .lte('pickup_datetime', filters.endDate + 'T23:59:59')
        .in('status', ['approved', 'allocated', 'in_progress', 'completed']);

      if (error) throw error;

      const { data: locations } = await supabase
        .from('locations')
        .select('id, name, code');

      const locationMap = new Map(locations?.map(l => [l.name, l]) || []);

      // Count trips by location
      const locationStats = new Map<string, { asOrigin: number; asDestination: number }>();
      const routeStats = new Map<string, number>();

      requests?.forEach((request) => {
        // Origin stats
        const originStats = locationStats.get(request.pickup_location) || { asOrigin: 0, asDestination: 0 };
        originStats.asOrigin += 1;
        locationStats.set(request.pickup_location, originStats);

        // Destination stats
        const destStats = locationStats.get(request.dropoff_location) || { asOrigin: 0, asDestination: 0 };
        destStats.asDestination += 1;
        locationStats.set(request.dropoff_location, destStats);

        // Route stats
        const routeKey = `${request.pickup_location}→${request.dropoff_location}`;
        routeStats.set(routeKey, (routeStats.get(routeKey) || 0) + 1);
      });

      const items: LocationReportItem[] = Array.from(locationStats.entries()).map(([name, stats]) => {
        const location = locationMap.get(name);
        return {
          locationId: location?.id || name,
          locationName: name,
          locationCode: location?.code || '',
          tripsAsOrigin: stats.asOrigin,
          tripsAsDestination: stats.asDestination,
          totalTrips: stats.asOrigin + stats.asDestination,
        };
      }).sort((a, b) => b.totalTrips - a.totalTrips);

      const routes: RouteReportItem[] = Array.from(routeStats.entries())
        .map(([key, count]) => {
          const [pickup, dropoff] = key.split('→');
          return { pickup, dropoff, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        items,
        routes,
        totals: {
          totalTrips: requests?.length || 0,
          uniqueRoutes: routeStats.size,
        },
      };
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}

// Department Report Hook
export function useDepartmentReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['department-report', filters],
    queryFn: async (): Promise<DepartmentReportData> => {
      const { data: requests, error } = await supabase
        .from('travel_requests')
        .select(`
          id,
          requester_id,
          status,
          passenger_count
        `)
        .gte('created_at', filters.startDate)
        .lte('created_at', filters.endDate + 'T23:59:59');

      if (error) throw error;

      // Get requester profiles for department info
      const requesterIds = [...new Set(requests?.map(r => r.requester_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, department')
        .in('user_id', requesterIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p.department || 'Unassigned']) || []);

      // Aggregate by department
      const deptMap = new Map<string, DepartmentReportItem>();

      requests?.forEach((request) => {
        const department = profileMap.get(request.requester_id) || 'Unassigned';
        
        const existing = deptMap.get(department) || {
          department,
          totalRequests: 0,
          completedRequests: 0,
          rejectedRequests: 0,
          pendingRequests: 0,
          totalPassengers: 0,
          avgPassengers: 0,
        };

        existing.totalRequests += 1;
        existing.totalPassengers += request.passenger_count;
        
        if (request.status === 'completed') existing.completedRequests += 1;
        if (request.status === 'rejected') existing.rejectedRequests += 1;
        if (['draft', 'pending_approval', 'approved', 'allocated'].includes(request.status)) {
          existing.pendingRequests += 1;
        }

        deptMap.set(department, existing);
      });

      const items = Array.from(deptMap.values()).map(dept => ({
        ...dept,
        avgPassengers: dept.totalRequests > 0 ? dept.totalPassengers / dept.totalRequests : 0,
      })).sort((a, b) => b.totalRequests - a.totalRequests);

      const totalRequests = items.reduce((sum, d) => sum + d.totalRequests, 0);
      const totalCompleted = items.reduce((sum, d) => sum + d.completedRequests, 0);

      return {
        items,
        totals: {
          totalRequests,
          totalDepartments: items.length,
          overallCompletionRate: totalRequests > 0 ? Math.round((totalCompleted / totalRequests) * 100) : 0,
        },
      };
    },
    enabled: !!filters.startDate && !!filters.endDate,
  });
}
