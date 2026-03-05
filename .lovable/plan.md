

# Add Fleet vs Hailing Service Filter and Cost Summary to Reports

## Overview
Add a "Trip Type" filter to the Reports page to distinguish fleet vehicle trips from hailing service trips, and introduce a new **Hailing Costs** summary section showing total spend by service provider.

## Changes

### 1. ReportFilters component (`src/components/reports/ReportFilters.tsx`)
- Add a new `Select` dropdown: **Trip Type** with options: "All Trips", "Fleet Only", "Hailing Only"
- Add new props: `tripType` and `onTripTypeChange`

### 2. ReportFilters type (`src/hooks/useReportData.ts`)
- Add `tripType?: 'all' | 'fleet' | 'hailing'` to `ReportFilters` interface
- Update all four report hooks to filter allocations based on `tripType`:
  - `fleet`: only where `hailing_service IS NULL`
  - `hailing`: only where `hailing_service IS NOT NULL`
  - `all`: no filter (default)
- Add a new hook `useHailingCostReport(filters)` that queries allocations where `hailing_service IS NOT NULL`, aggregates by service provider, and returns:
  - Per-provider: trip count, total fare, average fare
  - Totals: total hailing trips, total cost, total with receipts

### 3. New HailingCostReport component (`src/components/reports/HailingCostReport.tsx`)
- Summary stat cards: Total Hailing Trips, Total Cost (LKR), Avg Cost per Trip
- Bar chart: cost breakdown by provider (PickMe / Uber / Personal)
- Table: provider name, trip count, total fare, average fare, receipts count

### 4. Reports page (`src/pages/Reports.tsx`)
- Add `tripType` to filters state (default: `'all'`)
- Pass `tripType`/`onTripTypeChange` to `ReportFilters`
- Add a 5th tab: **Hailing Costs** using the new component
- Update CSV export to handle the new tab
- Update `TabsList` grid to `sm:grid-cols-5`

### 5. Filter behavior
- The trip type filter applies to Vehicle, Driver, Location, and Department tabs (filters the underlying allocation/request data)
- The Hailing Costs tab always shows only hailing data regardless of the trip type filter

## Implementation Order
1. Update `ReportFilters` interface and filter component
2. Update existing report hooks with trip type filtering
3. Create `useHailingCostReport` hook
4. Create `HailingCostReport` component
5. Wire everything in `Reports.tsx`

