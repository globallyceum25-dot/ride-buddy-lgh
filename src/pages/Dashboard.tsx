import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Truck,
  Users,
  Calendar,
  TrendingUp,
  Clock,
  AlertTriangle,
  Plus,
} from 'lucide-react';

// Placeholder stats - will be replaced with real data
const stats = [
  {
    label: 'Total Requests',
    value: '0',
    change: '+0%',
    icon: <FileText className="h-5 w-5" />,
    color: 'text-primary',
  },
  {
    label: 'Active Vehicles',
    value: '0',
    change: '0 available',
    icon: <Truck className="h-5 w-5" />,
    color: 'text-success',
  },
  {
    label: 'Drivers on Duty',
    value: '0',
    change: '0 on leave',
    icon: <Users className="h-5 w-5" />,
    color: 'text-info',
  },
  {
    label: "Today's Trips",
    value: '0',
    change: '0 completed',
    icon: <Calendar className="h-5 w-5" />,
    color: 'text-warning',
  },
];

export default function Dashboard() {
  const { profile, roles } = useAuth();
  const isStaff = roles.includes('staff');
  const isDriver = roles.includes('driver');
  const isAdmin = roles.includes('group_admin') || roles.includes('location_coordinator');

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
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          )}
        </div>

        {/* Stats Grid - Show for admins/coordinators */}
        {isAdmin && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <Card key={stat.label}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={stat.color}>{stat.icon}</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-muted-foreground">{stat.change}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <FileText className="mr-3 h-5 w-5 text-primary" />
                  <div className="text-left">
                    <div className="font-medium">New Transport Request</div>
                    <div className="text-xs text-muted-foreground">
                      Book a ride for yourself or team
                    </div>
                  </div>
                </Button>
                <Button variant="outline" className="h-auto py-4 justify-start">
                  <Clock className="mr-3 h-5 w-5 text-warning" />
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
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Truck className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No trips scheduled for today</p>
                  <p className="text-sm text-muted-foreground">
                    Check back later for new assignments
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin: Alerts */}
          {isAdmin && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Alerts
                </CardTitle>
                <CardDescription>Items requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Setup
                    </Badge>
                    <span className="text-sm">Add your first location</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Setup
                    </Badge>
                    <span className="text-sm">Register vehicles</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Setup
                    </Badge>
                    <span className="text-sm">Add driver profiles</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pending Approvals (for approvers) */}
          {roles.includes('approver') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-warning" />
                  Pending Approvals
                </CardTitle>
                <CardDescription>Requests awaiting your decision</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No pending approvals</p>
                </div>
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No recent activity</p>
                <p className="text-sm text-muted-foreground">
                  Activity will appear here once you start using the system
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}