

# Fix: Approver Account Not Loading

## Problem
The Approvals page fails to load for approvers because they cannot fetch requester profile information due to restrictive RLS policies on the `profiles` table.

## Root Cause
When `usePendingApprovals` runs:
1. Fetches travel requests where `approver_id = current_user` - works fine
2. Calls `fetchProfilesForUsers()` to get requester names - **BLOCKED BY RLS**

Current RLS on `profiles`:
- Users can only view their own profile
- Only admins/group_admins can view all profiles

Approvers are neither, so they get empty/error results.

## Solution
Add a new RLS policy allowing approvers to view basic profile information for users whose requests they can access.

---

## Implementation

### Database Migration

Create a new RLS policy on the `profiles` table:

```sql
-- Allow approvers to view profiles of requesters whose requests they are assigned to approve
CREATE POLICY "Approvers can view requester profiles"
ON profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM travel_requests
    WHERE travel_requests.approver_id = auth.uid()
    AND travel_requests.requester_id = profiles.user_id
  )
);
```

This policy allows an approver to see profiles of users who have travel requests assigned to them for approval.

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_approver_profile_access.sql` | Add RLS policy |

---

## Alternative Approach (If Above Doesn't Work)

If the policy above causes performance issues with large datasets, we could:
1. Create a security definer function that bypasses RLS to fetch minimal profile info
2. Call that function from the frontend instead of directly querying profiles

```sql
CREATE OR REPLACE FUNCTION get_profiles_for_approvals(p_user_ids uuid[])
RETURNS TABLE (
  user_id uuid,
  full_name text,
  email text,
  department text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.user_id, p.full_name, p.email, p.department
  FROM profiles p
  WHERE p.user_id = ANY(p_user_ids)
  AND p.is_active = true;
$$;
```

But the RLS policy approach is cleaner and preferred.

---

## Implementation Order

1. Create database migration with new RLS policy
2. Test the Approvals page with an approver account
3. Verify requester names now display correctly

---

## Security Considerations

- The new policy only exposes profiles to approvers for requesters in their approval queue
- Approvers cannot see profiles of arbitrary users
- Only basic profile info is accessible (name, email, department)

