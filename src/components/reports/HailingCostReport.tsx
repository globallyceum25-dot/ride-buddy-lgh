import { Car, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from './StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { HailingCostReportData } from '@/hooks/useReportData';

interface HailingCostReportProps {
  data: HailingCostReportData | undefined;
  isLoading: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  pickme: 'PickMe',
  uber: 'Uber',
  personal: 'Personal',
};

export function HailingCostReport({ data, isLoading }: HailingCostReportProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-[100px]" />)}
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Car className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">No hailing service data</p>
        <p className="text-sm">No hailing service trips found for the selected period.</p>
      </div>
    );
  }

  const chartData = data.items.map((item) => ({
    name: PROVIDER_LABELS[item.provider] || item.provider,
    cost: item.totalFare,
    trips: item.tripCount,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total Hailing Trips"
          value={data.totals.totalTrips}
          icon={Car}
        />
        <StatCard
          title="Total Cost (LKR)"
          value={`LKR ${data.totals.totalCost.toLocaleString()}`}
          icon={DollarSign}
        />
        <StatCard
          title="Avg Cost per Trip"
          value={`LKR ${Math.round(data.totals.avgCostPerTrip).toLocaleString()}`}
          icon={TrendingUp}
        />
        <StatCard
          title="With Receipts"
          value={`${data.totals.totalWithReceipts} / ${data.totals.totalTrips}`}
          icon={Receipt}
        />
      </div>

      {/* Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="name" className="text-xs fill-muted-foreground" />
              <YAxis className="text-xs fill-muted-foreground" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--popover))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--popover-foreground))',
                }}
                formatter={(value: number) => [`LKR ${value.toLocaleString()}`, 'Total Cost']}
              />
              <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detail Table */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead className="text-right">Total Fare (LKR)</TableHead>
                <TableHead className="text-right">Avg Fare (LKR)</TableHead>
                <TableHead className="text-right">Receipts</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.provider}>
                  <TableCell className="font-medium">
                    {PROVIDER_LABELS[item.provider] || item.provider}
                  </TableCell>
                  <TableCell className="text-right">{item.tripCount}</TableCell>
                  <TableCell className="text-right">{item.totalFare.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{Math.round(item.avgFare).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{item.receiptsCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
