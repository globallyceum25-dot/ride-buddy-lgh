

# Add Pending Change Request Indicator to Request Table Rows

## Approach
Query all pending change requests for the current user's requests in a single batch, then show a small badge/icon on rows that have pending modifications.

## Changes

### 1. `src/hooks/useChangeRequests.ts`
Add a new hook `useMyPendingChangeRequestIds()` that fetches all `request_change_requests` with `status = 'pending'` for the current user, and returns a `Set<string>` of `request_id` values. This avoids N+1 queries.

### 2. `src/pages/Requests.tsx`
- Import the new hook and call it at the top of the component.
- In the **desktop table**: Add a small orange `PenLine` icon with tooltip "Pending change request" next to the request number (or status badge) for rows where `pendingIds.has(request.id)`.
- In the **mobile cards**: Add the same indicator badge next to the status badges.

## Visual Design
A small orange badge with a `PenLine` icon and "Change Pending" text, similar to the existing "Immediate" badge pattern already used in the file. Wrapped in a Tooltip for clarity.

## Files to modify
| File | Change |
|------|--------|
| `src/hooks/useChangeRequests.ts` | Add `useMyPendingChangeRequestIds()` hook |
| `src/pages/Requests.tsx` | Show indicator on rows with pending changes |

