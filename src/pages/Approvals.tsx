import { useState } from 'react';
import { format } from 'date-fns';
import { Clock, CheckCircle, XCircle, FileText, PenLine } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ApprovalDialog } from '@/components/requests/ApprovalDialog';
import { ReviewChangeRequestDialog } from '@/components/requests/ReviewChangeRequestDialog';
import { RequestStatusBadge } from '@/components/requests/RequestStatusBadge';
import { RequestPriorityBadge } from '@/components/requests/RequestPriorityBadge';
import { usePendingApprovals, useApprovalRequests, TravelRequest } from '@/hooks/useRequests';
import { usePendingChangeRequests, ChangeRequest } from '@/hooks/useChangeRequests';
import { Database } from '@/integrations/supabase/types';
import { useIsMobile } from '@/hooks/use-mobile';

type RequestStatus = Database['public']['Enums']['request_status'];

export default function Approvals() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<ChangeRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'changes'>('pending');
  const isMobile = useIsMobile();

  const { data: pendingRequests = [], isLoading: loadingPending } = usePendingApprovals();
  const { data: approvedRequests = [], isLoading: loadingApproved } = useApprovalRequests('approved' as RequestStatus);
  const { data: rejectedRequests = [], isLoading: loadingRejected } = useApprovalRequests('rejected' as RequestStatus);
  const { data: pendingChanges = [], isLoading: loadingChanges } = usePendingChangeRequests();

  const renderMobileCards = (
    requests: TravelRequest[],
    isLoading: boolean,
    emptyMessage: string,
    showActions = true
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No requests</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {requests.map((request) => (
          <Card key={request.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-semibold text-sm">{request.request_number}</span>
                <RequestPriorityBadge priority={request.priority} />
              </div>
              <div className="text-sm mb-1">
                {request.is_guest_request ? (
                  <span className="font-medium">{request.guest_name || 'Guest'}</span>
                ) : (
                  <span className="font-medium">{request.requester?.full_name}</span>
                )}
              </div>
              <div className="text-sm text-muted-foreground mb-1">
                {request.pickup_location} → {request.dropoff_location}
              </div>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs text-muted-foreground">
                  {format(new Date(request.pickup_datetime), 'MMM d, yyyy · h:mm a')}
                </span>
                {showActions ? (
                  <Button size="sm" onClick={() => setSelectedRequestId(request.id)}>Review</Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <RequestStatusBadge status={request.status} />
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRequestId(request.id)}>View</Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRequestTable = (
    requests: TravelRequest[],
    isLoading: boolean,
    emptyMessage: string,
    showActions = true
  ) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No requests</h3>
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    if (isMobile) {
      return renderMobileCards(requests, isLoading, emptyMessage, showActions);
    }

    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Request #</TableHead>
              <TableHead>Requester</TableHead>
              <TableHead>Purpose</TableHead>
              <TableHead>Route</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Priority</TableHead>
              {!showActions && <TableHead>Status</TableHead>}
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request) => (
              <TableRow key={request.id}>
                <TableCell className="font-medium">
                  {request.request_number}
                </TableCell>
                <TableCell>
                  <div>
                    {request.is_guest_request ? (
                      <>
                        <p className="font-medium">{request.guest_name || 'Guest'}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.guest_employee_id || request.guest_email || 'No details'}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{request.requester?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requester?.department || request.requester?.email}
                        </p>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className="max-w-[150px] truncate">
                  {request.purpose}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p className="truncate max-w-[120px]">{request.pickup_location}</p>
                    <p className="text-muted-foreground truncate max-w-[120px]">
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
                  <RequestPriorityBadge priority={request.priority} />
                </TableCell>
                {!showActions && (
                  <TableCell>
                    <RequestStatusBadge status={request.status} />
                  </TableCell>
                )}
                <TableCell className="text-right">
                  {showActions ? (
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedRequestId(request.id)}
                      >
                        Review
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequestId(request.id)}
                    >
                      View
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve travel requests assigned to you
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting your decision
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Requests you approved
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedRequests.length}</div>
              <p className="text-xs text-muted-foreground">
                Requests you rejected
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Requests</CardTitle>
            <CardDescription>
              Click on a request to review and take action
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="h-4 w-4" />
                  Pending
                  {pendingRequests.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pendingRequests.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approved
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  <XCircle className="h-4 w-4 mr-2" />
                  Rejected
                </TabsTrigger>
                <TabsTrigger value="changes" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  Change Requests
                  {pendingChanges.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {pendingChanges.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                {renderRequestTable(
                  pendingRequests,
                  loadingPending,
                  'No pending requests to review',
                  true
                )}
              </TabsContent>

              <TabsContent value="approved">
                {renderRequestTable(
                  approvedRequests,
                  loadingApproved,
                  'No approved requests yet',
                  false
                )}
              </TabsContent>

              <TabsContent value="rejected">
                {renderRequestTable(
                  rejectedRequests,
                  loadingRejected,
                  'No rejected requests',
                  false
                )}
              </TabsContent>

              <TabsContent value="changes">
                {loadingChanges ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : pendingChanges.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <PenLine className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No pending change requests</h3>
                    <p className="text-muted-foreground">Change requests from users will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingChanges.map((cr) => {
                      const changeLabel = cr.change_type === 'reschedule' ? 'Reschedule' : cr.change_type === 'passenger_update' ? 'Passenger Update' : 'Cancellation';
                      return (
                        <Card key={cr.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">{cr.travel_request?.request_number}</span>
                                  <Badge variant="secondary" className="text-xs">{changeLabel}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {cr.requester?.full_name} — {cr.travel_request?.pickup_location_name || cr.travel_request?.pickup_location} → {cr.travel_request?.dropoff_location_name || cr.travel_request?.dropoff_location}
                                </p>
                                <p className="text-sm">{cr.reason}</p>
                                <p className="text-xs text-muted-foreground">
                                  Submitted {format(new Date(cr.created_at), 'PPp')}
                                </p>
                              </div>
                              <Button size="sm" onClick={() => setSelectedChangeRequest(cr)}>
                                Review
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Approval Dialog */}
      <ApprovalDialog
        open={!!selectedRequestId}
        onOpenChange={(open) => !open && setSelectedRequestId(null)}
        requestId={selectedRequestId}
      />

      {/* Review Change Request Dialog */}
      <ReviewChangeRequestDialog
        open={!!selectedChangeRequest}
        onOpenChange={(open) => !open && setSelectedChangeRequest(null)}
        changeRequest={selectedChangeRequest}
      />
    </DashboardLayout>
  );
}
