

# Reschedule Overdue Requests from Allocations Page

## Overview

Add a "Reschedule" button for overdue requests in the Allocations page, allowing coordinators to update the pickup date/time without closing the request.

## Changes

### 1. New Component: `RescheduleRequestDialog.tsx`

A dialog containing:
- The request number and route summary for context
- A date picker (using Shadcn Popover + Calendar) for the new pickup date
- A time input for the new pickup time
- Optional: update return date/time if the request has one
- Cancel and "Reschedule" (primary) buttons

### 2. New Mutation: `useRescheduleRequest` (in `useRequests.ts`)

A mutation that:
- Updates `travel_requests.pickup_datetime` (and optionally `return_datetime`) for the given request ID
- Inserts a `request_history` record with action "Request rescheduled", noting the old and new dates
- Invalidates `pending-allocation` and `my-requests` query caches

No schema migration needed -- we are updating existing columns.

### 3. Update Allocations Page (`Allocations.tsx`)

- Add a "Reschedule" button (outline variant, with Calendar icon) next to the "Close" button for overdue requests
- Wire it to open the `RescheduleRequestDialog`
- After successful reschedule, the request's date updates and it becomes allocatable again

### Visual Layout for Overdue Rows

```text
| TR-2026-0042 | John | HQ -> Airport | Feb 15 [OVERDUE] | 3 | Normal | [Reschedule] [Close] [Assign-disabled] |
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/allocations/RescheduleRequestDialog.tsx` | Create | Dialog with date/time picker for new pickup |
| `src/hooks/useRequests.ts` | Modify | Add `useRescheduleRequest` mutation |
| `src/pages/Allocations.tsx` | Modify | Add Reschedule button for overdue requests, wire dialog |

## Technical Details

**useRescheduleRequest mutation:**
```typescript
mutationFn: async ({ id, pickupDatetime, returnDatetime }) => {
  const { data: oldRequest } = await supabase
    .from('travel_requests').select('pickup_datetime, status').eq('id', id).single();

  await supabase.from('travel_requests')
    .update({ pickup_datetime: pickupDatetime, return_datetime: returnDatetime })
    .eq('id', id);

  await supabase.from('request_history').insert({
    request_id: id,
    action: 'Request rescheduled',
    notes: `Pickup changed from ${oldRequest.pickup_datetime} to ${pickupDatetime}`,
  });
}
```

**RescheduleRequestDialog** validates that the new date is in the future before allowing submission.

