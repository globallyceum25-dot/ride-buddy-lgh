import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  Truck,
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Plus,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { RequestDialog } from '@/components/requests/RequestDialog';
import {
  useDashboardStats,
  useSetupAlerts,
  useRecentActivity,
  usePendingApprovalsPreview,
  usePendingApprovalsCount,
  useDriverTodayTrips,
  useHailingSpendStats,
} from '@/hooks/useDashboardData';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { profile, roles } = useAuth();
  const navigate = useNavigate();
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  
  const isStaff = roles.includes('staff');
  const isDriver = roles.includes('driver');
  const isApprover = roles.includes('approver');
  const isAdmin = roles.includes('group_admin') || roles.includes('location_coordinator');

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: alerts = [], isLoading: alertsLoading } = useSetupAlerts();
  const { data: recentActivity = [], isLoading: activityLoading } = useRecentActivity(5);
  const { data: pendingApprovals = [], isLoading: approvalsLoading } = usePendingApprovalsPreview(3);
  const { data: pendingCount = 0 } = usePendingApprovalsCount();
  const { data: driverTrips = [], isLoading: tripsLoading } = useDriverTodayTrips();
  const { data: hailingSpend, isLoading: hailingLoading } = useHailingSpendStats();
  const statsDisplay = [
    {
      label: 'Total Requests',
      value: stats?.totalRequests ?? 0,
      change: stats?.requestsChange 
        ? `${stats.requestsChange > 0 ? '+' : ''}${stats.requestsChange}% from last month`
        : 'This month',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-primary',
    },
    {
      label: 'Active Vehicles',
      value: stats?.activeVehicles ?? 0,
      change: `${stats?.availableVehicles ?? 0} available`,
      icon: <Truck className="h-5 w-5" />,
      color: 'text-green-600',
    },
    {
      label: 'Drivers on Duty',
      value: stats?.driversOnDuty ?? 0,
      change: `${stats?.driversOnLeave ?? 0} on leave`,
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600',
    },
    {
      label: "Today's Trips",
      value: stats?.todaysTrips ?? 0,
      change: `${stats?.completedToday ?? 0} completed`,
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-orange-600',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'User'}
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening with your fleet today.
            </p>
          </div>
          {isStaff && (
            <Button onClick={() => setRequestDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </div>

        {/* Stats Grid - Show for admins/coordinators */}
        {isAdmin && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {statsDisplay.map((stat) => (
                <Card key={stat.label}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </CardTitle>
                    <div className={stat.color}>{stat.icon}</div>
                  </CardHeader>
                  <CardContent>
                    {statsLoading ? (
                      <>
                        <Skeleton className="h-8 w-16 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <p className="text-xs text-muted-foreground">{stat.change}</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Hailing Service Spend Widget */}
            {hailingLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ) : hailingSpend && (hailingSpend.thisMonthSpend > 0 || hailingSpend.lastMonthSpend > 0) ? (
              <Card 
                className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => navigate('/reports?tab=hailing')}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Hailing Service Spend</p>
                      <p className="text-2xl font-bold">
                        LKR {hailingSpend.thisMonthSpend.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <div className="flex items-center gap-1.5 text-xs">
                        {hailingSpend.percentChange !== 0 && (
                          <span className={cn(
                            'flex items-center gap-0.5 font-medium',
                            hailingSpend.percentChange > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'
                          )}>
                            {hailingSpend.percentChange > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {Math.abs(hailingSpend.percentChange)}%
                          </span>
                        )}
                        <span className="text-muted-foreground">
                          {hailingSpend.tripCount} trip{hailingSpend.tripCount !== 1 ? 's' : ''} this month
                        </span>
                      </div>
                    </div>
                    <div className="rounded-full bg-primary/10 p-3">
                      <Receipt className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
        {/* Role-specific content */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Staff: Quick Actions */}
          {isStaff && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common tasks for your transport needs</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
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
                <Button 
                  variant="outline" 
                  className="h-auto py-4 justify-start"
                  onClick={() => navigate('/requests')}
                >
                  <Clock className="mr-3 h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <div className="font-medium">View My Requests</div>
                    <div className="text-xs text-muted-foreground">
                      Track status of your bookings
                    </div>
                  </div>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Driver: Today's Schedule */}
          {isDriver && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Trips
                </CardTitle>
                <CardDescription>Your assigned trips for today</CardDescription>
              </CardHeader>
              <CardContent>
                {tripsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : driverTrips.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Truck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No trips scheduled for today</p>
                    <p className="text-sm text-muted-foreground">
                      Check back later for new assignments
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {driverTrips.map(trip => (
                      <div key={trip.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Badge variant={trip.status === 'dispatched' ? 'default' : 'secondary'}>
                          {format(new Date(trip.scheduledTime), 'HH:mm')}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {trip.pickup} → {trip.dropoff}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {trip.passengerCount} passenger(s)
                          </p>
                        </div>
                        <Badge variant="outline" className="capitalize">
                          {trip.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Admin: Alerts */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Alerts
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : alerts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                      <Truck className="h-6 w-6 text-green-600" />
                    </div>
                    <p className="text-muted-foreground">All systems operational</p>
                    <p className="text-sm text-muted-foreground">
                      No alerts or issues at this time
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => navigate(alert.link)}
                      >
                        <Badge 
                          variant="outline" 
                          className={cn(
                            alert.type === 'setup' && 'bg-orange-100 text-orange-700 border-orange-200',
                            alert.type === 'warning' && 'bg-yellow-100 text-yellow-700 border-yellow-200',
                            alert.type === 'urgent' && 'bg-destructive/10 text-destructive border-destructive/20'
                          )}
                        >
                          {alert.type === 'setup' ? 'Setup' : alert.type === 'warning' ? 'Warning' : 'Urgent'}
                        </Badge>
                        <span className="text-sm flex-1">{alert.message}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Pending Approvals (for approvers) */}
          {isApprover && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Pending Approvals
                  {pendingCount > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {pendingCount}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Requests awaiting your decision</CardDescription>
              </CardHeader>
              <CardContent>
                {approvalsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : pendingApprovals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground">No pending approvals</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingApprovals.map(approval => (
                      <div key={approval.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{approval.requestNumber}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {approval.requesterName} • {approval.purpose}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => navigate('/approvals')}>
                          Review
                        </Button>
                      </div>
                    ))}
                    {pendingCount > 3 && (
                      <Button 
                        variant="link" 
                        className="w-full" 
                        onClick={() => navigate('/approvals')}
                      >
                        View all {pendingCount} pending approvals →
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Recent Activity */}
          <Card className={isStaff ? '' : 'lg:col-span-2'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest updates and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : recentActivity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No recent activity</p>
                  <p className="text-sm text-muted-foreground">
                    Activity will appear here once you start using the system
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map(activity => (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 rounded-full bg-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{activity.action}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.requestNumber && `${activity.requestNumber} • `}
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Request Dialog */}
      <RequestDialog 
        open={requestDialogOpen} 
        onOpenChange={setRequestDialogOpen} 
      />
    </DashboardLayout>
  );
}
