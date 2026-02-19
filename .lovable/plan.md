

# Add Notifications for Dispatched and In-Progress Status Changes

## Overview
When a trip status changes to "dispatched" or "in_progress", send a notification to the requester via both Telegram and email, informing them of the status update with relevant trip details.

## Changes

### 1. Update the `send-notification` edge function
**File:** `supabase/functions/send-notification/index.ts`

- Add two new notification types to the `NotificationPayload` type: `"trip_dispatched"` and `"trip_in_progress"`
- Build appropriate messages for each:
  - **Dispatched:** "Your travel request TR-XXXX-XXXX has been dispatched. Vehicle ABC-1234 and driver John Doe are on their way. Pickup: Feb 20, 2026 at 9:00 AM."
  - **In Progress:** "Your travel request TR-XXXX-XXXX trip is now in progress."
- Reuse existing email HTML template and Telegram formatting patterns

### 2. Add notification calls in `useUpdateAllocationStatus`
**File:** `src/hooks/useAllocations.ts`

- After successfully updating status to `dispatched` or `in_progress`, fire-and-forget a notification call
- Fetch the request details (request_number, route, requester_id, pickup_datetime), vehicle info, and driver name from the allocation data
- Call `supabase.functions.invoke('send-notification')` with the appropriate type

### 3. Add notification calls in `useBulkUpdateAllocationStatus`
**File:** `src/hooks/useAllocations.ts`

- Same logic as above but for pooled trips -- send a notification to each requester in the pool when bulk status changes to dispatched or in_progress

## Technical Details

**New payload types:**
```text
type: "trip_dispatched" | "trip_in_progress"
details: {
  requestNumber: string
  route: string
  vehicleInfo: string   (for dispatched)
  driverName: string    (for dispatched)
  pickupDatetime: string (for dispatched)
}
```

**Edge function templates:**

Dispatched email subject: "Travel Request TR-XXXX - Trip Dispatched"
Dispatched body: Vehicle and driver details with pickup time, informing requester the vehicle is on its way.

In-progress email subject: "Travel Request TR-XXXX - Trip In Progress"
In-progress body: Simple confirmation that the trip has started.

**No database changes needed.** All required data (profiles, vehicles, drivers) is already accessible.

