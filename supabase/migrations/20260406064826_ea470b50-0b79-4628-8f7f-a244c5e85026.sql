
-- =============================================
-- 1. FIX DRIVERS: Scope all policies to authenticated
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view active drivers" ON drivers;
DROP POLICY IF EXISTS "Drivers can view their own record" ON drivers;
DROP POLICY IF EXISTS "Admins can manage drivers" ON drivers;

CREATE POLICY "Authenticated users can view active drivers" ON drivers FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Drivers can view their own record" ON drivers FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can manage drivers" ON drivers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- =============================================
-- 2. FIX VEHICLES: Scope all policies to authenticated
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can view active vehicles" ON vehicles;
DROP POLICY IF EXISTS "Admins can manage vehicles" ON vehicles;

CREATE POLICY "Authenticated users can view active vehicles" ON vehicles FOR SELECT TO authenticated USING (is_active = true);
CREATE POLICY "Admins can manage vehicles" ON vehicles FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));

-- =============================================
-- 3. FIX REQUEST_HISTORY: Scope INSERT to authenticated only
-- =============================================
DROP POLICY IF EXISTS "System can insert history" ON request_history;

CREATE POLICY "Authenticated users can insert history" ON request_history FOR INSERT TO authenticated
WITH CHECK (
  performed_by = auth.uid()
  OR (performed_by IS NULL AND EXISTS (
    SELECT 1 FROM travel_requests
    WHERE travel_requests.id = request_history.request_id
    AND (travel_requests.requester_id = auth.uid() OR travel_requests.approver_id = auth.uid() OR is_admin(auth.uid()))
  ))
);

-- Also fix SELECT to authenticated
DROP POLICY IF EXISTS "Users can view history of their requests" ON request_history;

CREATE POLICY "Users can view history of their requests" ON request_history FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM travel_requests
  WHERE travel_requests.id = request_history.request_id
  AND (travel_requests.requester_id = auth.uid() OR travel_requests.approver_id = auth.uid() OR is_admin(auth.uid()))
));

-- =============================================
-- 4. FIX AUDIT_LOGS: Remove NULL user_id branch
-- =============================================
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;

CREATE POLICY "Authenticated users can insert audit logs" ON audit_logs FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid());

-- =============================================
-- 5. FIX REQUEST_STOPS: Remove overly permissive guest policy
-- =============================================
DROP POLICY IF EXISTS "Allow stops for guest requests" ON request_stops;

-- Also tighten remaining request_stops policies to authenticated
DROP POLICY IF EXISTS "Admins can manage all stops" ON request_stops;
DROP POLICY IF EXISTS "Users can insert stops for own requests" ON request_stops;
DROP POLICY IF EXISTS "Users can view stops of viewable requests" ON request_stops;

CREATE POLICY "Admins can manage all stops" ON request_stops FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can insert stops for own requests" ON request_stops FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM travel_requests WHERE travel_requests.id = request_stops.request_id AND travel_requests.requester_id = auth.uid()
));
CREATE POLICY "Users can view stops of viewable requests" ON request_stops FOR SELECT TO authenticated USING (can_view_request(auth.uid(), request_id));

-- =============================================
-- 6. FIX REQUEST_PASSENGERS: Scope to authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all passengers" ON request_passengers;
DROP POLICY IF EXISTS "Users can manage passengers of their requests" ON request_passengers;
DROP POLICY IF EXISTS "Users can view passengers of their requests" ON request_passengers;

CREATE POLICY "Admins can manage all passengers" ON request_passengers FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Users can manage passengers of their requests" ON request_passengers FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM travel_requests WHERE travel_requests.id = request_passengers.request_id AND travel_requests.requester_id = auth.uid() AND travel_requests.status = ANY (ARRAY['draft'::request_status, 'pending_approval'::request_status])
))
WITH CHECK (EXISTS (
  SELECT 1 FROM travel_requests WHERE travel_requests.id = request_passengers.request_id AND travel_requests.requester_id = auth.uid() AND travel_requests.status = ANY (ARRAY['draft'::request_status, 'pending_approval'::request_status])
));
CREATE POLICY "Users can view passengers of their requests" ON request_passengers FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM travel_requests WHERE travel_requests.id = request_passengers.request_id AND (travel_requests.requester_id = auth.uid() OR travel_requests.approver_id = auth.uid() OR is_admin(auth.uid()))
));

-- =============================================
-- 7. FIX TRAVEL_REQUESTS: Scope non-anon policies to authenticated
-- =============================================
DROP POLICY IF EXISTS "Admins can manage all requests" ON travel_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON travel_requests;
DROP POLICY IF EXISTS "Approvers can update assigned requests" ON travel_requests;
DROP POLICY IF EXISTS "Approvers can view assigned requests" ON travel_requests;
DROP POLICY IF EXISTS "Users can create their own requests" ON travel_requests;
DROP POLICY IF EXISTS "Users can update their own draft/pending requests" ON travel_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON travel_requests;

CREATE POLICY "Admins can manage all requests" ON travel_requests FOR ALL TO authenticated USING (is_admin(auth.uid())) WITH CHECK (is_admin(auth.uid()));
CREATE POLICY "Admins can view all requests" ON travel_requests FOR SELECT TO authenticated USING (is_admin(auth.uid()));
CREATE POLICY "Approvers can update assigned requests" ON travel_requests FOR UPDATE TO authenticated USING (approver_id = auth.uid()) WITH CHECK (approver_id = auth.uid());
CREATE POLICY "Approvers can view assigned requests" ON travel_requests FOR SELECT TO authenticated USING (approver_id = auth.uid());
CREATE POLICY "Users can create their own requests" ON travel_requests FOR INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can update their own draft/pending requests" ON travel_requests FOR UPDATE TO authenticated USING (requester_id = auth.uid() AND status = ANY (ARRAY['draft'::request_status, 'pending_approval'::request_status])) WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Users can view their own requests" ON travel_requests FOR SELECT TO authenticated USING (requester_id = auth.uid());

-- =============================================
-- 8. FIX ALLOCATIONS: Scope to authenticated
-- =============================================
DROP POLICY IF EXISTS "Drivers can view their assigned allocations" ON allocations;
DROP POLICY IF EXISTS "Requesters can view their allocations" ON allocations;

CREATE POLICY "Drivers can view their assigned allocations" ON allocations FOR SELECT TO authenticated
USING (driver_id IN (SELECT drivers.id FROM drivers WHERE drivers.user_id = auth.uid()));
CREATE POLICY "Requesters can view their allocations" ON allocations FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM travel_requests WHERE travel_requests.id = allocations.request_id AND travel_requests.requester_id = auth.uid()));
