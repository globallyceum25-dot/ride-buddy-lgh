import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, Enums } from '@/integrations/supabase/types';

export type AppRole = Enums<'app_role'>;

export interface UserWithDetails {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string | null;
  employee_id: string | null;
  department: string | null;
  cost_center: string | null;
  is_active: boolean;
  created_at: string;
  roles: AppRole[];
  primary_location: {
    id: string;
    name: string;
  } | null;
}

interface CreateUserData {
  identifier_type?: 'email' | 'phone';
  email?: string;
  full_name: string;
  phone?: string;
  employee_id?: string;
  department?: string;
  cost_center?: string;
  roles: AppRole[];
  primary_location_id?: string;
}

interface UpdateProfileData {
  full_name: string;
  phone?: string | null;
  employee_id?: string | null;
  department?: string | null;
  cost_center?: string | null;
  is_active?: boolean;
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async (): Promise<UserWithDetails[]> => {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');

      if (profilesError) throw profilesError;
      if (!profiles) return [];

      // Fetch all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Fetch all primary locations
      const { data: userLocations, error: locationsError } = await supabase
        .from('user_locations')
        .select('user_id, location_id, is_primary, locations(id, name)')
        .eq('is_primary', true);

      if (locationsError) throw locationsError;

      // Map roles by user_id
      const rolesByUser = new Map<string, AppRole[]>();
      roles?.forEach(r => {
        const existing = rolesByUser.get(r.user_id) || [];
        existing.push(r.role);
        rolesByUser.set(r.user_id, existing);
      });

      // Map locations by user_id
      const locationByUser = new Map<string, { id: string; name: string }>();
      userLocations?.forEach(ul => {
        if (ul.locations && ul.is_primary) {
          const loc = ul.locations as { id: string; name: string };
          locationByUser.set(ul.user_id, { id: loc.id, name: loc.name });
        }
      });

      // Combine data
      return profiles.map(profile => ({
        id: profile.id,
        user_id: profile.user_id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        employee_id: profile.employee_id,
        department: profile.department,
        cost_center: profile.cost_center,
        is_active: profile.is_active,
        created_at: profile.created_at,
        roles: rolesByUser.get(profile.user_id) || [],
        primary_location: locationByUser.get(profile.user_id) || null,
      }));
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateUserData) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('admin-create-user', {
        body: data,
      });

      // Handle function invocation error
      if (response.error) {
        // Try to get more specific error message from the response
        const errorMessage = response.error.message || 'Failed to create user';
        throw new Error(errorMessage);
      }

      // Handle application-level errors returned in the data
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (error: Error) => {
      console.error('Create user error:', error);
      toast({
        title: 'Error creating user',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: UpdateProfileData }) => {
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Profile updated',
        description: 'The user profile has been updated successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating profile',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useAddUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Role added',
        description: 'The role has been assigned successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error adding role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useRemoveUserRole() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: 'Role removed',
        description: 'The role has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error removing role',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useResetUserPassword() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (userId: string) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('reset-user-password', {
        body: { user_id: userId },
      });

      if (response.error) throw new Error(response.error.message || 'Failed to reset password');
      if (response.data?.error) throw new Error(response.data.error);

      return response.data as { success: boolean; temporary_password: string };
    },
    onError: (error: Error) => {
      console.error('Reset password error:', error);
      toast({
        title: 'Error resetting password',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useToggleUserActive() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({
        title: variables.isActive ? 'User activated' : 'User deactivated',
        description: `The user has been ${variables.isActive ? 'activated' : 'deactivated'} successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error updating user status',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
