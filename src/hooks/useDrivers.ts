import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type DriverStatus = 'available' | 'on_trip' | 'on_leave' | 'inactive';
export type LicenseType = 'light' | 'heavy' | 'commercial';

export interface Driver {
  id: string;
  user_id: string;
  employee_id: string | null;
  license_number: string;
  license_type: LicenseType | null;
  license_expiry: string | null;
  status: DriverStatus | null;
  location_id: string | null;
  is_floating: boolean | null;
  emergency_contact: string | null;
  blood_group: string | null;
  date_joined: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
    employee_id: string | null;
  } | null;
  location?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface DriverInsert {
  user_id: string;
  employee_id?: string | null;
  license_number: string;
  license_type?: LicenseType | null;
  license_expiry?: string | null;
  status?: DriverStatus | null;
  location_id?: string | null;
  is_floating?: boolean | null;
  emergency_contact?: string | null;
  blood_group?: string | null;
  date_joined?: string | null;
  notes?: string | null;
}

export interface DriverUpdate extends Partial<DriverInsert> {
  id: string;
  is_active?: boolean;
}

export function useDrivers() {
  return useQuery({
    queryKey: ['drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          location:locations(id, name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Fetch profiles separately since we can't join auth.users
      const userIds = data.map(d => d.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, phone, employee_id')
        .in('user_id', userIds);
      
      // Map profiles to drivers
      const driversWithProfiles = data.map(driver => ({
        ...driver,
        profile: profiles?.find(p => p.user_id === driver.user_id) || null,
      }));
      
      return driversWithProfiles as Driver[];
    },
  });
}

export function useDriversWithRole() {
  return useQuery({
    queryKey: ['drivers-eligible'],
    queryFn: async () => {
      // Get users with driver role who don't have a driver record yet
      const { data: driverRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'driver');
      
      if (!driverRoles) return [];
      
      const userIds = driverRoles.map(r => r.user_id);
      
      // Get existing driver records
      const { data: existingDrivers } = await supabase
        .from('drivers')
        .select('user_id');
      
      const existingUserIds = existingDrivers?.map(d => d.user_id) || [];
      
      // Get profiles for eligible users (have driver role but no driver record)
      const eligibleUserIds = userIds.filter(id => !existingUserIds.includes(id));
      
      if (eligibleUserIds.length === 0) return [];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, employee_id')
        .in('user_id', eligibleUserIds);
      
      return profiles || [];
    },
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (driver: DriverInsert) => {
      const { data, error } = await supabase
        .from('drivers')
        .insert(driver)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      queryClient.invalidateQueries({ queryKey: ['drivers-eligible'] });
      toast.success('Driver created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create driver: ${error.message}`);
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: DriverUpdate) => {
      const { data, error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update driver: ${error.message}`);
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('drivers')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers'] });
      toast.success('Driver deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate driver: ${error.message}`);
    },
  });
}
