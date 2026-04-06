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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, XCircle, ArrowRight } from 'lucide-react';
import { useReviewChangeRequest, ChangeRequest } from '@/hooks/useChangeRequests';

interface ReviewChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  changeRequest: ChangeRequest | null;
}

const changeTypeLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  reschedule: { label: 'Reschedule', icon: <Calendar className="h-4 w-4" />, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  passenger_update: { label: 'Passenger Update', icon: <Users className="h-4 w-4" />, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  cancel: { label: 'Cancellation', icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800 border-red-300' },
};

export function ReviewChangeRequestDialog({ open, onOpenChange, changeRequest }: ReviewChangeRequestDialogProps) {
  const [reviewNotes, setReviewNotes] = useState('');
  const reviewMutation = useReviewChangeRequest();

  const handleReview = async (action: 'approved' | 'rejected') => {
    if (!changeRequest) return;
    await reviewMutation.mutateAsync({
      changeRequestId: changeRequest.id,
      action,
      reviewNotes: reviewNotes.trim() || undefined,
    });
    setReviewNotes('');
    onOpenChange(false);
  };

  if (!changeRequest) return null;

  const typeInfo = changeTypeLabels[changeRequest.change_type] || changeTypeLabels.cancel;
  const currentValues = changeRequest.current_values as Record<string, unknown>;
  const requestedValues = changeRequest.requested_values as Record<string, unknown>;

  const formatDateValue = (val: unknown) => {
    if (!val || typeof val !== 'string') return '—';
    try {
      return format(new Date(val), 'PPP · h:mm a');
    } catch {
      return String(val);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setReviewNotes(''); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle>Review Change Request</DialogTitle>
            <Badge className={`${typeInfo.color} gap-1`}>
              {typeInfo.icon}
              {typeInfo.label}
            </Badge>
          </div>
          <DialogDescription>
            {changeRequest.travel_request?.request_number} — submitted by {changeRequest.requester?.full_name || 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request info */}
          <div className="bg-muted/50 p-3 rounded-md text-sm space-y-1">
            <p><span className="font-medium">Route:</span> {changeRequest.travel_request?.pickup_location_name || changeRequest.travel_request?.pickup_location} → {changeRequest.travel_request?.dropoff_location_name || changeRequest.travel_request?.dropoff_location}</p>
            <p><span className="font-medium">Purpose:</span> {changeRequest.travel_request?.purpose}</p>
          </div>

          <Separator />

          {/* Change details */}
          {changeRequest.change_type === 'reschedule' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Schedule Change</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="bg-muted/50 p-2 rounded text-sm">
                  <p className="text-muted-foreground text-xs">Current</p>
                  <p>{formatDateValue(currentValues.pickup_datetime)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="bg-primary/10 p-2 rounded text-sm">
                  <p className="text-muted-foreground text-xs">Requested</p>
                  <p>{formatDateValue(requestedValues.pickup_datetime)}</p>
                </div>
              </div>
            </div>
          )}

          {changeRequest.change_type === 'passenger_update' && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Passenger Count Change</p>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                <div className="bg-muted/50 p-2 rounded text-sm text-center">
                  <p className="text-muted-foreground text-xs">Current</p>
                  <p className="text-lg font-semibold">{String(currentValues.passenger_count)}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <div className="bg-primary/10 p-2 rounded text-sm text-center">
                  <p className="text-muted-foreground text-xs">Requested</p>
                  <p className="text-lg font-semibold">{String(requestedValues.passenger_count)}</p>
                </div>
              </div>
            </div>
          )}

          {changeRequest.change_type === 'cancel' && (
            <div className="bg-destructive/10 p-3 rounded-md">
              <p className="text-sm font-medium text-destructive">Requester wants to cancel this travel request.</p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1">
            <p className="text-sm font-medium">Reason</p>
            <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{changeRequest.reason}</p>
          </div>

          <Separator />

          {/* Review notes */}
          <div className="space-y-2">
            <Label htmlFor="review-notes">Review Notes (optional)</Label>
            <Textarea
              id="review-notes"
              placeholder="Add notes about your decision..."
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="destructive"
            onClick={() => handleReview('rejected')}
            disabled={reviewMutation.isPending}
          >
            Reject
          </Button>
          <Button
            onClick={() => handleReview('approved')}
            disabled={reviewMutation.isPending}
          >
            {reviewMutation.isPending ? 'Processing...' : 'Approve & Apply'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
