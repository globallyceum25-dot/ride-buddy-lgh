-- Add guest_employee_id column to travel_requests table
ALTER TABLE travel_requests 
  ADD COLUMN guest_employee_id TEXT;