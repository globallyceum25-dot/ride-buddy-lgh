

# Immediate Requests — Skip Approval, Go Straight to Allocation

## Concept

Add an "Immediate" toggle/checkbox to the request creation form. When enabled:
- The approver field becomes optional (hidden)
- The request is saved with status `approved` instead of `pending_approval` (skipping the approval step)
- A notification is sent to the relevant location coordinator(s) instead of an approver
- The request appears directly in the Allocations Kanban for coordinators to assign vehicles

No database schema changes are needed — the existing `approved` status and nullable `approver_id` already support this flow.

## Changes

### 1. `src/components/requests/RequestDialog.tsx`
- Add an "Immediate Request" switch at the top of the form (using the existing Switch component)
- When toggled ON:
  - Hide the approver dropdown
  - Make `approver_id` validation optional (use `.optional()` in zod via a conditional schema or `.superRefine`)
  - Show a helper note: "This request will skip approval and go directly to transport coordinators for allocation"
- Pass `is_immediate: true` flag to the create mutation

### 2. `src/hooks/useRequests.ts`
- Extend `CreateRequestInput` with optional `is_immediate?: boolean`
- In `useCreateRequest` mutation:
  - If `is_immediate` is true, insert with `status: 'approved'` and `approver_id: null`
  - Log history as "Immediate request created" with `to_status: 'approved'`
  - Send notification to location coordinators instead of an approver (fetch users with `location_coordinator` role, notify them)
- Update success toast: "Submitted for immediate allocation" vs "Submitted for approval"

### 3. `src/components/requests/RequestStatusBadge.tsx`
- No changes needed — `approved` status badge already exists

### 4. `src/pages/Requests.tsx`
- No changes needed — immediate requests show up in the same list with "Approved" status

## Flow Summary

```text
Normal:    User creates request → pending_approval → Approver approves → approved → Coordinator allocates
Immediate: User creates request → approved (direct) → Coordinator notified → Coordinator allocates
```

## Files to modify
| File | Change |
|------|--------|
| `src/components/requests/RequestDialog.tsx` | Add immediate toggle, conditional approver field |
| `src/hooks/useRequests.ts` | Handle immediate flag in create mutation |

