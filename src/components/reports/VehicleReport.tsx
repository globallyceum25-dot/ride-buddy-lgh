import { Car, Route, TrendingUp } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { VehicleReportData } from '@/hooks/useReportData';
import { Skeleton } from '@/components/ui/skeleton';

interface VehicleReportProps {
  data: VehicleReportData | undefined;
  isLoading: boolean;
}

export function VehicleReport({ data, isLoading }: VehicleReportProps) {
  if (isLoading) {
    return <VehicleReportSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Car className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No vehicle data</h3>
        <p className="text-sm text-muted-foreground">
          No allocations found for the selected date range.
        </p>
      </div>
    );
  }

  const chartData = data.items.slice(0, 10).map((item) => ({
    name: item.registrationNumber,
    trips: item.totalTrips,
    completed: item.completedTrips,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Trips"
          value={data.totals.totalTrips}
          subtitle={`${data.items.length} vehicles used`}
          icon={Car}
        />
        <StatCard
          title="Total Distance"
          value={`${data.totals.totalDistance.toLocaleString()} km`}
          subtitle="Across all vehicles"
          icon={Route}
        />
        <StatCard
          title="Completion Rate"
          value={`${data.totals.avgUtilization}%`}
          subtitle="Average completion rate"
          icon={TrendingUp}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trips by Vehicle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground"
                />
                <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="trips" fill="hsl(var(--primary))" name="Total Trips" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="hsl(var(--primary) / 0.5)" name="Completed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead className="text-right">Total Trips</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Cancelled</TableHead>
                <TableHead className="text-right">Distance (km)</TableHead>
                <TableHead className="text-right">Avg Passengers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.vehicleId}>
                  <TableCell className="font-medium">{item.registrationNumber}</TableCell>
                  <TableCell>
                    {item.make && item.model ? `${item.make} ${item.model}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">{item.totalTrips}</TableCell>
                  <TableCell className="text-right">{item.completedTrips}</TableCell>
                  <TableCell className="text-right">{item.cancelledTrips}</TableCell>
                  <TableCell className="text-right">{item.totalDistance.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.avgPassengers.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function VehicleReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
      <Skeleton className="h-[380px]" />
      <Skeleton className="h-[300px]" />
    </div>
  );
}
