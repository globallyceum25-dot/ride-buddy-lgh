

# Prevent Allocation for Past-Date Requests

## Overview

Add validation to prevent coordinators from assigning vehicles and drivers to travel requests whose pickup date has already passed. Past-date requests will be visually flagged in the pending list and the "Assign" button will be disabled with a clear explanation.

## Changes

### 1. Allocations Page - Pending Requests Table (`src/pages/Allocations.tsx`)

- Add a past-date check for each pending request: `isPast = new Date(request.pickup_datetime) < new Date()`
- Show a visual warning indicator (amber/red badge or row highlight) for past-date requests
- Disable the "Assign" button for past-date requests with a tooltip explaining why
- Optionally disable the checkbox for merging past-date requests too

```text
Before:
| REQ-001 | John | HQ -> Airport | Feb 15 (past) | [Assign] |

After:
| REQ-001 | John | HQ -> Airport | Feb 15 [OVERDUE] | [Assign - disabled] |
                                                        "Cannot allocate:
                                                         pickup date has passed"
```

### 2. Allocation Dialog (`src/components/allocations/AllocationDialog.tsx`)

- Add a secondary guard: if the dialog somehow opens for a past-date request, show an alert banner at the top and disable the submit button
- Display a warning message: "This request's pickup date has passed. Please update the request date before allocating."

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Allocations.tsx` | Add `isPastDate` check, disable Assign button, show "Overdue" badge, disable merge checkbox for past requests |
| `src/components/allocations/AllocationDialog.tsx` | Add past-date guard with warning banner and disabled submit |

### Technical Details

**Past-date detection logic:**
```typescript
const isPastDate = (pickupDatetime: string) => {
  return new Date(pickupDatetime) < new Date();
};
```

**In the pending table row** (Allocations.tsx):
- Date cell gets an "Overdue" badge in destructive color when past
- Assign button becomes disabled with a tooltip: "Pickup date has passed"
- Checkbox for merge selection is also disabled for past-date requests

**In AllocationDialog** (safety net):
- Check `request.pickup_datetime` against current time
- If past, render an `Alert` with destructive variant at the top of the dialog
- Disable the "Assign" submit button

