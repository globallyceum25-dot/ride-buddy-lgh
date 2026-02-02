import { useState } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2 } from 'lucide-react';
import { useAuditLogs, AuditFilters } from '@/hooks/useSettings';

const DATE_PRESETS = [
  { label: 'Last 24 hours', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

const ACTION_TYPES = ['INSERT', 'UPDATE', 'DELETE', 'Status changed'];

const TABLE_NAMES = [
  'travel_requests',
  'allocations',
  'vehicles',
  'drivers',
  'locations',
  'profiles',
  'user_roles',
];

export function AuditLogs() {
  const [datePreset, setDatePreset] = useState('7');
  const [action, setAction] = useState<string>('');
  const [tableName, setTableName] = useState<string>('');

  const filters: AuditFilters = {
    startDate: format(startOfDay(subDays(new Date(), parseInt(datePreset))), "yyyy-MM-dd'T'HH:mm:ss"),
    endDate: format(endOfDay(new Date()), "yyyy-MM-dd'T'HH:mm:ss"),
    action: action || undefined,
    tableName: tableName || undefined,
  };

  const { data: logs, isLoading } = useAuditLogs(filters);

  const exportToCsv = () => {
    if (!logs?.length) return;

    const headers = ['Timestamp', 'Action', 'Table', 'Record ID', 'Changes'];
    const rows = logs.map(log => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      log.action,
      log.table_name || '',
      log.record_id || '',
      JSON.stringify(log.new_values || log.old_values || {}),
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getActionBadgeVariant = (action: string) => {
    switch (action.toUpperCase()) {
      case 'INSERT':
        return 'default';
      case 'UPDATE':
        return 'secondary';
      case 'DELETE':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatChanges = (log: typeof logs[0]) => {
    if (log.new_values) {
      const keys = Object.keys(log.new_values);
      if (keys.length === 0) return '-';
      if (keys.length <= 2) {
        return keys.map(k => `${k}: ${log.new_values![k]}`).join(', ');
      }
      return `${keys.length} fields changed`;
    }
    return '-';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>
              View system activity logs
            </CardDescription>
          </div>
          <Button variant="outline" onClick={exportToCsv} disabled={!logs?.length}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-4">
          <Select value={datePreset} onValueChange={setDatePreset}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              {DATE_PRESETS.map((preset) => (
                <SelectItem key={preset.days} value={preset.days.toString()}>
                  {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={action || "all"} onValueChange={(val) => setAction(val === "all" ? "" : val)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              {ACTION_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tableName || "all"} onValueChange={(val) => setTableName(val === "all" ? "" : val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All tables" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tables</SelectItem>
              {TABLE_NAMES.map((table) => (
                <SelectItem key={table} value={table}>
                  {table.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !logs?.length ? (
          <div className="text-center py-8 text-muted-foreground">
            No audit logs found for the selected filters
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[150px]">Table</TableHead>
                  <TableHead>Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(log.action)}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.table_name?.replace(/_/g, ' ') || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                      {formatChanges(log)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
