import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';

type RequestStatus = Database['public']['Enums']['request_status'];
type RequestPriority = Database['public']['Enums']['request_priority'];
type TripType = Database['public']['Enums']['trip_type'];

export interface TravelRequest {
  id: string;
  request_number: string;
  requester_id: string;
  status: RequestStatus;
  priority: RequestPriority;
  trip_type: TripType;
  purpose: string;
  passenger_count: number;
  pickup_location: string;
  pickup_datetime: string;
  dropoff_location: string;
  return_datetime: string | null;
  special_requirements: string | null;
  cost_center: string | null;
  approver_id: string | null;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Guest request fields
  is_guest_request: boolean | null;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  guest_employee_id: string | null;
  form_link_id: string | null;
  requester?: {
    full_name: string;
    email: string;
    department: string | null;
  };
  approver?: {
    full_name: string;
    email: string;
  } | null;
}

export interface RequestPassenger {
  id: string;
  request_id: string;
  name: string;
  phone: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface RequestHistory {
  id: string;
  request_id: string;
  action: string;
  from_status: RequestStatus | null;
  to_status: RequestStatus | null;
  performed_by: string | null;
  notes: string | null;
  created_at: string;
  performer?: {
    full_name: string;
  } | null;
}

export interface RequestStop {
  id: string;
  request_id: string;
  location: string;
  stop_order: number;
  created_at: string;
}

export interface CreateRequestInput {
  trip_type: TripType;
  purpose: string;
  passenger_count: number;
  pickup_location: string;
  pickup_datetime: string;
  dropoff_location: string;
  return_datetime?: string | null;
  special_requirements?: string | null;
  cost_center?: string | null;
  approver_id: string;
  priority?: RequestPriority;
  notes?: string | null;
  passengers?: { name: string; phone?: string; is_primary?: boolean }[];
  stops?: string[];
}

// Helper function to fetch profiles for a list of user IDs
async function fetchProfilesForUsers(userIds: string[]) {
  if (userIds.length === 0) return new Map<string, { full_name: string; email: string; department: string | null }>();
  
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, full_name, email, department')
    .in('user_id', userIds);
  
  if (error) throw error;
  
  const profileMap = new Map<string, { full_name: string; email: string; department: string | null }>();
  profiles?.forEach(p => {
    profileMap.set(p.user_id, {
      full_name: p.full_name,
      email: p.email,
      department: p.department,
    });
  });
  
  return profileMap;
}

// Helper function to enrich requests with profile data
function enrichRequestsWithProfiles(
  requests: any[],
  profileMap: Map<string, { full_name: string; email: string; department: string | null }>
): TravelRequest[] {
  return requests.map(r => ({
    ...r,
    requester: profileMap.get(r.requester_id) || undefined,
    approver: r.approver_id ? profileMap.get(r.approver_id) || null : null,
  }));
}

// Fetch current user's requests
export function useMyRequests(statusFilter?: RequestStatus) {
  return useQuery({
    queryKey: ['my-requests', statusFilter],
    queryFn: async () => {
      // Step 1: Fetch travel requests (no profile joins)
      let query = supabase
        .from('travel_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: requests, error } = await query;
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Step 2: Get unique user IDs
      const userIds = [...new Set([
        ...requests.map(r => r.requester_id),
        ...requests.map(r => r.approver_id).filter(Boolean) as string[]
      ])];

      // Step 3: Fetch profiles for those users
      const profileMap = await fetchProfilesForUsers(userIds);

      // Step 4: Merge profile data into requests
      return enrichRequestsWithProfiles(requests, profileMap);
    },
  });
}

// Fetch requests pending user's approval
export function usePendingApprovals() {
  return useQuery({
    queryKey: ['pending-approvals'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Fetch travel requests
      const { data: requests, error } = await supabase
        .from('travel_requests')
        .select('*')
        .eq('approver_id', user.id)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Step 2: Get unique user IDs
      const userIds = [...new Set([
        ...requests.map(r => r.requester_id),
        ...requests.map(r => r.approver_id).filter(Boolean) as string[]
      ])];

      // Step 3: Fetch profiles
      const profileMap = await fetchProfilesForUsers(userIds);

      // Step 4: Merge profile data
      return enrichRequestsWithProfiles(requests, profileMap);
    },
  });
}

// Fetch all approval requests (for approvers - all statuses)
export function useApprovalRequests(statusFilter?: RequestStatus) {
  return useQuery({
    queryKey: ['approval-requests', statusFilter],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Step 1: Fetch travel requests
      let query = supabase
        .from('travel_requests')
        .select('*')
        .eq('approver_id', user.id)
        .order('created_at', { ascending: false });

      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }

      const { data: requests, error } = await query;
      if (error) throw error;
      if (!requests || requests.length === 0) return [];

      // Step 2: Get unique user IDs
      const userIds = [...new Set([
        ...requests.map(r => r.requester_id),
        ...requests.map(r => r.approver_id).filter(Boolean) as string[]
      ])];

      // Step 3: Fetch profiles
      const profileMap = await fetchProfilesForUsers(userIds);

      // Step 4: Merge profile data
      return enrichRequestsWithProfiles(requests, profileMap);
    },
  });
}

