import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus, Eye, Edit, X, FileText, Zap, PenLine, Link2, Copy, Check } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RequestDialog } from '@/components/requests/RequestDialog';
import { RequestDetailDialog } from '@/components/requests/RequestDetailDialog';
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import { RequestPriorityBadge } from '@/components/requests/RequestPriorityBadge';
import { CreateFormLinkDialog } from '@/components/settings/CreateFormLinkDialog';
import { useMyRequests, useCancelRequest, TravelRequest } from '@/hooks/useRequests';
import { ChangeRequestDialog } from '@/components/requests/ChangeRequestDialog';
import { useMyPendingChangeRequestIds } from '@/hooks/useChangeRequests';
import { useAuth } from '@/contexts/AuthContext';
import { useSystemSettings } from '@/hooks/useSettings';
import { Database } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

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
  const [changeRequest, setChangeRequest] = useState<TravelRequest | null>(null);
  const [statusFilter, setStatusFilter] = useState<RequestStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const isMobile = useIsMobile();

  const { data: requests = [], isLoading } = useMyRequests(
    statusFilter === 'all' ? undefined : statusFilter
  );
  const cancelRequest = useCancelRequest();
  const { data: pendingChangeIds } = useMyPendingChangeRequestIds();

  const canRequestChange = (r: TravelRequest) => r.status === 'approved';

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

  const isImmediate = (r: TravelRequest) => !r.approver_id && r.status === 'approved';

  const renderMobileCards = () => (
    <div className="space-y-3">
      {filteredRequests.map((request) => (
        <Card key={request.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="font-semibold text-sm">{request.request_number}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <RequestPriorityBadge priority={request.priority} />
                <RequestStatusBadge status={request.status} />
                {isImmediate(request) && (
                  <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 gap-1 px-1.5 py-0.5 text-[10px]">
                    <Zap className="h-3 w-3" />
                    Immediate
                  </Badge>
                )}
                {pendingChangeIds?.has(request.id) && (
                  <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 gap-1 px-1.5 py-0.5 text-[10px]">
                    <PenLine className="h-3 w-3" />
                    Change Pending
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground truncate mb-1">{request.purpose}</p>
            <div className="text-sm mb-1">
              <span>{request.pickup_location_name || request.pickup_location}</span>
              <span className="text-muted-foreground"> → {request.dropoff_location_name || request.dropoff_location}</span>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">
                {format(new Date(request.pickup_datetime), 'MMM d, yyyy · h:mm a')}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">Actions</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewRequestId(request.id)}>
                    <Eye className="h-4 w-4 mr-2" />View Details
                  </DropdownMenuItem>
                  {canEdit(request.status) && (
                    <DropdownMenuItem><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                  )}
                  {canRequestChange(request) && (
                    <DropdownMenuItem onClick={() => setChangeRequest(request)}>
                      <PenLine className="h-4 w-4 mr-2" />Request Change
                    </DropdownMenuItem>
                  )}
                  {canCancel(request.status) && (
                    <DropdownMenuItem onClick={() => handleCancel(request.id)} className="text-destructive">
                      <X className="h-4 w-4 mr-2" />Cancel
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

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

        {/* Requests Table / Cards */}
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
            ) : isMobile ? (
              renderMobileCards()
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
                      <TableHead>Est. Distance</TableHead>
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
                            <p className="truncate max-w-[150px]" title={request.pickup_location}>
                              {request.pickup_location_name || request.pickup_location}
                            </p>
                            <p className="text-muted-foreground truncate max-w-[150px]" title={request.dropoff_location}>
                              → {request.dropoff_location_name || request.dropoff_location}
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
                          {isImmediate(request) ? (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-100 gap-1 px-1.5 py-0.5 text-xs">
                              <Zap className="h-3 w-3" />
                              Immediate
                            </Badge>
                          ) : (
                            request.approver?.full_name || (
                              <span className="text-muted-foreground">—</span>
                            )
                          )}
                        </TableCell>
                        <TableCell>
                          {request.estimated_distance_km != null
                            ? `${request.estimated_distance_km} km`
                            : <span className="text-muted-foreground">—</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <RequestStatusBadge status={request.status} />
                            {isImmediate(request) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Zap className="h-3.5 w-3.5 text-amber-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Immediate request — skipped approval</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {pendingChangeIds?.has(request.id) && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge className="bg-orange-100 text-orange-800 border-orange-300 hover:bg-orange-100 gap-1 px-1.5 py-0.5 text-[10px]">
                                      <PenLine className="h-3 w-3" />
                                      Change Pending
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>This request has a pending change request</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
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
                              {canRequestChange(request) && (
                                <DropdownMenuItem onClick={() => setChangeRequest(request)}>
                                  <PenLine className="h-4 w-4 mr-2" />
                                  Request Change
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
      <ChangeRequestDialog
        open={!!changeRequest}
        onOpenChange={(open) => !open && setChangeRequest(null)}
        request={changeRequest}
      />
    </DashboardLayout>
  );
}
