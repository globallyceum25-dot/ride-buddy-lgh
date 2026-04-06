
-- Drop the existing approver policy
DROP POLICY IF EXISTS "Approvers can view requester profiles" ON profiles;

-- Create a SECURITY DEFINER function that returns only safe profile fields for approvers
CREATE OR REPLACE FUNCTION public.get_requester_profile(_requester_user_id uuid)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  full_name text,
  phone text,
  employee_id text,
  department text,
  cost_center text,
  is_active boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.user_id, p.email, p.full_name, p.phone, p.employee_id, p.department, p.cost_center, p.is_active
  FROM profiles p
  WHERE p.user_id = _requester_user_id
    AND EXISTS (
      SELECT 1 FROM travel_requests tr
      WHERE tr.approver_id = auth.uid()
        AND tr.requester_id = _requester_user_id
    );
$$;

-- Re-add a narrower approver SELECT policy that still allows the ORM queries to work
-- but only exposes non-sensitive columns conceptually (RLS can't filter columns,
-- but we can limit which rows approvers see)
CREATE POLICY "Approvers can view requester profiles"
  ON profiles FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.approver_id = auth.uid()
        AND travel_requests.requester_id = profiles.user_id
    )
  );
