
# Admin Close Overdue Requests

## Overview

Add a "Close" action for admins on overdue pending requests in the Allocations page. When clicked, a dialog prompts for a closure reason, then sets the request status to `cancelled` with the reason logged in request history.

## Changes

### 1. New Component: `CloseRequestDialog.tsx`

A simple dialog with:
- Warning header explaining the request is overdue
- Request number and route summary displayed
- Required textarea for closure reason
- Cancel and "Close Request" (destructive) buttons

### 2. New Hook: `useCloseRequest` (in `useRequests.ts`)

A mutation that:
- Updates `travel_requests.status` to `cancelled`
- Inserts a `request_history` record with action "Request closed (overdue)", from_status, to_status `cancelled`, and the reason in `notes`
- Invalidates relevant query caches (`pending-allocation`, `my-requests`)

No schema migration needed -- the `cancelled` status already exists and `request_history.notes` stores the reason.

### 3. Update Allocations Page (`Allocations.tsx`)

- Add a "Close" button (destructive variant) next to the disabled "Assign" button for overdue requests
- Wire it to open the `CloseRequestDialog`
- On successful close, the request disappears from the pending list

### Visual Layout for Overdue Rows

```text
| TR-2026-0042 | John | HQ -> Airport | Feb 15 [OVERDUE] | 3 | Normal | [Close] [Assign-disabled] |
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/allocations/CloseRequestDialog.tsx` | Create | Dialog with reason textarea |
| `src/hooks/useRequests.ts` | Modify | Add `useCloseRequest` mutation |
| `src/pages/Allocations.tsx` | Modify | Add Close button for overdue requests, wire dialog |

### Technical Details

**useCloseRequest mutation:**
```typescript
export function useCloseRequest() {
  return useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      // Update status to cancelled
      await supabase.from('travel_requests')
        .update({ status: 'cancelled' }).eq('id', id);
      // Log with reason
      await supabase.from('request_history').insert({
        request_id: id,
        action: 'Request closed (overdue)',
        from_status: 'approved',
        to_status: 'cancelled',
        performed_by: user.id,
        notes: reason,
      });
    },
  });
}
```

**CloseRequestDialog** accepts: `request` object, `open` boolean, `onOpenChange`, and calls the mutation on submit.
