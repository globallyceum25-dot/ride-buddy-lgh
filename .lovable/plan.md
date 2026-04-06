

# Enable Admin Full Visibility Across Requests and Approvals

## Problem
- **Requests page**: Already works for admins via RLS (admins see all rows), but the query doesn't filter by `requester_id`, so this is fine.
- **Approvals page**: Hooks (`usePendingApprovals`, `useApprovalRequests`) filter by `approver_id = user.id` in the query, so admins only see requests where they are the assigned approver — not all requests system-wide.
- **Dashboard**: `usePendingApprovalsPreview` and `usePendingApprovalsCount` also filter by `approver_id = user.id`.

## Approach (RBAC / Least Privilege)
Check if the current user is an admin (`isAdmin()` from AuthContext). If so, skip the `approver_id` filter so they see all records. RLS already grants admins full SELECT access, so this is safe — we just need to stop artificially narrowing the query client-side.

## Changes

### 1. `src/hooks/useRequests.ts`
- **`usePendingApprovals()`**: Accept `isAdmin` flag. If admin, omit the `.eq('approver_id', user.id)` filter so all pending_approval requests are returned.
- **`useApprovalRequests()`**: Same pattern — skip approver_id filter for admins.

### 2. `src/hooks/useDashboardData.ts`
- **`usePendingApprovalsPreview()`**: Skip approver_id filter for admins.
- **`usePendingApprovalsCount()`**: Skip approver_id filter for admins.

### 3. `src/pages/Approvals.tsx`
- Import `useAuth` and pass `isAdmin()` result to the hooks.
- Add a visual indicator (e.g. info banner) when viewing as admin: "Showing all requests across the organization".

### 4. `src/hooks/useChangeRequests.ts`
- `usePendingChangeRequests()` already fetches all pending change requests without user filtering — RLS handles access. No change needed.

## Files to modify
| File | Change |
|------|--------|
| `src/hooks/useRequests.ts` | Skip approver_id filter when admin |
| `src/hooks/useDashboardData.ts` | Skip approver_id filter when admin |
| `src/pages/Approvals.tsx` | Pass isAdmin flag, add admin context banner |

