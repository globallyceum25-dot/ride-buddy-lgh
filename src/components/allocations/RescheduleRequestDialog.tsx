import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useRescheduleRequest } from '@/hooks/useRequests';
import type { TravelRequest } from '@/hooks/useRequests';

interface RescheduleRequestDialogProps {
  request: TravelRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RescheduleRequestDialog({ request, open, onOpenChange }: RescheduleRequestDialogProps) {
  const [pickupDate, setPickupDate] = useState<Date | undefined>(undefined);
  const [pickupTime, setPickupTime] = useState('09:00');
  const [returnDate, setReturnDate] = useState<Date | undefined>(undefined);
  const [returnTime, setReturnTime] = useState('17:00');

  const reschedule = useRescheduleRequest();

  const hasReturn = request?.return_datetime !== null && request?.return_datetime !== undefined;

  const handleSubmit = () => {
    if (!request || !pickupDate) return;

    const pickupDatetime = new Date(pickupDate);
    const [ph, pm] = pickupTime.split(':').map(Number);
    pickupDatetime.setHours(ph, pm, 0, 0);

    let returnDatetime: string | undefined;
    if (hasReturn && returnDate) {
      const rd = new Date(returnDate);
      const [rh, rm] = returnTime.split(':').map(Number);
      rd.setHours(rh, rm, 0, 0);
      returnDatetime = rd.toISOString();
    }

    reschedule.mutate(
      {
        id: request.id,
        pickupDatetime: pickupDatetime.toISOString(),
        returnDatetime,
        oldPickupDatetime: request.pickup_datetime,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setPickupDate(undefined);
          setPickupTime('09:00');
          setReturnDate(undefined);
          setReturnTime('17:00');
        },
      }
    );
  };

  const now = new Date();
  const isValid = pickupDate && new Date(
    pickupDate.getFullYear(), pickupDate.getMonth(), pickupDate.getDate(),
    ...pickupTime.split(':').map(Number) as [number, number]
  ) > now;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Request</DialogTitle>
          <DialogDescription>
            {request?.request_number} — {request?.pickup_location_name || request?.pickup_location} → {request?.dropoff_location_name || request?.dropoff_location}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Current pickup: {request && format(new Date(request.pickup_datetime), 'MMM d, yyyy h:mm a')}
          </p>

          {/* New Pickup Date */}
          <div className="space-y-2">
            <Label>New Pickup Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !pickupDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {pickupDate ? format(pickupDate, 'PPP') : 'Select date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={pickupDate}
                  onSelect={setPickupDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* New Pickup Time */}
          <div className="space-y-2">
            <Label>New Pickup Time</Label>
            <Input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </div>

          {/* Return Date/Time (only if original has one) */}
          {hasReturn && (
            <>
              <div className="space-y-2">
                <Label>New Return Date (optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !returnDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {returnDate ? format(returnDate, 'PPP') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={returnDate}
                      onSelect={setReturnDate}
                      disabled={(date) => date < (pickupDate || new Date())}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>New Return Time</Label>
                <Input
                  type="time"
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || reschedule.isPending}>
            {reschedule.isPending ? 'Rescheduling...' : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
