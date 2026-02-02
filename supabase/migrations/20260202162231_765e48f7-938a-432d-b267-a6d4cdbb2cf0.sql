-- Create table for storing intermediate stops in multi-stop trips
CREATE TABLE public.request_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  location TEXT NOT NULL,
  stop_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (request_id, stop_order)
);

-- Enable RLS
ALTER TABLE public.request_stops ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view stops of requests they can view
CREATE POLICY "Users can view stops of viewable requests"
  ON public.request_stops FOR SELECT
  USING (public.can_view_request(auth.uid(), request_id));

-- Policy: Users can insert stops for their own requests
CREATE POLICY "Users can insert stops for own requests"
  ON public.request_stops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.travel_requests
      WHERE id = request_id AND requester_id = auth.uid()
    )
  );

-- Policy: Allow inserting stops for guest requests (via edge function)
CREATE POLICY "Allow stops for guest requests"
  ON public.request_stops FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.travel_requests
      WHERE id = request_id AND is_guest_request = true
    )
  );

-- Policy: Admins can manage all stops
CREATE POLICY "Admins can manage all stops"
  ON public.request_stops FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));