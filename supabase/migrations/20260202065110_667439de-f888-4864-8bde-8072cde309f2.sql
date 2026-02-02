-- Create allocation_status enum
CREATE TYPE allocation_status AS ENUM (
  'scheduled',
  'dispatched', 
  'in_progress',
  'completed',
  'cancelled'
);

-- Create pool_status enum
CREATE TYPE pool_status AS ENUM (
  'pending',
  'confirmed',
  'dispatched',
  'completed',
  'cancelled'
);

-- Create trip_pools table (must be created before allocations due to FK)
CREATE TABLE public.trip_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_number text UNIQUE,
  vehicle_id uuid REFERENCES public.vehicles(id),
  driver_id uuid REFERENCES public.drivers(id),
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  total_passengers integer DEFAULT 0,
  route_summary text,
  status pool_status DEFAULT 'pending',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create allocations table
CREATE TABLE public.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.travel_requests(id) ON DELETE CASCADE NOT NULL,
  vehicle_id uuid REFERENCES public.vehicles(id),
  driver_id uuid REFERENCES public.drivers(id),
  pool_id uuid REFERENCES public.trip_pools(id) ON DELETE SET NULL,
  allocated_by uuid,
  allocated_at timestamptz DEFAULT now(),
  scheduled_pickup timestamptz NOT NULL,
  scheduled_dropoff timestamptz,
  actual_pickup timestamptz,
  actual_dropoff timestamptz,
  odometer_start integer,
  odometer_end integer,
  notes text,
  status allocation_status DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trip_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trip_pools
CREATE POLICY "Admins can manage all pools"
ON public.trip_pools
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Drivers can view their assigned pools"
ON public.trip_pools
FOR SELECT
TO authenticated
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

-- RLS Policies for allocations
CREATE POLICY "Admins can manage all allocations"
ON public.allocations
FOR ALL
TO authenticated
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Drivers can view their assigned allocations"
ON public.allocations
FOR SELECT
TO authenticated
USING (driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid()));

CREATE POLICY "Requesters can view their allocations"
ON public.allocations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM travel_requests
    WHERE travel_requests.id = allocations.request_id
    AND travel_requests.requester_id = auth.uid()
  )
);

-- Trigger for pool_number generation
CREATE OR REPLACE FUNCTION public.generate_pool_number()
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
    CAST(SUBSTRING(pool_number FROM 'POOL-\d{4}-(\d+)') AS integer)
  ), 0) + 1
  INTO seq_num
  FROM trip_pools
  WHERE pool_number LIKE 'POOL-' || year_part || '-%';
  
  NEW.pool_number := 'POOL-' || year_part || '-' || LPAD(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_pool_number
BEFORE INSERT ON public.trip_pools
FOR EACH ROW
WHEN (NEW.pool_number IS NULL)
EXECUTE FUNCTION public.generate_pool_number();

-- Trigger for updated_at
CREATE TRIGGER update_allocations_updated_at
BEFORE UPDATE ON public.allocations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trip_pools_updated_at
BEFORE UPDATE ON public.trip_pools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_allocations_request_id ON public.allocations(request_id);
CREATE INDEX idx_allocations_vehicle_id ON public.allocations(vehicle_id);
CREATE INDEX idx_allocations_driver_id ON public.allocations(driver_id);
CREATE INDEX idx_allocations_pool_id ON public.allocations(pool_id);
CREATE INDEX idx_allocations_status ON public.allocations(status);
CREATE INDEX idx_trip_pools_scheduled_date ON public.trip_pools(scheduled_date);
CREATE INDEX idx_trip_pools_status ON public.trip_pools(status);