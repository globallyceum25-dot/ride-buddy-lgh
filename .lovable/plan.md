

# Add Visual Indicator for Immediate Requests

## Approach
Immediate requests are identifiable by having `approver_id === null` and `status === 'approved'`. Show a ⚡ (Zap) icon badge in both the table and mobile card views.

## Changes

### `src/pages/Requests.tsx`
- Import `Zap` from lucide-react and `Tooltip` components
- Add a helper: `const isImmediate = (r: TravelRequest) => !r.approver_id && r.status === 'approved';`
- **Approver column (desktop)**: When `isImmediate`, show a small amber badge with Zap icon + "Immediate" text instead of "—"
- **Status column (desktop)**: After `RequestStatusBadge`, if `isImmediate`, render a small Zap icon with a tooltip "Immediate request — skipped approval"
- **Mobile cards**: Same Zap badge next to the status badges row

### `src/components/requests/RequestStatusBadge.tsx`
No changes needed — the indicator will be external to the badge.