// Fetch single request with passengers, history, and stops
export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: ['request', id],
    queryFn: async () => {
      if (!id) return null;

      // Step 1: Fetch request, passengers, history, and stops in parallel
      const [requestResult, passengersResult, historyResult, stopsResult] = await Promise.all([
        supabase
          .from('travel_requests')
          .select('*')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('request_passengers')
          .select('*')
          .eq('request_id', id)
          .order('is_primary', { ascending: false }),
        supabase
          .from('request_history')
          .select('*')
          .eq('request_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('request_stops')
          .select('*')
          .eq('request_id', id)
          .order('stop_order', { ascending: true }),
      ]);

      if (requestResult.error) throw requestResult.error;
      if (passengersResult.error) throw passengersResult.error;
      if (historyResult.error) throw historyResult.error;
      if (stopsResult.error) throw stopsResult.error;

      if (!requestResult.data) {
        return {
          request: null,
          passengers: passengersResult.data as RequestPassenger[],
          history: [],
          stops: [],
        };
      }

      // Step 2: Collect all user IDs from request and history
      const userIds = [...new Set([
        requestResult.data.requester_id,
        requestResult.data.approver_id,
        ...historyResult.data.map(h => h.performed_by).filter(Boolean) as string[]
      ].filter(Boolean) as string[])];

      // Step 3: Fetch all profiles at once
      const profileMap = await fetchProfilesForUsers(userIds);

      // Step 4: Enrich request with profile data
      const enrichedRequest: TravelRequest = {
        ...requestResult.data,
        requester: profileMap.get(requestResult.data.requester_id),
        approver: requestResult.data.approver_id 
          ? profileMap.get(requestResult.data.approver_id) || null 
          : null,
      };

      // Step 5: Enrich history with performer data
      const enrichedHistory: RequestHistory[] = historyResult.data.map(h => ({
        ...h,
        performer: h.performed_by ? { full_name: profileMap.get(h.performed_by)?.full_name || 'Unknown' } : null,
      }));

      return {
        request: enrichedRequest,
        passengers: passengersResult.data as RequestPassenger[],
        history: enrichedHistory,
        stops: stopsResult.data as RequestStop[],
      };
    },
    enabled: !!id,
  });
}

// Fetch approvers (users with approver role)
export function useApprovers() {
  return useQuery({
    queryKey: ['approvers'],
    queryFn: async () => {
      // First get user_ids with approver role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'approver');

      if (roleError) throw roleError;
      
      if (!roleData || roleData.length === 0) {
        return [];
      }

      const userIds = roleData.map(r => r.user_id);
      
      // Then fetch profiles for those users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email, department')
        .in('user_id', userIds)
        .eq('is_active', true);

      if (profilesError) throw profilesError;
      
      return profilesData || [];
    },
  });
}

