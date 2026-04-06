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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, Users, XCircle } from 'lucide-react';
import { useCreateChangeRequest } from '@/hooks/useChangeRequests';
import { TravelRequest } from '@/hooks/useRequests';

interface ChangeRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: TravelRequest | null;
}

type ChangeType = 'reschedule' | 'passenger_update' | 'cancel';

export function ChangeRequestDialog({ open, onOpenChange, request }: ChangeRequestDialogProps) {
  const [changeType, setChangeType] = useState<ChangeType>('reschedule');
  const [reason, setReason] = useState('');
  const [newPickupDatetime, setNewPickupDatetime] = useState('');
  const [newReturnDatetime, setNewReturnDatetime] = useState('');
  const [newPassengerCount, setNewPassengerCount] = useState<number>(1);
  const createChangeRequest = useCreateChangeRequest();

  const resetForm = () => {
    setChangeType('reschedule');
    setReason('');
    setNewPickupDatetime('');
    setNewReturnDatetime('');
    setNewPassengerCount(request?.passenger_count || 1);
  };

  const handleSubmit = async () => {
    if (!request || !reason.trim()) return;

    let currentValues: Record<string, unknown> = {};
    let requestedValues: Record<string, unknown> = {};

    if (changeType === 'reschedule') {
      if (!newPickupDatetime) return;
      currentValues = {
        pickup_datetime: request.pickup_datetime,
        return_datetime: request.return_datetime,
      };
      requestedValues = {
        pickup_datetime: new Date(newPickupDatetime).toISOString(),
        return_datetime: newReturnDatetime ? new Date(newReturnDatetime).toISOString() : request.return_datetime,
      };
    } else if (changeType === 'passenger_update') {
      currentValues = { passenger_count: request.passenger_count };
      requestedValues = { passenger_count: newPassengerCount };
    } else {
      currentValues = { status: request.status };
      requestedValues = { status: 'cancelled' };
    }

    await createChangeRequest.mutateAsync({
      request_id: request.id,
      change_type: changeType,
      current_values: currentValues,
      requested_values: requestedValues,
      reason: reason.trim(),
    });

    resetForm();
    onOpenChange(false);
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Request Change — {request.request_number}</DialogTitle>
          <DialogDescription>
            Submit a change request for this approved travel request. Changes will be reviewed by your approver.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Change Type */}
          <div className="space-y-2">
            <Label>Change Type</Label>
            <Select value={changeType} onValueChange={(v) => setChangeType(v as ChangeType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reschedule">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Reschedule
                  </div>
                </SelectItem>
                <SelectItem value="passenger_update">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Update Passengers
                  </div>
                </SelectItem>
                <SelectItem value="cancel">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4" />
                    Cancel Request
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Current vs New Values */}
          {changeType === 'reschedule' && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Schedule</p>
                <p className="text-sm">
                  {format(new Date(request.pickup_datetime), 'PPP')} at {format(new Date(request.pickup_datetime), 'h:mm a')}
                </p>
                {request.return_datetime && (
                  <p className="text-sm text-muted-foreground">
                    Return: {format(new Date(request.return_datetime), 'PPP · h:mm a')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pickup">New Pickup Date & Time *</Label>
                <Input
                  id="new-pickup"
                  type="datetime-local"
                  value={newPickupDatetime}
                  onChange={(e) => setNewPickupDatetime(e.target.value)}
                />
              </div>
              {request.trip_type === 'round_trip' && (
                <div className="space-y-2">
                  <Label htmlFor="new-return">New Return Date & Time</Label>
                  <Input
                    id="new-return"
                    type="datetime-local"
                    value={newReturnDatetime}
                    onChange={(e) => setNewReturnDatetime(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {changeType === 'passenger_update' && (
            <div className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="text-sm font-medium text-muted-foreground mb-1">Current Passengers</p>
                <p className="text-sm">{request.passenger_count} passenger(s)</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-passengers">New Passenger Count *</Label>
                <Input
                  id="new-passengers"
                  type="number"
                  min={1}
                  max={50}
                  value={newPassengerCount}
                  onChange={(e) => setNewPassengerCount(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
          )}

          {changeType === 'cancel' && (
            <div className="bg-destructive/10 p-3 rounded-md">
              <p className="text-sm font-medium text-destructive">
                This will request cancellation of travel request {request.request_number}.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Route: {request.pickup_location_name || request.pickup_location} → {request.dropoff_location_name || request.dropoff_location}
              </p>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Change *</Label>
            <Textarea
              id="reason"
              placeholder="Explain why this change is needed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onOpenChange(false); }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !reason.trim() ||
              createChangeRequest.isPending ||
              (changeType === 'reschedule' && !newPickupDatetime) ||
              (changeType === 'passenger_update' && newPassengerCount === request.passenger_count)
            }
          >
            {createChangeRequest.isPending ? 'Submitting...' : 'Submit Change Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
