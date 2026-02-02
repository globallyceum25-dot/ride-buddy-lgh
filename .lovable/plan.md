
# Reporting Module Implementation

## Overview
A comprehensive analytics module to analyze fleet data across four dimensions: Vehicles, Drivers (Person-wise), Locations, and Departments. The module will provide both summary statistics and detailed breakdowns with visualizations.

---

## Architecture

### New Files to Create

| File | Purpose |
|------|---------|
| `src/pages/Reports.tsx` | Main reports page with tabbed interface |
| `src/hooks/useReportData.ts` | Hook to fetch and aggregate report data |
| `src/components/reports/VehicleReport.tsx` | Vehicle utilization analytics |
| `src/components/reports/DriverReport.tsx` | Driver performance analytics |
| `src/components/reports/LocationReport.tsx` | Location-based trip analytics |
| `src/components/reports/DepartmentReport.tsx` | Department-wise cost/trip analysis |
| `src/components/reports/ReportFilters.tsx` | Date range and filter controls |
| `src/components/reports/StatCard.tsx` | Reusable summary stat card |

### Files to Modify

| File | Changes |
|------|---------|
| `src/App.tsx` | Add `/reports` route |

---

## Data Analysis Capabilities

### 1. Vehicle-wise Report
- **Total trips** per vehicle
- **Distance covered** (odometer_end - odometer_start)
- **Utilization rate** (trips vs available days)
- **Average passengers** per trip
- **Status breakdown** (completed, cancelled, etc.)

**Metrics displayed:**
- Bar chart: Trips by vehicle
- Line chart: Mileage trend over time
- Table: Detailed vehicle statistics

### 2. Driver-wise Report (Person-wise)
- **Total trips** assigned
- **Completed trips** vs cancelled
- **Total hours** on duty (actual_pickup to actual_dropoff)
- **Average trip duration**
- **Performance score** (on-time pickups)

**Metrics displayed:**
- Bar chart: Trips by driver
- Pie chart: Trip status distribution
- Table: Driver performance ranking

### 3. Location-wise Report
- **Trips originating** from each location
- **Trips terminating** at each location
- **Busiest routes** (pickup → dropoff pairs)
- **Peak hours** by location

**Metrics displayed:**
- Bar chart: Trips by location (origin/destination)
- Heat map style table: Route frequency
- Time-based chart: Peak demand hours

### 4. Department-wise Report
- **Total requests** by department
- **Approved vs rejected** rate
- **Average passengers** per department
- **Cost center** analysis
- **Trip types** breakdown (one-way, round-trip)

**Metrics displayed:**
- Pie chart: Request distribution by department
- Bar chart: Request status by department
- Table: Detailed department breakdown

---

## UI Design

### Main Reports Page Layout

```text
+--------------------------------------------------+
|  Reports                    [Date Range Picker]  |
|  Analyze fleet performance                       |
+--------------------------------------------------+
|                                                  |
|  [Vehicle] [Driver] [Location] [Department]      |
|  ─────────────────────────────────────────────── |
|                                                  |
|  +------------+ +------------+ +------------+    |
|  | Total Trips| | Distance   | | Utilization|    |
|  |    156     | |  12,450 km | |    78%     |    |
|  +------------+ +------------+ +------------+    |
|                                                  |
|  +------------------------------------------+   |
|  |           [Chart Visualization]          |   |
|  +------------------------------------------+   |
|                                                  |
|  +------------------------------------------+   |
|  |           [Data Table]                    |   |
|  +------------------------------------------+   |
|                                                  |
+--------------------------------------------------+
```

### Filter Controls
- **Date range picker**: Start and end date
- **Quick presets**: Today, This Week, This Month, Last 30 Days, This Year
- **Export button**: CSV download option

---

## Technical Implementation

### Report Data Hook