// Create new request
export function useCreateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateRequestInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { passengers, stops, ...requestData } = input;

      // Create the request
      const { data: request, error: requestError } = await supabase
        .from('travel_requests')
        .insert({
          ...requestData,
          requester_id: user.id,
          status: 'pending_approval',
        })
        .select()
        .single();

      if (requestError) throw requestError;

      // Add passengers if provided
      if (passengers && passengers.length > 0) {
        const { error: passengersError } = await supabase
          .from('request_passengers')
          .insert(
            passengers.map(p => ({
              request_id: request.id,
              name: p.name,
              phone: p.phone || null,
              is_primary: p.is_primary || false,
            }))
          );

        if (passengersError) throw passengersError;
      }

      // Add stops if provided (for multi-stop trips)
      if (stops && stops.length > 0) {
        const { error: stopsError } = await supabase
          .from('request_stops')
          .insert(
            stops.map((location, index) => ({
              request_id: request.id,
              location,
              stop_order: index + 1,
            }))
          );

        if (stopsError) throw stopsError;
      }

      // Log creation in history
      await supabase.from('request_history').insert({
        request_id: request.id,
        action: 'Request created',
        to_status: 'pending_approval',
        performed_by: user.id,
      });

      return request;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast({
        title: 'Request Created',
        description: 'Your travel request has been submitted for approval.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Update request
export function useUpdateRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<CreateRequestInput> & { id: string }) => {
      const { error } = await supabase
        .from('travel_requests')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.id] });
      toast({
        title: 'Request Updated',
        description: 'Your changes have been saved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Cancel request
export function useCancelRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('travel_requests')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (error) throw error;

      // Log cancellation
      await supabase.from('request_history').insert({
        request_id: id,
        action: 'Request cancelled',
        to_status: 'cancelled',
        performed_by: user.id,
      });
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', id] });
      toast({
        title: 'Request Cancelled',
        description: 'Your request has been cancelled.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Approve request
export function useApproveRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('travel_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user.id,
        })
        .eq('id', id);

      if (error) throw error;

      // Log approval
      await supabase.from('request_history').insert({
        request_id: id,
        action: 'Request approved',
        from_status: 'pending_approval',
        to_status: 'approved',
        performed_by: user.id,
        notes,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.id] });
      toast({
        title: 'Request Approved',
        description: 'The travel request has been approved.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Close overdue request (admin)
export function useCloseRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, reason, fromStatus }: { id: string; reason: string; fromStatus: RequestStatus }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('travel_requests')
        .update({ status: 'cancelled' as RequestStatus })
        .eq('id', id);

      if (error) throw error;

      await supabase.from('request_history').insert({
        request_id: id,
        action: 'Request closed (overdue)',
        from_status: fromStatus,
        to_status: 'cancelled' as RequestStatus,
        performed_by: user.id,
        notes: reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      toast({
        title: 'Request Closed',
        description: 'The overdue request has been closed.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Reschedule overdue request
export function useRescheduleRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      id,
      pickupDatetime,
      returnDatetime,
      oldPickupDatetime,
    }: {
      id: string;
      pickupDatetime: string;
      returnDatetime?: string;
      oldPickupDatetime: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const updateData: Record<string, string> = { pickup_datetime: pickupDatetime };
      if (returnDatetime) {
        updateData.return_datetime = returnDatetime;
      }

      const { error } = await supabase
        .from('travel_requests')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      await supabase.from('request_history').insert({
        request_id: id,
        action: 'Request rescheduled',
        performed_by: user.id,
        notes: `Pickup changed from ${oldPickupDatetime} to ${pickupDatetime}`,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-allocation'] });
      queryClient.invalidateQueries({ queryKey: ['my-requests'] });
      toast({
        title: 'Request Rescheduled',
        description: 'The pickup date has been updated.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Reject request
export function useRejectRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      id, 
      reason, 
      notes 
    }: { id: string; reason: string; notes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('travel_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', id);

      if (error) throw error;

      // Log rejection
      await supabase.from('request_history').insert({
        request_id: id,
        action: 'Request rejected',
        from_status: 'pending_approval',
        to_status: 'rejected',
        performed_by: user.id,
        notes: notes || reason,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['request', variables.id] });
      toast({
        title: 'Request Rejected',
        description: 'The travel request has been rejected.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}
