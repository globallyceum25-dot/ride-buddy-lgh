

# Kanban-Style Allocations Board

## Overview

Transform the Allocations module into a modern project management interface similar to MeisterTask/ClickUp, featuring drag-and-drop columns for each allocation stage from Dispatch to Complete.

## Current State

- Tab-based interface (Pending, Active, Pools)
- Table layout for each section
- Status updates via dropdown menu actions
- Existing `@dnd-kit/core` and `@dnd-kit/sortable` packages installed
- Allocation statuses: `scheduled` → `dispatched` → `in_progress` → `completed` (and `cancelled`)

## Proposed Kanban Board Design

```text
+------------------------------------------------------------------+
| Allocations Board                                      [Filters] |
+------------------------------------------------------------------+
| [Pending]      | [Dispatched]   | [In Progress]   | [Completed] |
| 6 items        | 3 items        | 2 items         | 8 items     |
+----------------+----------------+-----------------+--------------+
| +------------+ | +------------+ | +-------------+ | +----------+ |
| | REQ-2024   | | | REQ-2019   | | | REQ-2015    | | | REQ-2010 | |
| | John Smith | | | Alice Wong | | | Bob Johnson | | | Jane Doe | |
| | HQ → Site  | | | Lab → HQ   | | | Depot → Lab | | | HQ → Lab | |
| | 9:00 AM    | | | 10:30 AM   | | | 2:00 PM     | | | 8:00 AM  | |
| | [Toyota]   | | | [Honda]    | | | [Ford]      | | | [Toyota] | |
| +------------+ | +------------+ | +-------------+ | +----------+ |
|       ↕        |       ↕        |        ↕        |      ↕       |
+----------------+----------------+-----------------+--------------+
```

## Key Features

### 1. Kanban Columns
- **Pending (Scheduled)**: Newly allocated trips awaiting dispatch
- **Dispatched**: Driver notified, en route to pickup
- **In Progress**: Trip actively underway
- **Completed**: Successfully finished trips

### 2. Drag-and-Drop Status Transitions
- Drag cards between columns to update status
- Visual feedback during drag operations
- Validation for allowed transitions (e.g., can't skip stages)
- Auto-trigger modals for transitions requiring data (e.g., odometer readings)

### 3. Trip Cards
- Compact, scannable design with key information
- Request number, requester name, route summary
- Scheduled time and assigned resources
- Priority indicator and quick action buttons
- Color-coded left border by priority

### 4. Column Headers
- Count badge showing items in each stage
- Column color coding (similar to reference image)
- Collapse/expand option for each column

### 5. Filters & View Options
- Date range filter
- Vehicle/driver filter
- Search by request number
- Toggle between Kanban and Table views

## Implementation Plan

### Phase 1: Create Kanban Board Components

**New Components:**
| Component | Description |
|-----------|-------------|
| `KanbanBoard.tsx` | Main board layout with columns |
| `KanbanColumn.tsx` | Individual column with drop zone |
| `AllocationCard.tsx` | Draggable trip card component |
| `KanbanFilters.tsx` | Filter bar for the board |

### Phase 2: Implement Drag-and-Drop Logic

Using existing `@dnd-kit/core`:
- Multi-column sortable context
- Cross-column dragging support
- Status validation on drop
- Smooth animations and feedback

### Phase 3: Status Transition Handling

- Direct updates for simple transitions (Pending → Dispatched)
- Modal triggers for data-required transitions:
  - Dispatched → In Progress (requires starting odometer)
  - In Progress → Completed (requires ending odometer)

### Phase 4: Update Main Page

- Add view toggle (Kanban/Table/Pools)
- Integrate new components
- Maintain existing table view as option
- Mobile-responsive layout

## Technical Details

### Kanban Column Data Structure

```typescript
interface KanbanColumn {
  id: AllocationStatus;
  title: string;
  color: string;
  items: Allocation[];
  allowedTransitionsFrom: AllocationStatus[];
}

const columns: KanbanColumn[] = [
  {
    id: 'scheduled',
    title: 'Pending',
    color: 'bg-blue-500',
    items: [],
    allowedTransitionsFrom: [],
  },
  {
    id: 'dispatched',
    title: 'Dispatched',
    color: 'bg-amber-500',
    items: [],
    allowedTransitionsFrom: ['scheduled'],
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'bg-purple-500',
    items: [],
    allowedTransitionsFrom: ['dispatched'],
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-green-500',
    items: [],
    allowedTransitionsFrom: ['in_progress'],
  },
];
```

### Drag-and-Drop with @dnd-kit

```typescript
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

// Handle drag end
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over) return;
  
  const activeId = active.id as string;
  const overId = over.id as string;
  const activeColumn = findColumnForItem(activeId);
  const overColumn = findColumn(overId) || findColumnForItem(overId);
  
  if (activeColumn !== overColumn) {
    // Validate transition
    if (!isValidTransition(activeColumn, overColumn)) {
      toast.error('Invalid status transition');
      return;
    }
    
    // Check if transition needs data
    if (requiresData(overColumn)) {
      setTransitionDialog({ allocation, targetStatus: overColumn });
      return;
    }
    
    // Update status
    updateStatus.mutate({ id: activeId, status: overColumn.id });
  }
};
```

### Allocation Card Component

```typescript
interface AllocationCardProps {
  allocation: Allocation;
  onStartTrip: () => void;
  onCompleteTrip: () => void;
  onCancel: () => void;
}

function AllocationCard({ allocation, ...actions }: AllocationCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: allocation.id,
  });
  
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform) }}
      className={cn(
        'bg-card rounded-lg border shadow-sm p-3 cursor-grab',
        isDragging && 'opacity-50 shadow-lg',
        priorityColors[allocation.request?.priority]
      )}
      {...attributes}
      {...listeners}
    >
      {/* Card content */}
    </div>
  );
}
```

### Priority Color Coding

```typescript
const priorityColors = {
  critical: 'border-l-4 border-l-red-500',
  high: 'border-l-4 border-l-orange-500',
  medium: 'border-l-4 border-l-yellow-500',
  low: 'border-l-4 border-l-green-500',
};
```

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/components/allocations/KanbanBoard.tsx` | Create | Main board with DndContext |
| `src/components/allocations/KanbanColumn.tsx` | Create | Droppable column component |
| `src/components/allocations/AllocationCard.tsx` | Create | Draggable card component |
| `src/components/allocations/KanbanFilters.tsx` | Create | Filter controls |
| `src/hooks/useAllocations.ts` | Update | Add bulk status update hook |
| `src/pages/Allocations.tsx` | Update | Integrate Kanban view |

## Mobile Responsiveness

- Horizontal scroll for columns on mobile
- Swipe gestures for column navigation
- Stacked column view option for small screens
- Touch-optimized drag handles

## Transition Validation Rules

| From | To | Requires |
|------|----|----------|
| Scheduled | Dispatched | None |
| Dispatched | In Progress | Starting odometer |
| In Progress | Completed | Ending odometer |
| Any | Cancelled | Confirmation |

## Visual Enhancements

- Gradient column headers matching reference design
- Smooth drag animations with scale effect
- Drop zone highlighting during drag
- Card shadow elevation when dragging
- Status completion indicator animations

