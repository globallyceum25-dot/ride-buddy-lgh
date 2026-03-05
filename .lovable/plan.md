

# Add Cost Tracking for Hailing Service Trips

## Database Changes

**Migration: Add cost tracking columns to `allocations` table**
- `fare_amount` (numeric, nullable) -- the fare/cost amount
- `receipt_reference` (text, nullable) -- booking or receipt reference number

## UI Changes

**AllocationDialog (`src/components/allocations/AllocationDialog.tsx`)**
- When "Hailing Service" mode is selected, add two new fields below the service provider select:
  - **Fare Amount** -- numeric input with currency prefix (e.g. "LKR")
  - **Receipt Reference** -- text input for booking ID / receipt number
- Both fields are optional at creation time (can be filled later)
- Pass these values through to `useCreateAllocation`

**TripTrackingDialog (`src/components/allocations/TripTrackingDialog.tsx`)**
- When completing a hailing service trip, show fare amount and receipt reference fields instead of odometer fields
- Allow updating these values when marking a trip as completed

**Allocations display (`src/pages/Allocations.tsx`, `AllocationCard.tsx`)**
- Show fare amount and receipt reference on allocation cards/rows when present
- Display as "LKR 1,500 • Ref: PK-123456" style badge or text line

## Hook Changes

**`useAllocations.ts`**
- Add `fare_amount` and `receipt_reference` to `Allocation` interface and `AllocationInsert` interface
- Add these fields to `useUpdateAllocationStatus` mutation params so they can be set on trip completion

## Implementation Order
1. Database migration
2. Update hooks/interfaces
3. Update AllocationDialog with cost fields
4. Update TripTrackingDialog for hailing trip completion
5. Update display components

