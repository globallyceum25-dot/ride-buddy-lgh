-- Create enums for travel requests
CREATE TYPE public.request_status AS ENUM (
  'draft',
  'pending_approval',
  'approved',
  'rejected',
  'allocated',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE public.request_priority AS ENUM ('normal', 'urgent', 'vip');

CREATE TYPE public.trip_type AS ENUM ('one_way', 'round_trip', 'multi_stop');

-- Create travel_requests table
CREATE TABLE public.travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number TEXT UNIQUE,
  requester_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.request_status NOT NULL DEFAULT 'draft',
  priority public.request_priority NOT NULL DEFAULT 'normal',
  trip_type public.trip_type NOT NULL DEFAULT 'one_way',
  purpose TEXT NOT NULL,
  passenger_count INTEGER NOT NULL DEFAULT 1,
  pickup_location TEXT NOT NULL,
  pickup_datetime TIMESTAMPTZ NOT NULL,
  dropoff_location TEXT NOT NULL,
  return_datetime TIMESTAMPTZ,
  special_requirements TEXT,
  cost_center TEXT,
  approver_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create request_passengers table
CREATE TABLE public.request_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create request_history table
CREATE TABLE public.request_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  from_status public.request_status,
  to_status public.request_status,
  performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create function to generate request number
CREATE OR REPLACE FUNCTION public.generate_request_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  year_part text;
  seq_num integer;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'TR-\d{4}-(\d+)') AS integer)
  ), 0) + 1
  INTO seq_num
  FROM travel_requests
  WHERE request_number LIKE 'TR-' || year_part || '-%';
  
  NEW.request_number := 'TR-' || year_part || '-' || LPAD(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$;

-- Create trigger for auto-generating request number
CREATE TRIGGER set_request_number
  BEFORE INSERT ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_request_number();

-- Create trigger for updated_at
CREATE TRIGGER update_travel_requests_updated_at
  BEFORE UPDATE ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to log request history
CREATE OR REPLACE FUNCTION public.log_request_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO request_history (request_id, action, from_status, to_status, performed_by)
    VALUES (NEW.id, 'Status changed', OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for logging status changes
CREATE TRIGGER log_request_status
  AFTER UPDATE ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.log_request_status_change();

-- Create helper function to check if user can view request
CREATE OR REPLACE FUNCTION public.can_view_request(_user_id UUID, _request_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM travel_requests
    WHERE id = _request_id
    AND (
      requester_id = _user_id
      OR approver_id = _user_id
      OR public.is_admin(_user_id)
    )
  )
$$;

-- Enable RLS on all tables
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for travel_requests
CREATE POLICY "Users can view their own requests"
  ON public.travel_requests FOR SELECT
  USING (requester_id = auth.uid());

CREATE POLICY "Approvers can view assigned requests"
  ON public.travel_requests FOR SELECT
  USING (approver_id = auth.uid());

CREATE POLICY "Admins can view all requests"
  ON public.travel_requests FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can create their own requests"
  ON public.travel_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Users can update their own draft/pending requests"
  ON public.travel_requests FOR UPDATE
  USING (requester_id = auth.uid() AND status IN ('draft', 'pending_approval'))
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "Approvers can update assigned requests"
  ON public.travel_requests FOR UPDATE
  USING (approver_id = auth.uid())
  WITH CHECK (approver_id = auth.uid());

CREATE POLICY "Admins can manage all requests"
  ON public.travel_requests FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for request_passengers
CREATE POLICY "Users can view passengers of their requests"
  ON public.request_passengers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.id = request_passengers.request_id
      AND (
        travel_requests.requester_id = auth.uid()
        OR travel_requests.approver_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "Users can manage passengers of their requests"
  ON public.request_passengers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.id = request_passengers.request_id
      AND travel_requests.requester_id = auth.uid()
      AND travel_requests.status IN ('draft', 'pending_approval')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.id = request_passengers.request_id
      AND travel_requests.requester_id = auth.uid()
      AND travel_requests.status IN ('draft', 'pending_approval')
    )
  );

CREATE POLICY "Admins can manage all passengers"
  ON public.request_passengers FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- RLS Policies for request_history
CREATE POLICY "Users can view history of their requests"
  ON public.request_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.id = request_history.request_id
      AND (
        travel_requests.requester_id = auth.uid()
        OR travel_requests.approver_id = auth.uid()
        OR public.is_admin(auth.uid())
      )
    )
  );

CREATE POLICY "System can insert history"
  ON public.request_history FOR INSERT
  WITH CHECK (performed_by = auth.uid() OR performed_by IS NULL);

-- Create indexes for performance
CREATE INDEX idx_travel_requests_requester ON public.travel_requests(requester_id);
CREATE INDEX idx_travel_requests_approver ON public.travel_requests(approver_id);
CREATE INDEX idx_travel_requests_status ON public.travel_requests(status);
CREATE INDEX idx_request_passengers_request ON public.request_passengers(request_id);
CREATE INDEX idx_request_history_request ON public.request_history(request_id);