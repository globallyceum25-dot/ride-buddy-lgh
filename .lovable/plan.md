

# Add Location Names to Dialog Route Displays

## Changes

### 1. `src/components/allocations/CloseRequestDialog.tsx`
- Add `pickup_location_name?: string | null` and `dropoff_location_name?: string | null` to the inline `request` interface (lines 17-24).
- Update line 67 display: `{request?.pickup_location_name || request?.pickup_location} → {request?.dropoff_location_name || request?.dropoff_location}`.

### 2. `src/components/allocations/RescheduleRequestDialog.tsx`
- Already uses `TravelRequest` which has the name fields. Just update line 87 display to use `pickup_location_name || pickup_location` pattern.

### 3. `src/components/allocations/MergeRequestsDialog.tsx`
- Add `pickup_location_name?: string | null` and `dropoff_location_name?: string | null` to the local `Request` interface (lines 37-51).
- Update line 233 display to use the name-first pattern.

### 4. `src/components/allocations/TripTrackingDialog.tsx`
- Update line 173 display to use `allocation.request?.pickup_location_name || allocation.request?.pickup_location` pattern.

### 5. `src/hooks/useAllocations.ts`
- Add `pickup_location_name` and `dropoff_location_name` to the `Allocation.request` sub-interface (lines 38-50).
- Add those fields to the two main `.select()` queries at lines 177 and 262 so the data is actually fetched.

Six files, all small targeted changes.

