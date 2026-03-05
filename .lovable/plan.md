

# Fix Immediate Request Notifications to Coordinators

## Problem
The frontend code already notifies all `location_coordinator` users when an immediate request is created (lines 443-466 in `useRequests.ts`), but the `send-notification` edge function doesn't have a handler for the `immediate_allocation` notification type. It falls into the `else` branch (overdue handler), generating an incorrect message.

## Fix

### `supabase/functions/send-notification/index.ts`
1. Add `'immediate_allocation'` to the `NotificationPayload` type union
2. Add a new `else if (type === "immediate_allocation")` block that builds an appropriate subject and body:
   - Subject: `Travel Request {requestNumber} - Immediate Allocation Required`
   - Body: `An immediate travel request {requestNumber} requires allocation.\n\nRoute: {route}\nRequester: {requesterName}\nPickup: {pickupDatetime}\nPurpose: {purpose}`
3. Add a Telegram template with a ⚡ emoji for the immediate allocation type

This is a single-file change to the edge function. No other files need modification since the frontend already sends the correct payload.

