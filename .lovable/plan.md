

# Edit Fare Amount and Receipt Reference After Allocation

## Overview
Add the ability to edit fare amount and receipt reference on existing hailing service allocations via a small dialog accessible from the allocation card's dropdown menu.

## Changes

### 1. New mutation hook in `useAllocations.ts`
- Add `useUpdateHailingCost()` mutation that updates only `fare_amount` and `receipt_reference` on an allocation by ID
- Invalidates `allocations` query on success

### 2. New `EditHailingCostDialog` component (`src/components/allocations/EditHailingCostDialog.tsx`)
- Small dialog with two fields: Fare Amount (numeric input with LKR prefix) and Receipt Reference (text input)
- Pre-populated with current values from the allocation
- Save button calls `useUpdateHailingCost`

### 3. Update `AllocationCard.tsx`
- Add an "Edit Cost" menu item in the dropdown menu, visible only when `hailing_service` is set
- Opens the `EditHailingCostDialog`

### 4. Update `Allocations.tsx` (table view)
- Add an "Edit Cost" action for hailing allocations in the table/card view if applicable

## Implementation Order
1. Add mutation hook
2. Create dialog component
3. Wire into AllocationCard dropdown
4. Wire into Allocations page table view

