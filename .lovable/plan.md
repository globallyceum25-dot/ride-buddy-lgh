

# Add Hailing Service Option for Allocations

## Overview
When no fleet vehicles are available, coordinators need to assign a ride-hailing service (PickMe, Uber, or Personal vehicle) to a travel request instead of a fleet vehicle+driver combo.

## Database Changes

**Migration: Add `hailing_service` column to `allocations` table**
- Add a new enum type `hailing_service_type` with values: `pickme`, `uber`, `personal`
- Add nullable column `hailing_service` of this enum type to the `allocations` table
- When `hailing_service` is set, `vehicle_id` and `driver_id` remain null (no fleet resources used)

## UI Changes

**AllocationDialog (`src/components/allocations/AllocationDialog.tsx`)**
- Add a toggle at the top: **"Fleet Vehicle"** vs **"Hailing Service"** (using a `ToggleGroup` or radio buttons)
- When **Fleet Vehicle** is selected: show the existing vehicle + driver selects (current behavior)
- When **Hailing Service** is selected: hide vehicle/driver selects, show a `Select` with PickMe / Uber / Personal options
- Submit button enabled when either (vehicle+driver) or (hailing service) is chosen
- Notes field remains visible in both modes so coordinator can add booking reference, cost, etc.

**Allocation display updates**
- `KanbanBoard.tsx` / allocation cards: show a badge like "🚕 PickMe" or "🚗 Personal" instead of the vehicle registration when `hailing_service` is set
- `Allocations.tsx` table/card views: display hailing service info in place of vehicle/driver columns
- `TripTrackingDialog.tsx`: skip odometer fields when hailing service is used (no fleet vehicle to track)

## Hook Changes

**`useAllocations.ts`**
- `AllocationInsert` interface: add optional `hailing_service` field
- `useCreateAllocation`: pass `hailing_service` through; set `vehicle_id`/`driver_id` to null when hailing
- Notification: show "PickMe / Uber / Personal" instead of vehicle info when hailing service is used
- `Allocation` interface: add `hailing_service` field

## Implementation Order
1. Database migration (add enum + column)
2. Update hooks and interfaces
3. Update AllocationDialog with the mode toggle
4. Update display components (Kanban cards, table rows, trip tracking)

