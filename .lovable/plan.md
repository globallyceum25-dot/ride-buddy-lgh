

# Requester Self-Service: Cancel, Reschedule, and Modify Requests

## Summary
Allow requesters to cancel, reschedule dates, or increase passenger count on their own requests — but only when no vehicle has been allocated yet. Changes to approved requests flow through a **change request** model where modifications are submitted as pending changes that coordinators/approvers can review.

## Design Rationale (International Standards)
- **ITIL Change Management**: Changes to approved items should go through a controlled process, not direct edits
- **Audit Trail**: Every modification is logged with before/after values
- **Separation of Concerns**: Draft/pending requests can be edited directly; approved requests require a change request workflow
- **Least Privilege**: Requesters can only modify their own requests, and only before allocation

## Business Rules

```text
Request Status     | Cancel | Reschedule | Update Passengers
─────────────────  ┼────────┼────────────┼──────────────────
draft              | Direct | Direct     | Direct
pending_approval   | Direct | Direct     | Direct
approved (no alloc)| Direct | Change Req | Change Req
allocated+         | Blocked| Blocked    | Blocked
cancelled          | N/A    | Blocked    | Blocked
completed          | N/A    | Blocked    | Blocked
```

- **Direct**: Immediate update, no approval needed
- **Change Request**: Creates a pending modification record that the approver/coordinator must accept
- **Blocked**: Not allowed (vehicle already assigned or trip finished)

## Database Changes

### New table: `request_change_requests`
Stores pending modifications submitted by requesters for approved (but unallocated) requests.

```sql
CREATE TABLE request_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
  requested_by uuid NOT NULL,
  change_type text NOT NULL, -- 'reschedule', 'passenger_update', 'cancel'
  current_values jsonb NOT NULL,
  requested_values jsonb NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by uuid,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE request_change_requests ENABLE ROW LEVEL SECURITY;

-- Requesters can view and create change requests for their own travel requests
CREATE POLICY "Requesters can view own change requests" ON request_change_requests
  FOR SELECT TO authenticated
  USING (requested_by = auth.uid());

CREATE POLICY "Requesters can create change requests" ON request_change_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM travel_requests
      WHERE id = request_change_requests.request_id
      AND requester_id = auth.uid()
      AND status = 'approved'
      AND id NOT IN (SELECT request_id FROM allocations WHERE status != 'cancelled')
    )
  );

-- Admins/coordinators can manage all change requests
CREATE POLICY "Admins can manage change requests" ON request_change_requests
  FOR ALL TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Approvers can view and update change requests for requests they approve
CREATE POLICY "Approvers can review change requests" ON request_change_requests
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM travel_requests
    WHERE id = request_change_requests.request_id
    AND approver_id = auth.uid()
  ));

CREATE POLICY "Approvers can update change requests" ON request_change_requests
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM travel_requests
    WHERE id = request_change_requests.request_id
    AND approver_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM travel_requests
    WHERE id = request_change_requests.request_id
    AND approver_id = auth.uid()
  ));
```

## Frontend Changes

### 1. `src/hooks/useChangeRequests.ts` (new)
- `useMyChangeRequests(requestId)` — fetch change requests for a specific travel request
- `useCreateChangeRequest()` — submit a reschedule/passenger update/cancel change request
- `useReviewChangeRequest()` — approve or reject (for admins/approvers), applies the change to the travel request on approval
- `usePendingChangeRequests()` — fetch all pending change requests (for coordinators/approvers)

### 2. `src/components/requests/ChangeRequestDialog.tsx` (new)
A dialog with tabs/sections for the three change types:
- **Reschedule**: Date/time picker for new pickup and optional return datetime, with mandatory reason
- **Update Passengers**: Number input for new passenger count, with reason
- **Cancel**: Reason field only
Shows current vs. requested values side-by-side for clarity.

### 3. `src/components/requests/RequestDetailDialog.tsx`
Add action buttons at the bottom of the dialog when the request is in an eligible state:
- "Request Change" button (for approved, unallocated requests) — opens ChangeRequestDialog
- "Cancel Request" button (for draft/pending) — uses existing cancel flow
- Show pending change requests in the timeline section with a distinctive badge

### 4. `src/pages/Requests.tsx`
- Add "Request Change" to the Actions dropdown for approved/unallocated requests
- Show a small indicator (badge/icon) on rows that have pending change requests

### 5. `src/pages/Approvals.tsx`
- Add a "Change Requests" tab or section showing pending change requests for the approver to review
- Review dialog with approve/reject + notes

### 6. Notification Integration
- When a change request is created: notify the approver/coordinator
- When a change request is approved/rejected: notify the requester
- Uses existing `send-notification` edge function with new types: `change_request_submitted`, `change_request_approved`, `change_request_rejected`

### 7. `supabase/functions/send-notification/index.ts`
Add handlers for the three new notification types with appropriate email subjects and Telegram messages.

## Files to create/modify

| File | Action |
|------|--------|
| Migration SQL | Create `request_change_requests` table with RLS |
| `src/hooks/useChangeRequests.ts` | New hook for CRUD operations |
| `src/components/requests/ChangeRequestDialog.tsx` | New dialog for submitting changes |
| `src/components/requests/ReviewChangeRequestDialog.tsx` | New dialog for approver review |
| `src/components/requests/RequestDetailDialog.tsx` | Add action buttons + pending changes display |
| `src/pages/Requests.tsx` | Add "Request Change" action to dropdown |
| `src/pages/Approvals.tsx` | Add change request review section |
| `src/hooks/useRequests.ts` | Update cancel logic to check allocation status |
| `supabase/functions/send-notification/index.ts` | Add 3 new notification types |

