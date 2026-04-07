
-- Step 1: Create security definer function to check driver visibility
CREATE OR REPLACE FUNCTION public.can_view_driver(_user_id uuid, _driver_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM drivers WHERE id = _driver_id AND user_id = _user_id
  )
  OR public.is_admin(_user_id)
  OR EXISTS (
    SELECT 1 FROM allocations a
    JOIN travel_requests tr ON tr.id = a.request_id
    WHERE a.driver_id = _driver_id
    AND tr.requester_id = _user_id
  )
$$;

-- Step 2: Drop the recursive policies
DROP POLICY IF EXISTS "Users can view assigned driver info" ON drivers;
DROP POLICY IF EXISTS "Drivers can view their own record" ON drivers;

-- Step 3: Create a single clean policy using the function
CREATE POLICY "Users can view relevant drivers"
  ON drivers FOR SELECT TO authenticated
  USING (public.can_view_driver(auth.uid(), id));
