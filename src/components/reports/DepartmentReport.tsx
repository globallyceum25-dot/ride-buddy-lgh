import { Building2, Users, TrendingUp } from 'lucide-react';
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
import { DepartmentReportData } from '@/hooks/useReportData';
import { Skeleton } from '@/components/ui/skeleton';

interface DepartmentReportProps {
  data: DepartmentReportData | undefined;
  isLoading: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220, 70%, 50%)',
  'hsl(160, 60%, 45%)',
  'hsl(30, 80%, 55%)',
  'hsl(280, 60%, 55%)',
  'hsl(340, 70%, 50%)',
];

export function DepartmentReport({ data, isLoading }: DepartmentReportProps) {
  if (isLoading) {
    return <DepartmentReportSkeleton />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No department data</h3>
        <p className="text-sm text-muted-foreground">
          No requests found for the selected date range.
        </p>
      </div>
    );
  }

  const pieData = data.items.slice(0, 6).map((item) => ({
    name: item.department,
    value: item.totalRequests,
  }));

  const barData = data.items.slice(0, 8).map((item) => ({
    name: item.department.length > 12 ? item.department.substring(0, 12) + '...' : item.department,
    completed: item.completedRequests,
    rejected: item.rejectedRequests,
    pending: item.pendingRequests,
  }));

  const totalPassengers = data.items.reduce((sum, d) => sum + d.totalPassengers, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Requests"
          value={data.totals.totalRequests}
          subtitle={`${data.totals.totalDepartments} departments`}
          icon={Building2}
        />
        <StatCard
          title="Completion Rate"
          value={`${data.totals.overallCompletionRate}%`}
          subtitle="Requests completed"
          icon={TrendingUp}
        />
        <StatCard
          title="Total Passengers"
          value={totalPassengers}
          subtitle="Across all departments"
          icon={Users}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Request Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name.substring(0, 10)}${name.length > 10 ? '...' : ''} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Status by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="completed" stackId="a" fill="hsl(160, 60%, 45%)" name="Completed" />
                  <Bar dataKey="pending" stackId="a" fill="hsl(var(--primary))" name="Pending" />
                  <Bar dataKey="rejected" stackId="a" fill="hsl(var(--destructive))" name="Rejected" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Department Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Department</TableHead>
                <TableHead className="text-right">Total Requests</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Rejected</TableHead>
                <TableHead className="text-right">Pending</TableHead>
                <TableHead className="text-right">Total Passengers</TableHead>
                <TableHead className="text-right">Avg Passengers</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.items.map((item) => (
                <TableRow key={item.department}>
                  <TableCell className="font-medium">{item.department}</TableCell>
                  <TableCell className="text-right">{item.totalRequests}</TableCell>
                  <TableCell className="text-right">{item.completedRequests}</TableCell>
                  <TableCell className="text-right">{item.rejectedRequests}</TableCell>
                  <TableCell className="text-right">{item.pendingRequests}</TableCell>
                  <TableCell className="text-right">{item.totalPassengers}</TableCell>
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

function DepartmentReportSkeleton() {
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
