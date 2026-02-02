import { User, Clock, CheckCircle } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from './StatCard';
import { DriverReportData } from '@/hooks/useReportData';
import { Skeleton } from '@/components/ui/skeleton';

interface DriverReportProps {
  data: DriverReportData | undefined;
  isLoading: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

export function DriverReport({ data, isLoading }: DriverReportProps) {
  if (isLoading) {
    return <DriverReportSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <User className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No driver data</h3>
        <p className="text-sm text-muted-foreground">
          No allocations with drivers found for the selected date range.
        </p>
      </div>
    );
  }

  const chartData = data.items.slice(0, 10).map((item) => ({
    name: item.driverName.split(' ')[0],
    trips: item.totalTrips,
    completed: item.completedTrips,
  }));

  const statusData = [
    { name: 'Completed', value: data.items.reduce((sum, d) => sum + d.completedTrips, 0) },
    { name: 'Cancelled', value: data.items.reduce((sum, d) => sum + d.cancelledTrips, 0) },
    { name: 'Other', value: data.items.reduce((sum, d) => sum + (d.totalTrips - d.completedTrips - d.cancelledTrips), 0) },
  ].filter(d => d.value > 0);

  const totalHours = data.items.reduce((sum, d) => sum + d.totalHours, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Trips"
          value={data.totals.totalTrips}
          subtitle={`${data.totals.totalDrivers} drivers`}
          icon={User}
        />
        <StatCard
          title="Avg Trips per Driver"
          value={data.totals.avgTripsPerDriver.toFixed(1)}
          subtitle="For active drivers"
          icon={CheckCircle}
        />
        <StatCard
          title="Total Hours"
          value={totalHours.toFixed(1)}
          subtitle="Hours on duty"
          icon={Clock}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Trips by Driver</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="trips" fill="hsl(var(--primary))" name="Total Trips" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trip Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>License</TableHead>
                <TableHead className="text-right">Total Trips</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Cancelled</TableHead>
                <TableHead className="text-right">Total Hours</TableHead>
                <TableHead className="text-right">Avg Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.driverId}>
                  <TableCell className="font-medium">{item.driverName}</TableCell>
                  <TableCell>{item.licenseNumber}</TableCell>
                  <TableCell className="text-right">{item.totalTrips}</TableCell>
                  <TableCell className="text-right">{item.completedTrips}</TableCell>
                  <TableCell className="text-right">{item.cancelledTrips}</TableCell>
                  <TableCell className="text-right">{item.totalHours.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">{item.avgTripDuration.toFixed(1)}h</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function DriverReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[380px]" />
        <Skeleton className="h-[380px]" />
      </div>
      <Skeleton className="h-[300px]" />
    </div>
  );
}
