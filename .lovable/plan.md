

# Show Passenger Count on Pooled Trip Cards

## Overview

Add passenger count display to individual AllocationCard components within pooled trip groups, making it clear how many passengers each request in a shared pool contributes.

## Current State

- PoolGroup header shows total passengers (e.g., "3 passengers")
- Individual AllocationCard does NOT display passenger count
- The `passenger_count` data is available via `allocation.request?.passenger_count`

## Proposed Change

Add a passenger count indicator to each AllocationCard, particularly visible for grouped cards in pools:

```text
+==============================+
| Pool Trip                    |
| 5 passengers total           |
+------------------------------+
| +------------------------+   |
| | REQ-2024    VIP        |   |
| | John Smith             |   |
| | 👤 2 passengers        |   |  ← NEW: Individual passenger count
| | 📍 HQ → Lab Site       |   |
| | ⏰ 9:00 AM             |   |
| +------------------------+   |
| +------------------------+   |
| | REQ-2025               |   |
| | Jane Doe               |   |
| | 👤 3 passengers        |   |  ← NEW: Individual passenger count
| | 📍 HQ → Lab Site       |   |
| | ⏰ 9:15 AM             |   |
| +------------------------+   |
+==============================+
```

## Implementation Details

### Update AllocationCard Component

Add a passenger count row below the requester info:

```typescript
{/* Passenger Count */}
<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
  <Users className="h-3 w-3" />
  <span>
    {allocation.request?.passenger_count || 1} passenger{(allocation.request?.passenger_count || 1) !== 1 ? 's' : ''}
  </span>
</div>
```

### Styling Considerations

- Use `Users` icon (already imported) for consistency with pool header
- Match existing text styling (text-xs, text-muted-foreground)
- Position after requester info, before route
- Handles singular/plural grammar ("1 passenger" vs "2 passengers")

## Files to Modify

| File | Change |
|------|--------|
| `src/components/allocations/AllocationCard.tsx` | Add passenger count display row |

## Visual Result

Each card in a pool will now show its individual passenger contribution, while the pool header continues to show the aggregate total. This helps dispatchers:
- Understand passenger distribution across pooled requests
- Verify vehicle capacity against total passengers
- Identify which requests contribute most passengers

