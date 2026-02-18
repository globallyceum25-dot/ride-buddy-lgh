

# Send Notification When Vehicle and Driver Are Assigned

## Overview
When a coordinator assigns a vehicle and driver to a travel request (creates an allocation), the requester will receive a notification via both Telegram and email informing them of the assignment details.

## Changes

### 1. Update the `send-notification` edge function
**File:** `supabase/functions/send-notification/index.ts`

- Add a new notification type `allocation_assigned` to the `NotificationPayload` interface
- Add new detail fields: `vehicleInfo`, `driverName`, `pickupDatetime`
- Build an appropriate email HTML and Telegram message for this type, e.g.:
  > "Your travel request TR-2026-0012 has been assigned. Vehicle: ABC-1234 (Toyota HiAce). Driver: John Doe. Pickup: Feb 20, 2026 at 9:00 AM."

### 2. Call the notification from the allocation hooks
**File:** `src/hooks/useAllocations.ts`

- In `useCreateAllocation` `mutationFn`: after successfully creating the allocation and updating the request status, fetch the vehicle registration, driver name, and request details, then call `supabase.functions.invoke('send-notification')` with type `allocation_assigned` and the requester's user ID
- In `useCreateTripPool` `mutationFn`: similarly, after creating the pool and allocations, send a notification to each requester in the pool

The notification call will be fire-and-forget (non-blocking) so allocation creation is not slowed down or blocked if the notification fails.

### 3. No database changes needed
The existing `profiles` table already stores `email`, `telegram_chat_id`, and `full_name` -- all required for sending notifications.

## Technical Details

**New payload shape for `allocation_assigned`:**
```typescript
{
  recipientUserId: string;
  type: "allocation_assigned";
  details: {
    requestNumber: string;
    route: string;          // "Location A -> Location B"
    vehicleInfo: string;    // "ABC-1234 (Toyota HiAce)"
    driverName: string;     // "John Doe"
    pickupDatetime: string; // ISO datetime
  }
}
```

**Edge function message template (email):**
- Subject: "Travel Request TR-XXXX-XXXX - Vehicle & Driver Assigned"
- Body: Assignment confirmation with vehicle, driver, and pickup details

**Edge function message template (Telegram):**
- Same content formatted with HTML bold tags for readability

