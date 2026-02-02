-- Create enums for vehicles and drivers
CREATE TYPE public.vehicle_status AS ENUM ('available', 'in_trip', 'maintenance', 'breakdown', 'retired');
CREATE TYPE public.vehicle_type AS ENUM ('sedan', 'suv', 'van', 'minibus', 'bus', 'other');
CREATE TYPE public.fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'cng');
CREATE TYPE public.ownership_type AS ENUM ('owned', 'leased', 'rented');
CREATE TYPE public.driver_status AS ENUM ('available', 'on_trip', 'on_leave', 'inactive');
CREATE TYPE public.license_type AS ENUM ('light', 'heavy', 'commercial');

-- Create vehicles table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_number TEXT NOT NULL UNIQUE,
  make TEXT,
  model TEXT,
  year INTEGER,
  vehicle_type public.vehicle_type,
  capacity INTEGER,
  fuel_type public.fuel_type,
  ownership public.ownership_type DEFAULT 'owned',
  status public.vehicle_status DEFAULT 'available',
  location_id UUID REFERENCES public.locations(id),
  insurance_expiry DATE,
  registration_expiry DATE,
  last_service_date DATE,
  next_service_due DATE,
  odometer INTEGER DEFAULT 0,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create drivers table
CREATE TABLE public.drivers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT,
  license_number TEXT NOT NULL,
  license_type public.license_type,
  license_expiry DATE,
  status public.driver_status DEFAULT 'available',
  location_id UUID REFERENCES public.locations(id),
  is_floating BOOLEAN DEFAULT false,
  emergency_contact TEXT,
  blood_group TEXT,
  date_joined DATE,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

-- Vehicles RLS Policies
CREATE POLICY "Admins can manage vehicles"
ON public.vehicles
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active vehicles"
ON public.vehicles
FOR SELECT
USING (is_active = true);

-- Enable RLS on drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- Drivers RLS Policies
CREATE POLICY "Admins can manage drivers"
ON public.drivers
FOR ALL
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Drivers can view their own record"
ON public.drivers
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Authenticated users can view active drivers"
ON public.drivers
FOR SELECT
USING (is_active = true);

-- Add updated_at triggers
CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
BEFORE UPDATE ON public.drivers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_vehicles_location ON public.vehicles(location_id);
CREATE INDEX idx_vehicles_status ON public.vehicles(status);
CREATE INDEX idx_drivers_location ON public.drivers(location_id);
CREATE INDEX idx_drivers_user ON public.drivers(user_id);
CREATE INDEX idx_drivers_status ON public.drivers(status);