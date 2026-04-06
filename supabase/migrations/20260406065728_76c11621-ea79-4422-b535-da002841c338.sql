
CREATE TABLE public.request_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  change_type text NOT NULL,
  current_values jsonb NOT NULL,
  requested_values jsonb NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.request_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requesters can view own change requests" ON public.request_change_requests
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Requesters can create change requests" ON public.request_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.travel_requests
      WHERE id = request_change_requests.request_id
      AND requester_id = auth.uid()
      AND status = 'approved'
      AND id NOT IN (SELECT request_id FROM public.allocations WHERE status != 'cancelled')
    )
  );

CREATE POLICY "Admins can manage change requests" ON public.request_change_requests
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Approvers can review change requests" ON public.request_change_requests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.travel_requests
    WHERE id = request_change_requests.request_id
    AND approver_id = auth.uid()
  ));

CREATE POLICY "Approvers can update change requests" ON public.request_change_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.travel_requests
    WHERE id = request_change_requests.request_id
    AND approver_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.travel_requests
    WHERE id = request_change_requests.request_id
    AND approver_id = auth.uid()
  ));

CREATE TRIGGER update_request_change_requests_updated_at
  BEFORE UPDATE ON public.request_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
