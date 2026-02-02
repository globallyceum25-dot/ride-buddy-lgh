
# Travel Request Module - Implementation Plan

## Overview
Build a complete travel request system where:
- **Staff** can submit transport requests
- **Approvers** (managers/HODs) review and approve/reject requests
- **Location Coordinators** can view and allocate approved requests
- All requests are tracked with full history and status updates

---

## Database Schema

### 1. New Enums

| Enum | Values |
|------|--------|
| `request_status` | `draft`, `pending_approval`, `approved`, `rejected`, `allocated`, `in_progress`, `completed`, `cancelled` |
| `request_priority` | `normal`, `urgent`, `vip` |
| `trip_type` | `one_way`, `round_trip`, `multi_stop` |

### 2. Travel Requests Table (`travel_requests`)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| request_number | text | Auto-generated reference (e.g., TR-2026-0001) |
| requester_id | uuid | FK to profiles (who made request) |
| status | request_status | Current status |
| priority | request_priority | Normal/Urgent/VIP |
| trip_type | trip_type | One-way/Round-trip/Multi-stop |
| purpose | text | Business purpose |
| passenger_count | integer | Number of passengers |
| pickup_location | text | Free text or FK |
| pickup_datetime | timestamptz | When to be picked up |
| dropoff_location | text | Destination |
| return_datetime | timestamptz | For round trips |
| special_requirements | text | Accessibility, luggage, etc. |
| cost_center | text | For billing |
| approver_id | uuid | FK to profiles (assigned approver) |
| approved_at | timestamptz | When approved |
| approved_by | uuid | Who approved |
| rejection_reason | text | If rejected |
| notes | text | Additional notes |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### 3. Request Passengers Table (`request_passengers`)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| request_id | uuid | FK to travel_requests |
| name | text | Passenger name |
| phone | text | Contact number |
| is_primary | boolean | Main contact |
| created_at | timestamptz | Auto |

### 4. Request History Table (`request_history`)

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| request_id | uuid | FK to travel_requests |
| action | text | Status change description |
| from_status | request_status | Previous status |
| to_status | request_status | New status |
| performed_by | uuid | FK to profiles |
| notes | text | Comments |
| created_at | timestamptz | Auto |

### 5. RLS Policies

**travel_requests:**
- Users can view their own requests (requester_id = auth.uid())
- Approvers can view requests assigned to them (approver_id = auth.uid())
- Admins/Coordinators can view all requests
- Users can create requests (requester_id set to their id)
- Approvers can update status (approve/reject)
- Admins can manage all requests

**request_passengers:**
- Same access as parent request

**request_history:**
- Read-only for all who can view the request
- Insert allowed for status changes

---

## Frontend Architecture

### Components Structure

```text
src/
├── pages/
│   ├── Requests.tsx          # Staff: My Requests list
│   └── Approvals.tsx         # Approver: Pending approvals
├── components/
│   └── requests/
│       ├── RequestForm.tsx           # Create/Edit request form
│       ├── RequestDialog.tsx         # Dialog wrapper
│       ├── RequestCard.tsx           # Card view for request
│       ├── RequestDetailDialog.tsx   # View request details
│       ├── ApprovalDialog.tsx        # Approve/Reject dialog
│       ├── RequestStatusBadge.tsx    # Status indicator
│       └── RequestTimeline.tsx       # History timeline
└── hooks/
    └── useRequests.ts        # React Query hooks
```

---

## Page: My Requests (`/requests`)

**For Staff role**

### Features
- **Create New Request** button opens form dialog
- **List View** showing all user's requests:
  - Request number, Purpose, Status, Date, Actions
  - Filter by status (All, Pending, Approved, etc.)
  - Sort by date
- **Request Cards** showing:
  - Status badge (color-coded)
  - Pickup/Dropoff details
  - Scheduled date/time
  - Approval status
- **Actions:**
  - View Details
  - Edit (if draft or pending)
  - Cancel (if not yet allocated)

### Request Form Dialog

**Step-by-step or single form:**
1. **Trip Details:**
   - Trip Type (One-way, Round-trip)
   - Pickup Location (text input)
   - Pickup Date & Time
   - Dropoff Location
   - Return Date/Time (if round-trip)

2. **Passengers:**
   - Number of passengers
   - Add passenger names & phones (optional)
   - Mark primary contact

3. **Additional Info:**
   - Purpose of travel (required)
   - Priority (Normal/Urgent/VIP)
   - Special Requirements (textarea)
   - Cost Center (auto-filled from profile, editable)

