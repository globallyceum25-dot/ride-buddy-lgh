

# Show Estimated Distance in Request Detail Dialog and Reports

## Changes

### 1. Add `estimated_distance_km` to `TravelRequest` interface
- Add `estimated_distance_km: number | null` to the interface in `useRequests.ts` (line ~38, before `requester?`)

### 2. Show distance in `RequestDetailDialog.tsx`
- After the destination row (line ~153), add a conditional row showing estimated distance when `estimated_distance_km` is not null
- Uses `Route` icon from lucide-react, displays value as "X km"

### 3. Add distance column to the Requests table in `Requests.tsx`
- Add an "Est. Distance" column to the table showing `estimated_distance_km` with "km" suffix, or "—" if null

### 4. Add distance data to Location Report
- Update `useLocationReport` in `useReportData.ts` to also fetch `estimated_distance_km` from `travel_requests` and include total/average distance in `LocationReportItem` and route items
- Update `LocationReport.tsx` to show distance column in the routes table
- Update location CSV export to include distance

### 5. Add distance to Vehicle Report
- Update `useVehicleReport` to also join `travel_requests.estimated_distance_km` and sum estimated distances alongside odometer-based distances
- Show "Est. Distance" as an additional column or use it as fallback when odometer data is missing

