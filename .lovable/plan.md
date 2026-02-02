
# Update Dashboard with Real Data and Working Functions

## Overview

The current dashboard displays placeholder/static data with hardcoded "0" values. This plan transforms it into a functional, data-driven dashboard that shows live statistics from the database and provides working navigation and actions.

## Current State Analysis

The dashboard currently shows:
- Static stats array with all "0" values
- Non-functional "New Request" button
- Placeholder alerts that don't reflect actual system state
- Empty "Recent Activity" section
- Empty "Today's Trips" for drivers
- Empty "Pending Approvals" for approvers

## Proposed Changes

### 1. Create Dashboard Stats Hook

Create a new hook `useDashboardStats` that fetches aggregate data:

```text
┌─────────────────────────────────────────────────────────────────────┐
│                       Dashboard Stats Sources                        │
├─────────────────────────────────────────────────────────────────────┤
│  Total Requests     ← travel_requests (count this month)            │
│  Active Vehicles    ← vehicles where is_active=true & available     │
│  Drivers on Duty    ← drivers with status='available' or 'on_trip'  │
│  Today's Trips      ← allocations scheduled for today               │
│  Pending Approvals  ← travel_requests with status='pending_approval'│
│  Recent Activity    ← request_history (last 5 entries)              │
│  Setup Alerts       ← Check if locations/vehicles/drivers exist     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Wire Up Navigation and Dialogs

- "New Request" button → Opens `RequestDialog`
- "New Transport Request" card → Opens `RequestDialog`
- "View My Requests" card → Navigates to `/requests`
- Pending approvals → Navigate to `/approvals`
- Setup alerts → Navigate to respective pages

### 3. Display Real Data in Each Section

**Stats Grid (Admin view):**
- Total Requests: Count of requests this month + % change from last month
- Active Vehicles: Count of available vehicles / total active
- Drivers on Duty: Count of available/on_trip drivers / total on leave
- Today's Trips: Count of today's trips + completed count

**Driver Section:**
- Fetch today's trips assigned to current driver
- Show trip cards with pickup time, route, status

**Approver Section:**
- Fetch pending approvals count
- Show first 3 pending with requester name and purpose

**Recent Activity:**
- Fetch last 5 request_history entries
- Show timestamp, action, and request number

**Alerts Section:**
- Dynamic based on actual data:
  - "No locations configured" if locations count = 0
  - "No vehicles registered" if vehicles count = 0
  - "No driver profiles" if drivers count = 0
  - Expiring documents (insurance, license, registration within 30 days)

## Technical Implementation

### Phase 1: Create Dashboard Hook

File: `src/hooks/useDashboardData.ts`

```typescript
interface DashboardStats {
  totalRequests: number;
  requestsChange: number; // % change from last month
  activeVehicles: number;
  availableVehicles: number;
  driversOnDuty: number;
  driversOnLeave: number;
  todaysTrips: number;
  completedToday: number;
}

interface SetupAlert {
  type: 'setup' | 'warning' | 'urgent';
  message: string;
  link: string;
}

interface RecentActivityItem {
  id: string;
  action: string;
  requestNumber: string;
  timestamp: string;
}

interface PendingApprovalItem {
  id: string;
  requestNumber: string;
  requesterName: string;
  purpose: string;
  createdAt: string;
}

interface DriverTripItem {
  id: string;
  scheduledTime: string;
  pickup: string;
  dropoff: string;
  status: string;
  passengerCount: number;
}

export function useDashboardStats()
export function useSetupAlerts()
export function useRecentActivity(limit: number)
export function usePendingApprovalsPreview(limit: number)
export function useDriverTodayTrips()
```

### Phase 2: Update Dashboard Component

Modify `src/pages/Dashboard.tsx`:

1. Import new hooks and RequestDialog component
2. Replace static `stats` array with data from `useDashboardStats()`
3. Add `useState` for dialog open state
4. Wire up button click handlers
5. Replace placeholder content with real data rendering
6. Add loading skeletons for async data

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/hooks/useDashboardData.ts` | Create | New hook for dashboard-specific queries |
| `src/pages/Dashboard.tsx` | Update | Wire up real data and interactions |

## Detailed Component Updates

### Stats Grid with Real Data

```typescript
// Replace static stats with dynamic data
const { data: stats, isLoading: statsLoading } = useDashboardStats();

const statsDisplay = [
  {
    label: 'Total Requests',
    value: stats?.totalRequests || 0,
    change: stats?.requestsChange 
      ? `${stats.requestsChange > 0 ? '+' : ''}${stats.requestsChange}% from last month`
      : 'This month',
    icon: <FileText />,
    color: 'text-primary',
  },
  // ... similar for other stats
];
```

### New Request Button Integration

```typescript
const [requestDialogOpen, setRequestDialogOpen] = useState(false);

// In render
<Button onClick={() => setRequestDialogOpen(true)}>
  <Plus className="mr-2 h-4 w-4" />
  New Request
</Button>

<RequestDialog 
  open={requestDialogOpen} 
  onOpenChange={setRequestDialogOpen} 
/>
```

### Quick Actions with Navigation

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// New Transport Request card
<Button 
  variant="outline" 
  onClick={() => setRequestDialogOpen(true)}
>
  <FileText className="mr-3 h-5 w-5 text-primary" />
  <div className="text-left">
    <div className="font-medium">New Transport Request</div>
    <div className="text-xs text-muted-foreground">
      Book a ride for yourself or team
    </div>
  </div>
