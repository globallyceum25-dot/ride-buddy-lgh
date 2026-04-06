import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface ChangeRequest {
  id: string;
  request_id: string;
  requested_by: string;
  change_type: 'reschedule' | 'passenger_update' | 'cancel';
  current_values: Record<string, unknown>;
  requested_values: Record<string, unknown>;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  requester?: { full_name: string; email: string } | null;
  travel_request?: {
    request_number: string;
    pickup_location: string;
    pickup_location_name: string | null;
    dropoff_location: string;
    dropoff_location_name: string | null;
    pickup_datetime: string;
    passenger_count: number;
    purpose: string;
    requester_id: string;
    approver_id: string | null;
  } | null;
}

export interface CreateChangeRequestInput {
  request_id: string;
  change_type: 'reschedule' | 'passenger_update' | 'cancel';
  current_values: Record<string, unknown>;
  requested_values: Record<string, unknown>;
  reason: string;
}

// Fetch change requests for a specific travel request
export function useChangeRequestsForRequest(requestId?: string) {
  return useQuery({
    queryKey: ['change-requests', 'by-request', requestId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('request_change_requests' as any)
        .select('*')
        .eq('request_id', requestId!)
        .order('created_at', { ascending: false }) as any);

      if (error) throw error;
      return (data || []) as ChangeRequest[];
    },
    enabled: !!requestId,
  });
}

// Fetch all pending change requests (for approvers/admins)
export function usePendingChangeRequests() {
  return useQuery({
    queryKey: ['change-requests', 'pending'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('request_change_requests' as any)
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related travel request info and requester profiles
      const enriched: ChangeRequest[] = [];
      for (const cr of data) {
        const { data: tr } = await supabase
          .from('travel_requests')
          .select('request_number, pickup_location, pickup_location_name, dropoff_location, dropoff_location_name, pickup_datetime, passenger_count, purpose, requester_id, approver_id')
          .eq('id', cr.request_id)
          .single();

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('user_id', cr.requested_by)
          .single();

        enriched.push({
          ...cr,
          travel_request: tr,
          requester: profile,
        } as ChangeRequest);
      }

      return enriched;
    },
  });
}

// Create a change request
export function useCreateChangeRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateChangeRequestInput) => {
      const { data, error } = await supabase
        .from('request_change_requests' as any)
        .insert({
          request_id: input.request_id,
          requested_by: user!.id,
          change_type: input.change_type,
          current_values: input.current_values,
          requested_values: input.requested_values,
          reason: input.reason,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify approver/coordinator
      try {
        const { data: request } = await supabase
          .from('travel_requests')
          .select('request_number, approver_id, pickup_location, pickup_location_name, dropoff_location, dropoff_location_name')
          .eq('id', input.request_id)
          .single();

        if (request?.approver_id) {
          const route = `${request.pickup_location_name || request.pickup_location} → ${request.dropoff_location_name || request.dropoff_location}`;
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke('send-notification', {
            headers: { Authorization: `Bearer ${session?.access_token}` },
            body: {
              recipientUserId: request.approver_id,
              type: 'change_request_submitted',
              details: {
                requestNumber: request.request_number,
                route,
                changeType: input.change_type,
                reason: input.reason,
              },
            },
          });
        }
      } catch (e) {
        console.error('Failed to send change request notification:', e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      toast({ title: 'Change request submitted', description: 'Your change request has been submitted for review.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// Review (approve/reject) a change request
export function useReviewChangeRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      changeRequestId,
      action,
      reviewNotes,
    }: {
      changeRequestId: string;
      action: 'approved' | 'rejected';
      reviewNotes?: string;
    }) => {
      // Fetch the change request
      const { data: cr, error: crError } = await supabase
        .from('request_change_requests' as any)
        .select('*')
        .eq('id', changeRequestId)
        .single();

      if (crError || !cr) throw new Error('Change request not found');

      // Update change request status
      const { error: updateError } = await supabase
        .from('request_change_requests' as any)
        .update({
          status: action,
          reviewed_by: user!.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes || null,
        })
        .eq('id', changeRequestId);

      if (updateError) throw updateError;

      // If approved, apply the change to the travel request
      if (action === 'approved') {
        const changeType = cr.change_type as string;
        const requestedValues = cr.requested_values as Record<string, unknown>;

        if (changeType === 'cancel') {
          await supabase
            .from('travel_requests')
            .update({ status: 'cancelled' })
            .eq('id', cr.request_id);
        } else if (changeType === 'reschedule') {
          const updateData: Record<string, unknown> = {};
          if (requestedValues.pickup_datetime) updateData.pickup_datetime = requestedValues.pickup_datetime;
          if (requestedValues.return_datetime !== undefined) updateData.return_datetime = requestedValues.return_datetime;
          await supabase
            .from('travel_requests')
            .update(updateData)
            .eq('id', cr.request_id);
        } else if (changeType === 'passenger_update') {
          if (requestedValues.passenger_count) {
            await supabase
              .from('travel_requests')
              .update({ passenger_count: requestedValues.passenger_count as number })
              .eq('id', cr.request_id);
          }
        }
      }

      // Notify the requester
      try {
        const { data: request } = await supabase
          .from('travel_requests')
          .select('request_number, pickup_location, pickup_location_name, dropoff_location, dropoff_location_name')
          .eq('id', cr.request_id)
          .single();

        if (request) {
          const route = `${request.pickup_location_name || request.pickup_location} → ${request.dropoff_location_name || request.dropoff_location}`;
          const { data: { session } } = await supabase.auth.getSession();
          await supabase.functions.invoke('send-notification', {
            headers: { Authorization: `Bearer ${session?.access_token}` },
            body: {
              recipientUserId: cr.requested_by,
              type: action === 'approved' ? 'change_request_approved' : 'change_request_rejected',
              details: {
                requestNumber: request.request_number,
                route,
                changeType: cr.change_type,
                reviewNotes: reviewNotes || '',
              },
            },
          });
        }
      } catch (e) {
        console.error('Failed to send review notification:', e);
      }

      return { action };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['change-requests'] });
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast({
        title: data.action === 'approved' ? 'Change request approved' : 'Change request rejected',
        description: data.action === 'approved' ? 'The change has been applied to the request.' : 'The change request has been rejected.',
      });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
