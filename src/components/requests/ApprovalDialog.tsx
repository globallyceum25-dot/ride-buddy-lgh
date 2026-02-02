import { useState } from 'react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MapPin, 
  Calendar, 
  Users, 
  User, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { RequestStatusBadge } from './RequestStatusBadge';
import { RequestPriorityBadge } from './RequestPriorityBadge';
import { 
  useRequest, 
  useApproveRequest, 
  useRejectRequest,
  TravelRequest 
} from '@/hooks/useRequests';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requestId: string | null;
}

export function ApprovalDialog({ 
  open, 
  onOpenChange, 
  requestId 
}: ApprovalDialogProps) {
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { data, isLoading } = useRequest(requestId || undefined);
  const approveRequest = useApproveRequest();
  const rejectRequest = useRejectRequest();

  const request = data?.request;

  const handleApprove = async () => {
    if (!requestId) return;
    await approveRequest.mutateAsync({ id: requestId, notes });
    setNotes('');
    setMode('view');
    onOpenChange(false);
  };

  const handleReject = async () => {
    if (!requestId || !rejectionReason.trim()) return;
    await rejectRequest.mutateAsync({ 
      id: requestId, 
      reason: rejectionReason,
      notes 
    });
    setRejectionReason('');
    setNotes('');
    setMode('view');
    onOpenChange(false);
  };

  const handleClose = () => {
    setMode('view');
    setNotes('');
    setRejectionReason('');
    onOpenChange(false);
  };

  if (!requestId) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle>{request?.request_number || 'Loading...'}</DialogTitle>
            {request && (
              <>
                <RequestStatusBadge status={request.status} />
                <RequestPriorityBadge priority={request.priority} />
              </>
            )}
          </div>
          <DialogDescription>
            Review and approve or reject this travel request.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[50vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : request ? (
            <div className="space-y-4 pr-4">
              {/* Requester Info */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    {request.is_guest_request ? (
                      <>
                        <p className="font-medium">{request.guest_name || 'Guest'}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.guest_email || 'No email'}
                          {request.guest_employee_id && ` • ID: ${request.guest_employee_id}`}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="font-medium">{request.requester?.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.requester?.email}
                          {request.requester?.department && ` • ${request.requester.department}`}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Purpose</Label>
                <p className="mt-1">{request.purpose}</p>
              </div>

              <Separator />

              {/* Trip Details */}
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium">From</p>
                        <p className="text-sm text-muted-foreground">{request.pickup_location}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">To</p>
                        <p className="text-sm text-muted-foreground">{request.dropoff_location}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-sm font-medium">
                      {format(new Date(request.pickup_datetime), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.pickup_datetime), 'h:mm a')}
                      {request.trip_type === 'round_trip' && request.return_datetime && (
                        <> • Return: {format(new Date(request.return_datetime), 'PPp')}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">
                    {request.passenger_count} passenger(s)
                    {request.trip_type !== 'one_way' && (
                      <span className="text-muted-foreground"> • {request.trip_type.replace('_', ' ')}</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Special Requirements */}
              {request.special_requirements && (
                <>
                  <Separator />
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Special Requirements
                    </Label>
                    <p className="mt-1 text-sm">{request.special_requirements}</p>
                  </div>
                </>
              )}

              {/* Cost Center */}
              {request.cost_center && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Cost Center
                  </Label>
                  <p className="mt-1 text-sm">{request.cost_center}</p>
                </div>
              )}

              {/* Approval/Rejection Form */}
              {mode === 'approve' && (
                <>
                  <Separator />
                  <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Approve Request</span>
                    </div>
                    <div>
                      <Label htmlFor="approve-notes">Comments (optional)</Label>
                      <Textarea
                        id="approve-notes"
                        placeholder="Add any comments for the requester..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </>
              )}

              {mode === 'reject' && (
                <>
                  <Separator />
                  <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-lg space-y-3">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <XCircle className="h-5 w-5" />
                      <span className="font-medium">Reject Request</span>
                    </div>
                    <div>
                      <Label htmlFor="rejection-reason">
                        Reason for Rejection <span className="text-red-500">*</span>
                      </Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Please provide a reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Request not found</p>
            </div>
          )}
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {mode === 'view' && request?.status === 'pending_approval' && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="sm:mr-auto"
              >
                Close
              </Button>
              <Button
                variant="destructive"
                onClick={() => setMode('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                onClick={() => setMode('approve')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}

          {mode === 'approve' && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('view')}
                className="sm:mr-auto"
              >
                Back
              </Button>
              <Button
                onClick={handleApprove}
                disabled={approveRequest.isPending}
              >
                {approveRequest.isPending ? 'Approving...' : 'Confirm Approval'}
              </Button>
            </>
          )}

          {mode === 'reject' && (
            <>
              <Button
                variant="outline"
                onClick={() => setMode('view')}
                className="sm:mr-auto"
              >
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleReject}
                disabled={rejectRequest.isPending || !rejectionReason.trim()}
              >
                {rejectRequest.isPending ? 'Rejecting...' : 'Confirm Rejection'}
              </Button>
            </>
          )}

          {mode === 'view' && request?.status !== 'pending_approval' && (
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
