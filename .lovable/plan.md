

# Send Approval Request Notifications to Approvers via Telegram and Email

## Overview
When a travel request is submitted (status set to `pending_approval`), notify the assigned approver via both Telegram and email so they can take action promptly.

## Changes

### 1. Update the `send-notification` edge function
**File:** `supabase/functions/send-notification/index.ts`

- Add a new notification type: `"approval_requested"`
- Build message templates:
  - **Email subject:** "Travel Request TR-XXXX-XXXX - Approval Required"
  - **Email body:** "A new travel request TR-XXXX-XXXX requires your approval. Route: Location A to Location B. Requester: Jane Smith. Pickup: Feb 20, 2026 at 9:00 AM. Purpose: [purpose text]."
  - **Telegram:** Same content with HTML bold formatting and a clipboard emoji
- Add new optional detail fields: `requesterName` and `purpose`

### 2. Trigger notification in `useCreateRequest`
**File:** `src/hooks/useRequests.ts`

- After the request is created and the history entry is logged (around line 415), add a fire-and-forget notification call
- The request already has `approver_id`, `request_number`, route info, and `pickup_datetime` available from the insert response
- Fetch the requester's name from the current user's profile
- Call `supabase.functions.invoke('send-notification')` with:
  - `recipientUserId`: the `approver_id`
  - `type`: `"approval_requested"`
  - `details`: request number, route, pickup datetime, requester name, purpose

### 3. Trigger notification in `submit-public-request` edge function
**File:** `supabase/functions/submit-public-request/index.ts`

- After the public request is created, send the same `approval_requested` notification to the `default_approver_id`
- Use the guest name as the requester name

## Technical Details

**New payload type:**
```text
type: "approval_requested"
details: {
  requestNumber: string
  route: string
  pickupDatetime: string
  requesterName: string
  purpose: string
}
```

**No database changes needed.** All required data is already available at the point of request creation.

The notification calls are fire-and-forget so request creation is never blocked by notification failures.

