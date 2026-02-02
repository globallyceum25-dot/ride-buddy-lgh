

# Allocations Module Implementation Plan

## Overview
Build a complete allocations module that allows location coordinators and admins to assign vehicles and drivers to approved travel requests. The module includes a request pooling/merging feature to combine compatible trips.

---

## Database Schema

### New Tables

#### 1. `allocations` - Links requests to vehicles and drivers
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | Primary key |
| request_id | uuid | FK to travel_requests, NOT NULL |
| vehicle_id | uuid | FK to vehicles |
| driver_id | uuid | FK to drivers |
| pool_id | uuid | FK to trip_pools (nullable) |
| allocated_by | uuid | FK to auth.users |
| allocated_at | timestamptz | Default now() |
| scheduled_pickup | timestamptz | NOT NULL |
| scheduled_dropoff | timestamptz | |
| actual_pickup | timestamptz | |
| actual_dropoff | timestamptz | |
| odometer_start | integer | |
| odometer_end | integer | |
| notes | text | |
| status | allocation_status | Default 'scheduled' |
| created_at | timestamptz | |
| updated_at | timestamptz | |

#### 2. `trip_pools` - Groups merged/pooled trips
| Column | Type | Constraints |
|--------|------|-------------|
| id | uuid | Primary key |
| pool_number | text | Generated (POOL-YYYY-XXXX) |
| vehicle_id | uuid | FK to vehicles |
| driver_id | uuid | FK to drivers |
| scheduled_date | date | NOT NULL |
| scheduled_time | time | NOT NULL |
| total_passengers | integer | |
| route_summary | text | |
| status | pool_status | Default 'pending' |
| created_by | uuid | FK to auth.users |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### New Enums
```sql
CREATE TYPE allocation_status AS ENUM (
  'scheduled',
  'dispatched', 
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE pool_status AS ENUM (
  'pending',
  'confirmed',
  'dispatched',
  'completed',
  'cancelled'
);
```

---

## RLS Policies

### allocations table
- Admins (group_admin, location_coordinator) can manage all allocations
- Drivers can view their assigned allocations
- Requesters can view allocations for their requests

### trip_pools table
- Admins can manage all pools
- Drivers can view pools they're assigned to

---

## Frontend Components

### New Files

| File | Purpose |
|------|---------|
| `src/pages/Allocations.tsx` | Main allocations page with tabs |
| `src/hooks/useAllocations.ts` | Data hooks for allocations |
| `src/components/allocations/AllocationDialog.tsx` | Create/edit allocation |
| `src/components/allocations/MergeRequestsDialog.tsx` | Pool multiple requests |
| `src/components/allocations/AllocationStatusBadge.tsx` | Status display |

### Page Features

1. **Pending Allocation Tab**
   - List of approved requests awaiting allocation
   - Filter by date, location, priority
   - Quick assign vehicle/driver
   - Select multiple for merging

2. **Active Allocations Tab**
   - Today's scheduled trips
   - Status tracking (scheduled → dispatched → in_progress → completed)

3. **Pooled Trips Tab**
   - View merged request groups
   - Manage pool assignments

---

## Request Merging Logic

### Compatibility Criteria
Requests can be pooled if they have:
- Same pickup date
- Overlapping time windows (within 30 min tolerance)
- Similar route (same or nearby pickup/dropoff locations)
- Combined passengers fit in a single vehicle

### Merge Flow
1. Select 2+ compatible requests from pending list
2. System validates compatibility
3. Creates trip_pool record
4. Links selected allocations to the pool
5. Assigns single vehicle/driver to entire pool

---

## Implementation Order

### Phase 1: Database Setup
1. Create new enums (allocation_status, pool_status)
2. Create trip_pools table with RLS
3. Create allocations table with RLS
4. Add foreign key constraints
5. Create trigger for pool_number generation

### Phase 2: Basic Allocations
1. Create `useAllocations.ts` hook
2. Create `Allocations.tsx` page with pending requests list
3. Create `AllocationDialog.tsx` for assigning vehicle/driver
4. Add route to App.tsx
5. Update request status to 'allocated' on assignment

### Phase 3: Pooling Feature
1. Create `MergeRequestsDialog.tsx` component
2. Add pool creation logic
3. Add pool management UI
4. Implement compatibility checking function

### Phase 4: Status Tracking
1. Add dispatch functionality
2. Add trip start/end tracking
3. Odometer recording
4. Status history

---

## Technical Details

### useAllocations.ts Hook Structure
```typescript
// Fetch approved requests pending allocation
export function usePendingAllocation()

// Fetch all allocations with filters  
export function useAllocations(filters)

// Fetch single allocation detail
export function useAllocation(id)

// Create allocation (assign vehicle/driver)
export function useCreateAllocation()

// Update allocation
export function useUpdateAllocation()

// Cancel allocation
export function useCancelAllocation()

// Create trip pool (merge requests)
export function useCreatePool()

// Fetch trip pools
export function useTripPools()
```

### Status Transitions
```
Travel Request: approved → allocated (when allocation created)
Allocation: scheduled → dispatched → in_progress → completed
Trip Pool: pending → confirmed → dispatched → completed
```

---

## UI Layout

### Allocations Page Structure
```
+------------------------------------------+
| Allocations                    [Filters] |
+------------------------------------------+
| [Pending] [Active] [Pooled Trips]        |
+------------------------------------------+
| □ TR-2026-0001 | John Doe | Feb 3, 9AM   |
|   HQ → Airport | 2 pax | Urgent          |
|                           [Assign] [Pool]|
+------------------------------------------+
| □ TR-2026-0002 | Jane Smith | Feb 3, 9AM |
|   HQ → Downtown | 1 pax | Normal         |
|                           [Assign] [Pool]|
+------------------------------------------+
|        [Merge Selected (2)]              |
+------------------------------------------+
```

---

## Security Considerations

- Only location_coordinator and group_admin can access allocations
- RLS ensures drivers only see their assignments
- Audit logging for allocation changes
- Vehicle/driver availability validation before assignment

