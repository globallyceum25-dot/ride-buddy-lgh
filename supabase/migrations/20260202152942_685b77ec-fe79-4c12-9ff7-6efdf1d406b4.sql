-- Create public_form_links table
CREATE TABLE public.public_form_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  name TEXT NOT NULL,
  description TEXT,
  default_approver_id UUID,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  submission_count INTEGER DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.public_form_links ENABLE ROW LEVEL SECURITY;

-- Admins can manage form links
CREATE POLICY "Admins can manage form links" 
  ON public.public_form_links FOR ALL TO authenticated 
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Anyone can read active non-expired links (for public form validation)
CREATE POLICY "Public can read active links" 
  ON public.public_form_links FOR SELECT TO anon
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Add guest fields to travel_requests
ALTER TABLE public.travel_requests 
  ADD COLUMN guest_name TEXT,
  ADD COLUMN guest_email TEXT,
  ADD COLUMN guest_phone TEXT,
  ADD COLUMN form_link_id UUID REFERENCES public.public_form_links(id),
  ADD COLUMN is_guest_request BOOLEAN DEFAULT false;

-- Allow anon users to insert guest requests via public form
CREATE POLICY "Allow public request submissions"
  ON public.travel_requests FOR INSERT TO anon
  WITH CHECK (is_guest_request = true AND form_link_id IS NOT NULL);

-- Create function to increment form submission count
CREATE OR REPLACE FUNCTION public.increment_form_submissions(link_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public_form_links 
  SET submission_count = submission_count + 1 
  WHERE id = link_id;
END;
$$;