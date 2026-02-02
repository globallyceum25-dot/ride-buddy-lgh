
# Fix Guest Request Requester Details Display

## Problem

On the Approvals page, guest requests (submitted via public form links) show incorrect requester information. The page displays the profile data from `request.requester` (which may be the default approver or empty) instead of the actual guest's details stored in `guest_name`, `guest_email`, etc.

## Root Cause

In `src/pages/Approvals.tsx`, lines 84-89, the requester cell always displays:
- `request.requester?.full_name`
- `request.requester?.department || request.requester?.email`

For guest requests, this data comes from a profile lookup based on `requester_id`, but guest requesters don't have profiles - their information is stored directly on the travel request in `guest_name`, `guest_email`, `guest_employee_id` fields.

## Solution

Update the Approvals page to conditionally display guest information when `is_guest_request` is true.

## Changes Required

| File | Change |
|------|--------|
| `src/pages/Approvals.tsx` | Conditionally render guest info vs profile info in the Requester column |

## Implementation

Update the `<TableCell>` for the Requester column (around line 83-90) to check `is_guest_request`:

```tsx
<TableCell>
  <div>
    {request.is_guest_request ? (
      <>
        <p className="font-medium">{request.guest_name || 'Guest'}</p>
        <p className="text-sm text-muted-foreground">
          {request.guest_employee_id || request.guest_email || 'No details'}
        </p>
      </>
    ) : (
      <>
        <p className="font-medium">{request.requester?.full_name}</p>
        <p className="text-sm text-muted-foreground">
          {request.requester?.department || request.requester?.email}
        </p>
      </>
    )}
  </div>
</TableCell>
```

## Expected Result

- Regular requests: Show profile name and department/email (no change)
- Guest requests: Show guest_name and guest_employee_id/guest_email from the travel request fields
