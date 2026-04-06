
-- 1. Fix drivers: Replace broad SELECT with scoped policy
DROP POLICY IF EXISTS "Authenticated users can view active drivers" ON drivers;

CREATE POLICY "Users can view assigned driver info"
  ON drivers FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM allocations
      WHERE allocations.driver_id = drivers.id
      AND EXISTS (
        SELECT 1 FROM travel_requests
        WHERE travel_requests.id = allocations.request_id
        AND travel_requests.requester_id = auth.uid()
      )
    )
  );

-- 2. Fix vehicles: Replace broad SELECT with scoped policy
DROP POLICY IF EXISTS "Authenticated users can view active vehicles" ON vehicles;

CREATE POLICY "Users can view assigned vehicle info"
  ON vehicles FOR SELECT TO authenticated
  USING (
    is_admin(auth.uid())
    OR EXISTS (
      SELECT 1 FROM allocations
      WHERE allocations.vehicle_id = vehicles.id
      AND EXISTS (
        SELECT 1 FROM travel_requests
        WHERE travel_requests.id = allocations.request_id
        AND travel_requests.requester_id = auth.uid()
      )
    )
  );

-- 3. Secure audit_logs: Remove client INSERT policy, create SECURITY DEFINER function
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _table_name text DEFAULT NULL,
  _record_id uuid DEFAULT NULL,
  _old_values jsonb DEFAULT NULL,
  _new_values jsonb DEFAULT NULL,
  _ip_address text DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
  VALUES (auth.uid(), _action, _table_name, _record_id, _old_values, _new_values, _ip_address, _user_agent);
END;
$$;
