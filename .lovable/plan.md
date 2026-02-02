
# Phase 2: Master Data Management - Implementation Plan

## Overview
Build three management screens (Locations, Vehicles, Drivers) with full CRUD operations, data tables, and proper role-based access control.

---

## Database Schema Changes

### 1. Create Enums for Vehicles and Drivers

```sql
-- Vehicle status enum
CREATE TYPE vehicle_status AS ENUM ('available', 'in_trip', 'maintenance', 'breakdown', 'retired');

-- Vehicle type enum  
CREATE TYPE vehicle_type AS ENUM ('sedan', 'suv', 'van', 'minibus', 'bus', 'other');

-- Fuel type enum
CREATE TYPE fuel_type AS ENUM ('petrol', 'diesel', 'electric', 'hybrid', 'cng');

-- Ownership type enum
CREATE TYPE ownership_type AS ENUM ('owned', 'leased', 'rented');

-- Driver status enum
CREATE TYPE driver_status AS ENUM ('available', 'on_trip', 'on_leave', 'inactive');

-- License type enum
CREATE TYPE license_type AS ENUM ('light', 'heavy', 'commercial');
```

### 2. Vehicles Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| registration_number | text | Unique, required |
| make | text | e.g., Toyota |
| model | text | e.g., Hiace |
| year | integer | Manufacturing year |
| vehicle_type | vehicle_type | Enum |
| capacity | integer | Passenger seats |
| fuel_type | fuel_type | Enum |
| ownership | ownership_type | Owned/Leased/Rented |
| status | vehicle_status | Default: available |
| location_id | uuid | FK to locations (home base) |
| insurance_expiry | date | For alerts |
| registration_expiry | date | For alerts |
| last_service_date | date | Maintenance tracking |
| next_service_due | date | Maintenance alerts |
| odometer | integer | Current reading |
| notes | text | Optional |
| is_active | boolean | Soft delete |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto-updated |

### 3. Drivers Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| user_id | uuid | FK to profiles (links to user account) |
| employee_id | text | Company ID |
| license_number | text | Required |
| license_type | license_type | Light/Heavy/Commercial |
| license_expiry | date | For alerts |
| status | driver_status | Default: available |
| location_id | uuid | FK to locations (assigned base) |
| is_floating | boolean | Can work any location |
| emergency_contact | text | Phone number |
| blood_group | text | Optional |
| date_joined | date | Employment start |
| notes | text | Optional |
| is_active | boolean | Soft delete |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto-updated |

### 4. RLS Policies

**Vehicles:**
- Admins (`group_admin`, `location_coordinator`) can manage vehicles
- All authenticated users can view active vehicles

**Drivers:**
- Admins can manage driver records
- Drivers can view their own record
- All authenticated users can view active drivers

---

## Frontend Implementation

### Shared Components

**`src/components/shared/DataTable.tsx`**
- Reusable table component with sorting, filtering, pagination
- Search functionality
- Row actions (Edit, Delete, View)
- Status badges
- Used across all three management pages

**`src/components/shared/StatusBadge.tsx`**
- Color-coded status indicators
- Consistent styling across the app

### Locations Page (`/locations`)

**Components:**
- `src/pages/Locations.tsx` - Main page
- `src/components/locations/LocationTable.tsx` - Data table
- `src/components/locations/LocationDialog.tsx` - Create/Edit form

**Features:**
- View all locations in a sortable table
- Add new location with form validation
- Edit existing locations
- Toggle active/inactive status
- Display assigned coordinators count
- Show operating hours

**Form Fields:**
- Name (required)
- Code (required, unique)
- Address
- City
- GPS Coordinates (lat/lng)
- Operating Hours (start/end time)

### Vehicles Page (`/vehicles`)

**Components:**
- `src/pages/Vehicles.tsx` - Main page
- `src/components/vehicles/VehicleTable.tsx` - Data table
- `src/components/vehicles/VehicleDialog.tsx` - Create/Edit form

**Features:**
- View all vehicles with status indicators
- Filter by status, type, location
- Add/Edit vehicle details
- Track maintenance schedules
- Alert badges for expiring documents
- Odometer tracking

**Form Fields:**
- Registration Number (required, unique)
- Make & Model
- Year
- Vehicle Type (dropdown)
- Capacity (number)
- Fuel Type (dropdown)
- Ownership Type (dropdown)
- Home Location (dropdown)
- Insurance Expiry Date
- Registration Expiry Date
- Last Service / Next Service Due
- Current Odometer

### Drivers Page (`/drivers`)

**Components:**
- `src/pages/Drivers.tsx` - Main page
- `src/components/drivers/DriverTable.tsx` - Data table
- `src/components/drivers/DriverDialog.tsx` - Create/Edit form

**Features:**
- View all drivers with status
- Filter by status, location
- Link driver to existing user account
- Track license expiry
- Show availability status
- Mark as floating driver

**Form Fields:**
- Link to User Account (dropdown from profiles with driver role)
- License Number (required)
- License Type (dropdown)
- License Expiry Date
- Assigned Location (dropdown)
- Is Floating (checkbox)
- Emergency Contact
- Blood Group
- Date Joined

---

## Data Hooks (React Query)

**`src/hooks/useLocations.ts`**
- `useLocations()` - Fetch all locations
- `useCreateLocation()` - Create mutation
- `useUpdateLocation()` - Update mutation
- `useDeleteLocation()` - Delete mutation

**`src/hooks/useVehicles.ts`**
- `useVehicles()` - Fetch all vehicles with location join
- `useCreateVehicle()` - Create mutation
- `useUpdateVehicle()` - Update mutation

**`src/hooks/useDrivers.ts`**
- `useDrivers()` - Fetch all drivers with profile/location join
- `useCreateDriver()` - Create mutation
- `useUpdateDriver()` - Update mutation

---

## Route Updates

Add to `src/App.tsx`:
- `/locations` - Group Admin only
- `/vehicles` - Location Coordinator & Group Admin
- `/drivers` - Location Coordinator & Group Admin

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Locations.tsx` | Location management page |
| `src/pages/Vehicles.tsx` | Vehicle management page |
| `src/pages/Drivers.tsx` | Driver management page |
| `src/components/locations/LocationTable.tsx` | Location data table |
| `src/components/locations/LocationDialog.tsx` | Location form dialog |
| `src/components/vehicles/VehicleTable.tsx` | Vehicle data table |
| `src/components/vehicles/VehicleDialog.tsx` | Vehicle form dialog |
| `src/components/drivers/DriverTable.tsx` | Driver data table |
| `src/components/drivers/DriverDialog.tsx` | Driver form dialog |
| `src/hooks/useLocations.ts` | Location data hooks |
| `src/hooks/useVehicles.ts` | Vehicle data hooks |
| `src/hooks/useDrivers.ts` | Driver data hooks |

## Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add 3 new protected routes |

---

## Implementation Order

1. **Database Migration** - Create vehicles and drivers tables with enums and RLS
2. **Locations Page** - Build first (table exists, simpler implementation)
3. **Vehicles Page** - Build with all tracking features
4. **Drivers Page** - Build with user account linking
5. **Route Registration** - Add all routes to App.tsx

---

## UI Design Notes

- Clean data tables with hover states
- Status badges with distinct colors:
  - Available: Green
  - In Trip/On Trip: Blue
  - Maintenance/On Leave: Yellow
  - Breakdown/Inactive: Red
- Alert badges for expiring documents (within 30 days)
- Responsive design for tablet/mobile
- Empty states with clear CTAs
- Toast notifications for all actions
