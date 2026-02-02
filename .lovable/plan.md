
# Pool Grouping on Kanban Board

## Overview

Add visual grouping for trips that share the same `pool_id`, displaying them in a connected container that makes it clear they are part of the same shared ride. This improves coordination visibility for dispatchers managing pooled trips.

## Current State

- Individual cards show "Pooled Trip" banner with accent highlighting
- Cards with the same `pool_id` are scattered within columns
- No visual connection between trips in the same pool
- Each card rendered independently

## Proposed Design

```text
+------------------+
| [Dispatched] 5   |
+------------------+
| +==============+ |  ← Pool Group Container (dashed border)
| | Pool #P-001  | |  ← Pool Header with pool number
| | 3 passengers | |  ← Total passenger count
| +------------- + |
| | Card 1       | |  ← Individual allocation cards
| | REQ-2024     | |    stacked within the group
| +--------------+ |
| | Card 2       | |
| | REQ-2025     | |
| +--------------+ |
| +==============+ |
|                  |
| +------------+   |  ← Non-pooled card (standalone)
| | REQ-2026   |   |
| +------------+   |
+------------------+
```

## Key Features

### 1. Pool Group Container
- Rounded container with dashed/dotted accent border
- Gradient background matching pool theme
- Visual distinction from standalone cards

### 2. Pool Header
- Pool number display (P-001, etc.)
- Total passenger count badge
- Shared vehicle/driver info
- Collapse/expand toggle for large pools

### 3. Grouped Card Styling
- Cards within pool have reduced spacing
- Connected appearance with subtle overlap or tight margins
- Maintains individual card functionality (drag, actions)

### 4. Drag Behavior Options
- **Individual drag**: Move single trip out of pool (with confirmation)
- **Group drag**: Move entire pool together when dragging header

## Implementation Plan

### Phase 1: Create Pool Group Component

**New Component: `PoolGroup.tsx`**

Wrapper component that renders all allocations sharing a `pool_id`:

```typescript
interface PoolGroupProps {
  poolId: string;
  allocations: Allocation[];
  onStartTrip: (allocation: Allocation) => void;
  // ... other handlers
}
```

### Phase 2: Update KanbanColumn

Modify the rendering logic to:
1. Separate allocations into pooled and non-pooled
2. Group pooled allocations by `pool_id`
3. Render `PoolGroup` for each pool
4. Render standalone `AllocationCard` for non-pooled

### Phase 3: Sort Logic

Order items within each column:
1. Pool groups first (sorted by earliest scheduled pickup)
2. Non-pooled cards after (sorted by scheduled pickup)

## Files to Create/Modify

| File | Action | Description |
|------|---------|-------------|
| `src/components/allocations/PoolGroup.tsx` | Create | Pool group container component |
| `src/components/allocations/KanbanColumn.tsx` | Update | Group allocations by pool_id |
| `src/components/allocations/AllocationCard.tsx` | Update | Add `isGrouped` prop for reduced spacing |

## Technical Details

### Grouping Logic in KanbanColumn

```typescript
// Separate pooled and non-pooled allocations
const { pooledGroups, standaloneAllocations } = useMemo(() => {
  const pooled: Record<string, Allocation[]> = {};
  const standalone: Allocation[] = [];
  
  allocations.forEach((allocation) => {
    if (allocation.pool_id) {
      if (!pooled[allocation.pool_id]) {
        pooled[allocation.pool_id] = [];
      }
      pooled[allocation.pool_id].push(allocation);
    } else {
      standalone.push(allocation);
    }
  });
  
  return { 
    pooledGroups: Object.entries(pooled),
    standaloneAllocations: standalone,
  };
}, [allocations]);
```

### PoolGroup Component Structure

```typescript
function PoolGroup({ poolId, allocations, ...handlers }: PoolGroupProps) {
  // Fetch pool details (number, total passengers)
  const totalPassengers = allocations.reduce(
    (sum, a) => sum + (a.request?.passenger_count || 0), 0
  );
  
  return (
    <div className="rounded-lg border-2 border-dashed border-accent bg-accent/5 p-2">
      {/* Pool Header */}
      <div className="flex items-center justify-between mb-2 px-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-accent" />
          <span className="font-medium text-sm">Pooled Trip</span>
        </div>
        <Badge variant="secondary">
          {totalPassengers} passengers
        </Badge>
      </div>
      
      {/* Grouped Cards */}
      <div className="space-y-1.5">
        {allocations.map((allocation) => (
          <AllocationCard
            key={allocation.id}
            allocation={allocation}
            isGrouped
            {...handlers}
          />
        ))}
      </div>
    </div>
  );
}
```

### Card Styling Updates

Add `isGrouped` prop to `AllocationCard` for visual adjustments:

```typescript
// When isGrouped=true:
// - Remove the individual "Pooled Trip" banner (shown in group header)
// - Reduce padding/margins
// - Maintain left border priority styling
```

## Visual Styling

### Pool Group Container

```typescript
cn(
  'rounded-lg border-2 border-dashed border-accent/50',
  'bg-gradient-to-br from-accent/10 to-accent/5',
  'p-2 mb-3'
)
```

### Pool Header

```typescript
cn(
  'flex items-center justify-between',
  'px-2 py-1.5 rounded-md bg-accent/20',
  'text-accent-foreground text-sm font-medium'
)
```

### Grouped Cards

- Reduced vertical spacing: `space-y-1.5` instead of `space-y-3`
- Cards hide individual pool banner
- Maintain drag handles and actions

## Mobile Considerations

- Pool groups maintain structure on mobile
- Collapsible groups for large pools
- Touch-friendly expand/collapse

