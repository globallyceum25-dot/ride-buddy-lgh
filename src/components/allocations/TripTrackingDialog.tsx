import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Car, Gauge, MapPin, Clock } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { Allocation } from '@/hooks/useAllocations';

interface TripTrackingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocation: (Allocation & { vehicle?: { odometer?: number | null } }) | null;
  mode: 'start' | 'complete';
  onSubmit: (data: {
    odometer_start?: number;
    odometer_end?: number;
    actual_pickup?: string;
    actual_dropoff?: string;
  }) => void;
  isLoading?: boolean;
}

export function TripTrackingDialog({
  open,
  onOpenChange,
  allocation,
  mode,
  onSubmit,
  isLoading,
}: TripTrackingDialogProps) {
  const [odometer, setOdometer] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setOdometer('');
      setError('');
    }
  }, [open]);

  const vehicleLastOdometer = allocation?.vehicle?.odometer || 0;
  const odometerStart = allocation?.odometer_start || 0;

  const handleSubmit = () => {
    const odometerValue = parseInt(odometer, 10);
    
    if (isNaN(odometerValue) || odometerValue <= 0) {
      setError('Please enter a valid odometer reading');
      return;
    }

    if (mode === 'start') {
      if (odometerValue < vehicleLastOdometer) {
        setError(`Odometer must be at least ${vehicleLastOdometer.toLocaleString()} km (last reading)`);
        return;
      }
      onSubmit({
        odometer_start: odometerValue,
        actual_pickup: new Date().toISOString(),
      });
    } else {
      if (odometerValue <= odometerStart) {
        setError(`Odometer must be greater than ${odometerStart.toLocaleString()} km (start reading)`);
        return;
      }
      onSubmit({
        odometer_end: odometerValue,
        actual_dropoff: new Date().toISOString(),
      });
    }
  };

  const tripDistance = mode === 'complete' && odometer
    ? Math.max(0, parseInt(odometer, 10) - odometerStart)
    : null;

  if (!allocation) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'start' ? (
              <>
                <Car className="h-5 w-5" />
                Start Trip
              </>
            ) : (
              <>
                <Gauge className="h-5 w-5" />
                Complete Trip
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'start'
              ? 'Record the starting odometer reading before departure'
              : 'Record the ending odometer reading to complete the trip'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Trip Info */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{allocation.request?.request_number}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Car className="h-4 w-4" />
              {allocation.vehicle?.registration_number}
              {allocation.vehicle?.make && ` (${allocation.vehicle.make} ${allocation.vehicle.model})`}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {allocation.request?.pickup_location} → {allocation.request?.dropoff_location}
            </div>
            {mode === 'complete' && allocation.actual_pickup && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Started: {format(new Date(allocation.actual_pickup), 'MMM d, h:mm a')} ({odometerStart.toLocaleString()} km)
              </div>
            )}
          </div>

          {/* Odometer Input */}
          <div className="space-y-2">
            <Label htmlFor="odometer">
              {mode === 'start' ? 'Starting Odometer' : 'Ending Odometer'} *
            </Label>
            <div className="relative">
              <Input
                id="odometer"
                type="number"
                placeholder="Enter odometer reading"
                value={odometer}
                onChange={(e) => {
                  setOdometer(e.target.value);
                  setError('');
                }}
                className={error ? 'border-destructive' : ''}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                km
              </span>
            </div>
            {mode === 'start' && vehicleLastOdometer > 0 && (
              <p className="text-xs text-muted-foreground">
                Last reading: {vehicleLastOdometer.toLocaleString()} km
              </p>
            )}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>

          {/* Trip Distance (for completion) */}
          {mode === 'complete' && tripDistance !== null && tripDistance > 0 && (
            <div className="rounded-lg border p-3">
              <p className="text-sm text-muted-foreground">Trip distance</p>
              <p className="text-2xl font-bold">{tripDistance.toLocaleString()} km</p>
            </div>
          )}

          {/* Current Time */}
          <div className="space-y-2">
            <Label>{mode === 'start' ? 'Pickup Time' : 'Dropoff Time'}</Label>
            <div className="rounded-md border px-3 py-2 text-sm bg-muted">
              {format(new Date(), 'MMM d, yyyy h:mm a')} (now)
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Saving...' : mode === 'start' ? 'Start Trip' : 'Complete Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