4. **Approval:**
   - Select Approver (dropdown of users with 'approver' role)
   - This triggers workflow

**Form Validation:**
- Pickup datetime must be in future
- Return datetime must be after pickup
- Purpose required
- Approver required

---

## Page: Approvals (`/approvals`)

**For Approver role**

### Features
- **Tabs:** Pending | Approved | Rejected
- **Pending List:** Requests awaiting decision
  - Show requester name, purpose, date
  - Quick approve/reject buttons
- **Approval Dialog:**
  - View full request details
  - Add comments
  - Approve or Reject with reason

### Approval Actions
- **Approve:** Sets status to `approved`, records who/when
- **Reject:** Sets status to `rejected`, requires reason

---

## React Query Hook: `useRequests.ts`

### Queries
- `useMyRequests()` - Fetch current user's requests
- `usePendingApprovals()` - Fetch requests pending user's approval
- `useRequest(id)` - Fetch single request with passengers/history

### Mutations
- `useCreateRequest()` - Create new request
- `useUpdateRequest()` - Update draft/pending request
- `useCancelRequest()` - Set status to cancelled
- `useApproveRequest()` - Approve and set status
- `useRejectRequest()` - Reject with reason

---

## Database Function: Auto-generate Request Number

```sql
CREATE OR REPLACE FUNCTION generate_request_number()
RETURNS TRIGGER AS $$
DECLARE
  year_part text;
  seq_num integer;
BEGIN
  year_part := to_char(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(request_number FROM 'TR-\d{4}-(\d+)') AS integer)
  ), 0) + 1
  INTO seq_num
  FROM travel_requests
  WHERE request_number LIKE 'TR-' || year_part || '-%';
  
  NEW.request_number := 'TR-' || year_part || '-' || LPAD(seq_num::text, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## Route Updates

Add to `src/App.tsx`:
```tsx
// Staff: My Requests
<Route path="/requests" element={
  <ProtectedRoute allowedRoles={['staff']}>
    <Requests />
  </ProtectedRoute>
} />

// Approvers: Approval Queue
<Route path="/approvals" element={
  <ProtectedRoute allowedRoles={['approver']}>
    <Approvals />
  </ProtectedRoute>
} />
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/migrations/xxx_travel_requests.sql` | Database schema |
| `src/pages/Requests.tsx` | My Requests page |
| `src/pages/Approvals.tsx` | Approvals page |
| `src/hooks/useRequests.ts` | React Query hooks |
| `src/components/requests/RequestDialog.tsx` | Create/Edit form |
| `src/components/requests/RequestDetailDialog.tsx` | View details |
| `src/components/requests/ApprovalDialog.tsx` | Approve/Reject |
| `src/components/requests/RequestStatusBadge.tsx` | Status display |
| `src/components/requests/RequestTimeline.tsx` | History view |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add /requests and /approvals routes |
| `src/pages/Dashboard.tsx` | Wire up "New Request" button |

---

## Implementation Order

1. **Database Migration** - Create tables, enums, functions, and RLS
2. **useRequests Hook** - Data fetching and mutations
3. **RequestStatusBadge** - Reusable status component
4. **RequestDialog** - Create/Edit form
5. **Requests Page** - Staff view with list
6. **ApprovalDialog** - Approve/Reject flow
7. **Approvals Page** - Approver view
8. **Dashboard Integration** - Connect New Request button
9. **RequestTimeline** - History visualization

---

## Status Flow

```text
draft -> pending_approval -> approved -> allocated -> in_progress -> completed
                          -> rejected
                          
[User creates] -> [Approver reviews] -> [Coordinator allocates] -> [Driver completes]
```

---

## UI/UX Notes

- **Status Colors:**
  - Draft: Gray
  - Pending Approval: Yellow/Amber
  - Approved: Green
  - Rejected: Red
  - Allocated: Blue
  - In Progress: Purple
  - Completed: Green (different shade)
  - Cancelled: Gray

- **Empty States:** Clear CTAs for creating first request
- **Toast Notifications:** For all actions (create, approve, reject)
- **Loading States:** Skeleton loaders while fetching
- **Mobile Responsive:** Cards stack on mobile

---

## Security Considerations

- RLS ensures users only see their own requests
- Approvers only see requests assigned to them
- Status transitions validated server-side
- Rejection requires reason (not blank)
- History auto-logged on status changes
