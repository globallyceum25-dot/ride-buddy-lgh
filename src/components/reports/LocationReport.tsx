import { MapPin, ArrowRight, Route } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
import { LocationReportData } from '@/hooks/useReportData';
import { Skeleton } from '@/components/ui/skeleton';

interface LocationReportProps {
  data: LocationReportData | undefined;
  isLoading: boolean;
}

export function LocationReport({ data, isLoading }: LocationReportProps) {
  if (isLoading) {
    return <LocationReportSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No location data</h3>
        <p className="text-sm text-muted-foreground">
          No trips found for the selected date range.
        </p>
      </div>
    );
  }

  const chartData = data.items.slice(0, 8).map((item) => ({
    name: item.locationName.length > 15 ? item.locationName.substring(0, 15) + '...' : item.locationName,
    origin: item.tripsAsOrigin,
    destination: item.tripsAsDestination,
  }));

  const busiestLocation = data.items[0];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Trips"
          value={data.totals.totalTrips}
          subtitle={`${data.items.length} locations involved`}
          icon={MapPin}
        />
        <StatCard
          title="Unique Routes"
          value={data.totals.uniqueRoutes}
          subtitle="Different pickup → dropoff combinations"
          icon={Route}
        />
        <StatCard
          title="Busiest Location"
          value={busiestLocation?.locationName || '-'}
          subtitle={`${busiestLocation?.totalTrips || 0} trips`}
          icon={MapPin}
        />
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Trips by Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend />
                <Bar dataKey="origin" fill="hsl(var(--primary))" name="As Origin" radius={[4, 4, 0, 0]} />
                <Bar dataKey="destination" fill="hsl(var(--primary) / 0.5)" name="As Destination" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Route Frequency Table */}
      <Card>
        <CardHeader>
          <CardTitle>Top Routes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pickup</TableHead>
                <TableHead></TableHead>
                <TableHead>Dropoff</TableHead>
                <TableHead className="text-right">Trips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.routes.map((route, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{route.pickup}</TableCell>
                  <TableCell>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                  <TableCell>{route.dropoff}</TableCell>
                  <TableCell className="text-right">{route.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Location Details Table */}
      <Card>
        <CardHeader>
          <CardTitle>Location Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">As Origin</TableHead>
                <TableHead className="text-right">As Destination</TableHead>
                <TableHead className="text-right">Total Trips</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.locationId}>
                  <TableCell className="font-medium">{item.locationName}</TableCell>
                  <TableCell>{item.locationCode || '-'}</TableCell>
                  <TableCell className="text-right">{item.tripsAsOrigin}</TableCell>
                  <TableCell className="text-right">{item.tripsAsDestination}</TableCell>
                  <TableCell className="text-right font-medium">{item.totalTrips}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function LocationReportSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[120px]" />
        ))}
      </div>
      <Skeleton className="h-[380px]" />
      <Skeleton className="h-[250px]" />
      <Skeleton className="h-[300px]" />
    </div>
  );
}
