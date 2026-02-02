import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Eye, Edit, X, FileText } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RequestDialog } from '@/components/requests/RequestDialog';
import { RequestDetailDialog } from '@/components/requests/RequestDetailDialog';
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import { RequestPriorityBadge } from '@/components/requests/RequestPriorityBadge';
import { useMyRequests, useCancelRequest, TravelRequest } from '@/hooks/useRequests';
import { Database } from '@/integrations/supabase/types';

type RequestStatus = Database['public']['Enums']['request_status'];

const statusOptions: { value: RequestStatus | 'all'; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_approval', label: 'Pending Approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'allocated', label: 'Allocated' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export default function Requests() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [viewRequestId, setViewRequestId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: requests = [], isLoading } = useMyRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const cancelRequest = useCancelRequest();

  const filteredRequests = requests.filter((request) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      request.request_number?.toLowerCase().includes(query) ||
      request.purpose.toLowerCase().includes(query) ||
      request.pickup_location.toLowerCase().includes(query) ||
      request.dropoff_location.toLowerCase().includes(query)
    );
  });

  const handleCancel = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this request?')) {
      await cancelRequest.mutateAsync(id);
    }
  };

  const canEdit = (status: RequestStatus) => 
    status === 'draft' || status === 'pending_approval';
  
  const canCancel = (status: RequestStatus) => 
    !['cancelled', 'completed', 'in_progress', 'allocated'].includes(status);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
            <p className="text-muted-foreground">
              Submit and track your travel requests
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by request number, purpose, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as RequestStatus | 'all')}
              >
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Travel Requests</CardTitle>
            <CardDescription>
              {filteredRequests.length} request(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Loading requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No requests found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first travel request'}
                </p>
                {!searchQuery && statusFilter === 'all' && (
                  <Button onClick={() => setIsCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Request
                  </Button>
                )}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Purpose</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Approver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-medium">
                          {request.request_number}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {request.purpose}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="truncate max-w-[150px]">{request.pickup_location}</p>
                            <p className="text-muted-foreground truncate max-w-[150px]">
                              → {request.dropoff_location}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(request.pickup_datetime), 'MMM d, yyyy')}
                          <br />
                          <span className="text-muted-foreground text-xs">
                            {format(new Date(request.pickup_datetime), 'h:mm a')}
                          </span>
                        </TableCell>
                        <TableCell>
                          {request.approver?.full_name || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <RequestStatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>
                          <RequestPriorityBadge priority={request.priority} />
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setViewRequestId(request.id)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canEdit(request.status) && (
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {canCancel(request.status) && (
                                <DropdownMenuItem 
                                  onClick={() => handleCancel(request.id)}
                                  className="text-destructive"
                                >
                                  <X className="h-4 w-4 mr-2" />
                                  Cancel
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <RequestDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <RequestDetailDialog 
        open={!!viewRequestId} 
        onOpenChange={(open) => !open && setViewRequestId(null)}
        requestId={viewRequestId}
      />
    </DashboardLayout>
  );
}