</Button>

// View My Requests card
<Button 
  variant="outline" 
  onClick={() => navigate('/requests')}
>
  ...
</Button>
```

### Driver's Today Trips

```typescript
const { data: driverTrips, isLoading: tripsLoading } = useDriverTodayTrips();

// Replace empty state with actual trips
{tripsLoading ? (
  <div className="space-y-2">
    {[1, 2].map(i => <Skeleton key={i} className="h-16" />)}
  </div>
) : !driverTrips?.length ? (
  <EmptyState />
) : (
  <div className="space-y-3">
    {driverTrips.map(trip => (
      <div key={trip.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Badge variant={trip.status === 'dispatched' ? 'default' : 'secondary'}>
          {format(new Date(trip.scheduledTime), 'HH:mm')}
        </Badge>
        <div className="flex-1">
          <p className="text-sm font-medium">{trip.pickup} → {trip.dropoff}</p>
          <p className="text-xs text-muted-foreground">
            {trip.passengerCount} passenger(s)
          </p>
        </div>
        <Badge variant="outline">{trip.status}</Badge>
      </div>
    ))}
  </div>
)}
```

### Pending Approvals Preview

```typescript
const { data: pendingApprovals } = usePendingApprovalsPreview(3);

{pendingApprovals?.length ? (
  <div className="space-y-3">
    {pendingApprovals.map(approval => (
      <div key={approval.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
        <div>
          <p className="text-sm font-medium">{approval.requestNumber}</p>
          <p className="text-xs text-muted-foreground">
            {approval.requesterName} • {approval.purpose}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/approvals')}>
          Review
        </Button>
      </div>
    ))}
    <Button variant="link" onClick={() => navigate('/approvals')}>
      View all pending approvals →
    </Button>
  </div>
) : (
  <EmptyState message="No pending approvals" />
)}
```

### Dynamic Setup Alerts

```typescript
const { data: alerts } = useSetupAlerts();

{alerts?.length > 0 && (
  <div className="space-y-3">
    {alerts.map((alert, idx) => (
      <div 
        key={idx} 
        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted"
        onClick={() => navigate(alert.link)}
      >
        <Badge variant="outline" className={cn(
          alert.type === 'setup' && 'bg-warning/10 text-warning border-warning/20',
          alert.type === 'warning' && 'bg-orange-100 text-orange-700',
          alert.type === 'urgent' && 'bg-destructive/10 text-destructive'
        )}>
          {alert.type === 'setup' ? 'Setup' : alert.type === 'warning' ? 'Warning' : 'Urgent'}
        </Badge>
        <span className="text-sm">{alert.message}</span>
      </div>
    ))}
  </div>
)}
```

### Recent Activity

```typescript
const { data: recentActivity } = useRecentActivity(5);

{recentActivity?.length ? (
  <div className="space-y-3">
    {recentActivity.map(activity => (
      <div key={activity.id} className="flex items-start gap-3">
        <div className="w-2 h-2 mt-2 rounded-full bg-primary" />
        <div className="flex-1">
          <p className="text-sm">{activity.action}</p>
          <p className="text-xs text-muted-foreground">
            {activity.requestNumber} • {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </p>
        </div>
      </div>
    ))}
  </div>
) : (
  <EmptyState />
)}
```

## Database Queries Summary

### Dashboard Stats Query
```sql
-- Total requests this month
SELECT COUNT(*) FROM travel_requests 
WHERE created_at >= date_trunc('month', now());

-- Last month for comparison
SELECT COUNT(*) FROM travel_requests 
WHERE created_at >= date_trunc('month', now() - interval '1 month')
AND created_at < date_trunc('month', now());

-- Vehicles
SELECT status, COUNT(*) FROM vehicles 
WHERE is_active = true GROUP BY status;

-- Drivers
SELECT status, COUNT(*) FROM drivers 
WHERE is_active = true GROUP BY status;

-- Today's allocations
SELECT status, COUNT(*) FROM allocations 
WHERE scheduled_pickup::date = CURRENT_DATE 
AND status != 'cancelled' GROUP BY status;
```

### Setup Alerts Query
```sql
-- Check for missing resources
SELECT 
  (SELECT COUNT(*) FROM locations WHERE is_active = true) as locations_count,
  (SELECT COUNT(*) FROM vehicles WHERE is_active = true) as vehicles_count,
  (SELECT COUNT(*) FROM drivers WHERE is_active = true) as drivers_count;

-- Expiring documents (within 30 days)
SELECT * FROM vehicles 
WHERE is_active = true 
AND (insurance_expiry < now() + interval '30 days' 
  OR registration_expiry < now() + interval '30 days');

SELECT d.*, p.full_name FROM drivers d
JOIN profiles p ON d.user_id = p.user_id
WHERE d.is_active = true 
AND d.license_expiry < now() + interval '30 days';
```

## User Experience Improvements

1. **Loading States**: Skeleton loaders while data fetches
2. **Error Handling**: Toast notifications for failed queries
3. **Empty States**: Helpful messages when no data exists
4. **Click-through**: All cards/alerts navigate to relevant pages
5. **Real-time Feel**: Use React Query's staleTime for fresh data

## Edge Cases Handled

- New users with no data: Show setup wizard prompts
- Role-based visibility: Sections only show for appropriate roles
- Zero counts: Display "0" gracefully with context
- Error states: Fallback to empty state with retry option
