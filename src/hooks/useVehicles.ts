import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type VehicleStatus = 'available' | 'in_trip' | 'maintenance' | 'breakdown' | 'retired';
export type VehicleType = 'sedan' | 'suv' | 'van' | 'minibus' | 'bus' | 'other';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'cng';
export type OwnershipType = 'owned' | 'leased' | 'rented';

export interface Vehicle {
  id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  year: number | null;
  vehicle_type: VehicleType | null;
  capacity: number | null;
  fuel_type: FuelType | null;
  ownership: OwnershipType | null;
  status: VehicleStatus | null;
  location_id: string | null;
  insurance_expiry: string | null;
  registration_expiry: string | null;
  last_service_date: string | null;
  next_service_due: string | null;
  odometer: number | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  location?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export interface VehicleInsert {
  registration_number: string;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vehicle_type?: VehicleType | null;
  capacity?: number | null;
  fuel_type?: FuelType | null;
  ownership?: OwnershipType | null;
  status?: VehicleStatus | null;
  location_id?: string | null;
  insurance_expiry?: string | null;
  registration_expiry?: string | null;
  last_service_date?: string | null;
  next_service_due?: string | null;
  odometer?: number | null;
  notes?: string | null;
}

export interface VehicleUpdate extends Partial<VehicleInsert> {
  id: string;
  is_active?: boolean;
}

export function useVehicles() {
  return useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select(`
          *,
          location:locations(id, name, code)
        `)
        .order('registration_number');
      
      if (error) throw error;
      return data as Vehicle[];
    },
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (vehicle: VehicleInsert) => {
      const { data, error } = await supabase
        .from('vehicles')
        .insert(vehicle)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create vehicle: ${error.message}`);
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: VehicleUpdate) => {
      const { data, error } = await supabase
        .from('vehicles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update vehicle: ${error.message}`);
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vehicle deactivated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to deactivate vehicle: ${error.message}`);
    },
  });
}
