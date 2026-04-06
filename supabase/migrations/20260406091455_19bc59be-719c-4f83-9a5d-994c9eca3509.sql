
-- 1. Restrict system_settings to admins only
DROP POLICY IF EXISTS "Authenticated users can read system_settings" ON system_settings;

CREATE POLICY "Admins can read system_settings"
  ON system_settings FOR SELECT TO authenticated
  USING (is_admin(auth.uid()));

-- 2. Fix group_admin escalation: block assigning admin-equivalent roles
DROP POLICY IF EXISTS "Group admins can manage roles" ON user_roles;

-- Separate into SELECT, INSERT, UPDATE, DELETE for granular control
CREATE POLICY "Group admins can view all roles"
  ON user_roles FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'group_admin'::app_role));

CREATE POLICY "Group admins can insert non-admin roles"
  ON user_roles FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'group_admin'::app_role)
    AND role NOT IN ('group_admin'::app_role, 'location_coordinator'::app_role)
  );

CREATE POLICY "Group admins can update non-admin roles"
  ON user_roles FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'group_admin'::app_role))
  WITH CHECK (
    has_role(auth.uid(), 'group_admin'::app_role)
    AND role NOT IN ('group_admin'::app_role, 'location_coordinator'::app_role)
  );

CREATE POLICY "Group admins can delete non-admin roles"
  ON user_roles FOR DELETE TO authenticated
  USING (
    has_role(auth.uid(), 'group_admin'::app_role)
    AND role NOT IN ('group_admin'::app_role, 'location_coordinator'::app_role)
  );

-- 3. Tighten anonymous guest request submission to validate form_link_id
DROP POLICY IF EXISTS "Allow public request submissions" ON travel_requests;

CREATE POLICY "Allow public request submissions"
  ON travel_requests FOR INSERT TO anon
  WITH CHECK (
    is_guest_request = true
    AND form_link_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public_form_links
      WHERE public_form_links.id = form_link_id
        AND public_form_links.is_active = true
        AND (public_form_links.expires_at IS NULL OR public_form_links.expires_at > now())
    )
  );