```typescript
// src/hooks/useReportData.ts
interface ReportFilters {
  startDate: string;
  endDate: string;
}

export function useVehicleReport(filters: ReportFilters) {
  return useQuery({
    queryKey: ['vehicle-report', filters],
    queryFn: async () => {
      const { data: allocations } = await supabase
        .from('allocations')
        .select(`
          vehicle_id,
          status,
          odometer_start,
          odometer_end,
          scheduled_pickup,
          actual_pickup,
          actual_dropoff,
          vehicle:vehicles(id, registration_number, make, model),
          request:travel_requests(passenger_count)
        `)
        .gte('scheduled_pickup', filters.startDate)
        .lte('scheduled_pickup', filters.endDate);
      
      // Aggregate by vehicle
      return aggregateVehicleData(allocations);
    }
  });
}

export function useDriverReport(filters: ReportFilters) { /* similar */ }
export function useLocationReport(filters: ReportFilters) { /* similar */ }
export function useDepartmentReport(filters: ReportFilters) { /* similar */ }
```

### Chart Components (using recharts)

The project already has `recharts` installed, so charts will use:
- `BarChart` for comparison metrics
- `PieChart` for distribution breakdowns
- `LineChart` for trends over time
- `ResponsiveContainer` for responsive sizing

### Summary Statistics

Each report tab will show 3-4 key metrics at the top:
- Large number display
- Comparison to previous period (optional)
- Trend indicator

---

## Sample Queries

### Vehicle Report Query
```sql
SELECT 
  v.registration_number,
  v.make,
  v.model,
  COUNT(a.id) as total_trips,
  SUM(COALESCE(a.odometer_end, 0) - COALESCE(a.odometer_start, 0)) as total_distance,
  AVG(tr.passenger_count) as avg_passengers,
  COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_trips
FROM vehicles v
LEFT JOIN allocations a ON a.vehicle_id = v.id
LEFT JOIN travel_requests tr ON a.request_id = tr.id
WHERE a.scheduled_pickup BETWEEN :start AND :end
GROUP BY v.id
```

### Department Report Query
```sql
SELECT 
  p.department,
  COUNT(tr.id) as total_requests,
  COUNT(CASE WHEN tr.status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN tr.status = 'rejected' THEN 1 END) as rejected,
  SUM(tr.passenger_count) as total_passengers
FROM travel_requests tr
JOIN profiles p ON tr.requester_id = p.user_id
WHERE tr.created_at BETWEEN :start AND :end
GROUP BY p.department
```

---

## Component Structure

```text
Reports.tsx
├── ReportFilters (date range, export)
├── Tabs
│   ├── VehicleReport
│   │   ├── StatCard x 3
│   │   ├── BarChart (trips by vehicle)
│   │   └── DataTable
│   ├── DriverReport
│   │   ├── StatCard x 3
│   │   ├── BarChart (trips by driver)
│   │   └── DataTable
│   ├── LocationReport
│   │   ├── StatCard x 3
│   │   ├── BarChart (by location)
│   │   └── RouteTable
│   └── DepartmentReport
│       ├── StatCard x 3
│       ├── PieChart (distribution)
│       └── DataTable
```

---

## Access Control

The Reports page will be accessible to:
- `location_coordinator` - Can view reports for their location
- `group_admin` - Can view all reports across locations

This follows the existing nav item configuration in `DashboardLayout.tsx` (line 97-102).

---

## Implementation Phases

### Phase 1: Foundation
1. Create `Reports.tsx` page with tab structure
2. Create `useReportData.ts` hook with basic queries
3. Create `ReportFilters.tsx` with date range picker
4. Add route to `App.tsx`

### Phase 2: Vehicle and Driver Reports
1. Implement `VehicleReport.tsx` with charts and table
2. Implement `DriverReport.tsx` with performance metrics
3. Create reusable `StatCard.tsx` component

### Phase 3: Location and Department Reports
1. Implement `LocationReport.tsx` with route analysis
2. Implement `DepartmentReport.tsx` with cost breakdown

### Phase 4: Polish
1. Add CSV export functionality
2. Add loading states and empty states
3. Responsive design adjustments

---

## Testing Checklist
1. Verify date range filters work correctly
2. Test with no data (empty state)
3. Test with various date ranges
4. Verify charts render properly
5. Test access control (coordinator vs admin views)
6. Test CSV export functionality
