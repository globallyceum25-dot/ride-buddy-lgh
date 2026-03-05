ALTER TABLE travel_requests ADD COLUMN pickup_location_name text;
ALTER TABLE travel_requests ADD COLUMN dropoff_location_name text;
ALTER TABLE request_stops ADD COLUMN location_name text;