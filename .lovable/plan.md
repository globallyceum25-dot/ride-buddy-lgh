

# Fix Infinite Recursion in Drivers RLS Policy

## Root Cause
The `drivers` table returns **HTTP 500** with error `"infinite recursion detected in policy for relation 'drivers'"` (Postgres error 42P17). This breaks:
- Drivers page (completely fails to load)
- Allocations page (joins to `drivers` fail, so allocations with driver data don't render)
- Any page that queries `drivers` (trip schedule, reports, etc.)

The problematic policy is **"Users can view assigned driver info"**:
```sql
USING (
  (user_id = auth.uid()) OR is_admin(auth.uid()) OR 
  (EXISTS (
    SELECT 1 FROM allocations
    WHERE allocations.driver_id = drivers.id
    AND EXISTS (
      SELECT 1 FROM travel_requests
      WHERE travel_requests.id = allocations.request_id
      AND travel_requests.requester_id = auth.uid()
    )
  ))
)
```

When PostgREST evaluates queries like `allocations JOIN drivers`, it checks the drivers RLS policy, which queries `allocations`, which also has RLS policies that may reference `drivers` — creating infinite recursion.

## Solution
Replace the recursive policy with a `SECURITY DEFINER` function that bypasses RLS when checking if a user can view a driver. This follows the same pattern already used successfully in this project for `has_role()`, `is_admin()`, and `can_view_request()`.

### Step 1: Create a `can_view_driver` function
```sql
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
```

### Step 2: Replace the problematic policy
Drop the existing recursive policies on `drivers` and create clean replacements:

```sql
DROP POLICY IF EXISTS "Users can view assigned driver info" ON drivers;
DROP POLICY IF EXISTS "Drivers can view their own record" ON drivers;

CREATE POLICY "Users can view relevant drivers"
  ON drivers FOR SELECT TO authenticated
  USING (public.can_view_driver(auth.uid(), id));
```

The "Admins can manage drivers" ALL policy remains unchanged.

## Impact
- Fixes the Drivers page (currently completely broken)
- Fixes driver data in Allocations, Trip Schedule, and Reports
- No application code changes needed — only database-level fix
- Security model unchanged: same access rules, just implemented without recursion

## Files to modify
| File | Change |
|------|--------|
| New migration SQL | Create `can_view_driver` function, replace drivers RLS policies |

