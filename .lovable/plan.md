

# Fix: Travel Requests Query - Missing Foreign Key Relationship

## Problem
The `useMyRequests` query is failing with a 400 error because it tries to join `travel_requests` with `profiles` using non-existent foreign key hints. The `travel_requests` table references `auth.users` directly, not `profiles`.

## Solution
Update the queries in `useRequests.ts` to fetch travel requests without the profile joins, then separately fetch profile data for the requester/approver.

---

## Technical Details

### Root Cause
```sql
-- travel_requests references auth.users, not profiles
requester_id UUID NOT NULL REFERENCES auth.users(id)
approver_id UUID REFERENCES auth.users(id)

-- profiles also references auth.users
user_id UUID NOT NULL REFERENCES auth.users(id)
```

There's no direct foreign key between `travel_requests` and `profiles`, so PostgREST can't use the `!foreign_key_hint` syntax.

### Fix Approach
Change the query to:
1. Fetch travel requests without profile joins
2. Collect unique requester/approver user IDs
3. Fetch profiles matching those user IDs in a separate query
4. Merge the data client-side

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useRequests.ts` | Update `useMyRequests`, `usePendingApprovals`, `useApprovalRequests`, and `useRequest` to use a two-step fetch approach |

---

## Implementation

### Updated Query Logic

```typescript
// Step 1: Fetch travel requests (no profile joins)
const { data: requests } = await supabase
  .from('travel_requests')
  .select('*')
  .order('created_at', { ascending: false });

// Step 2: Get unique user IDs
const userIds = [...new Set([
  ...requests.map(r => r.requester_id),
  ...requests.map(r => r.approver_id).filter(Boolean)
])];

// Step 3: Fetch profiles for those users
const { data: profiles } = await supabase
  .from('profiles')
  .select('user_id, full_name, email, department')
  .in('user_id', userIds);

// Step 4: Map profiles to requests
const profileMap = Object.fromEntries(
  profiles.map(p => [p.user_id, p])
);

return requests.map(r => ({
  ...r,
  requester: profileMap[r.requester_id],
  approver: r.approver_id ? profileMap[r.approver_id] : null
}));
```

### Affected Functions
- `useMyRequests()` - Staff viewing their requests
- `usePendingApprovals()` - Approvers viewing pending queue
- `useApprovalRequests()` - All requests for an approver
- `useRequest(id)` - Single request detail view

---

## Alternative: Add Foreign Keys (Not Recommended)
We could add foreign keys from `travel_requests` to `profiles`, but this would require:
- A database migration
- Ensuring `profiles.user_id` is unique (it should be)
- Risk of breaking existing data integrity

The two-step fetch approach is safer and doesn't require schema changes.

