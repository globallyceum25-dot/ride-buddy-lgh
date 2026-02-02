import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GuestInfo {
  name: string;
  employee_id: string;
  email: string;
  phone: string;
}

interface RequestData {
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  return_datetime?: string;
  trip_type: 'one_way' | 'round_trip' | 'multi_stop';
  passenger_count: number;
  purpose: string;
  special_requirements?: string;
  notes?: string;
  stops?: string[];
}

interface SubmitPublicRequestParams {
  token: string;
  guestInfo: GuestInfo;
  requestData: RequestData;
}

export function usePublicFormLink(token: string | undefined) {
  return useQuery({
    queryKey: ['public-form-link', token],
    queryFn: async () => {
      if (!token) throw new Error('No token provided');
      
      const { data, error } = await supabase
        .from('public_form_links')
        .select('id, name, description, is_active, expires_at')
        .eq('token', token)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Invalid or expired link');
      
      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error('This form link has expired');
      }

      return data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useSubmitPublicRequest() {
  return useMutation({
    mutationFn: async ({ token, guestInfo, requestData }: SubmitPublicRequestParams) => {
      const { data, error } = await supabase.functions.invoke('submit-public-request', {
        body: { token, guestInfo, requestData },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Request ${data.requestNumber} submitted successfully!`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to submit request');
    },
  });
}

// Hook for admin to manage form links
export function useFormLinks() {
  return useQuery({
    queryKey: ['form-links'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('public_form_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateFormLink() {
  return useMutation({
    mutationFn: async (formData: {
      name: string;
      description?: string;
      default_approver_id?: string;
      expires_at?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('public_form_links')
        .insert({
          ...formData,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Form link created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create form link');
    },
  });
}

export function useUpdateFormLink() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string; is_active?: boolean; name?: string; description?: string; default_approver_id?: string; expires_at?: string | null }) => {
      const { data, error } = await supabase
        .from('public_form_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Form link updated');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update form link');
    },
  });
}

export function useDeleteFormLink() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('public_form_links')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Form link deleted');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete form link');
    },
  });
}
