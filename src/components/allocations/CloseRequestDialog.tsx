import { useState } from 'react';
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
import { AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCloseRequest } from '@/hooks/useRequests';
import type { RequestStatus } from '@/hooks/useRequests';

interface CloseRequestDialogProps {
  request: {
    id: string;
    request_number: string;
    pickup_location: string;
    dropoff_location: string;
    pickup_location_name?: string | null;
    dropoff_location_name?: string | null;
    status: RequestStatus;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseRequestDialog({ request, open, onOpenChange }: CloseRequestDialogProps) {
  const [reason, setReason] = useState('');
  const closeRequest = useCloseRequest();

  const handleSubmit = () => {
    if (!request || !reason.trim()) return;
    closeRequest.mutate(
      { id: request.id, reason: reason.trim(), fromStatus: request.status },
      {
        onSuccess: () => {
          setReason('');
          onOpenChange(false);
        },
      }
    );
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) setReason('');
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Close Overdue Request
          </DialogTitle>
          <DialogDescription>
            This request's pickup date has passed and cannot be allocated.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{request?.request_number}</strong> — {request?.pickup_location_name || request?.pickup_location} → {request?.dropoff_location_name || request?.dropoff_location}
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="close-reason">Reason for closing <span className="text-destructive">*</span></Label>
          <Textarea
            id="close-reason"
            placeholder="Enter the reason for closing this overdue request..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={!reason.trim() || closeRequest.isPending}
          >
            {closeRequest.isPending ? 'Closing...' : 'Close Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
