
-- Create hailing service type enum
CREATE TYPE public.hailing_service_type AS ENUM ('pickme', 'uber', 'personal');

-- Add hailing_service column to allocations table
ALTER TABLE public.allocations 
ADD COLUMN hailing_service public.hailing_service_type NULL;
