import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Car, Gauge, MapPin, Clock, Users, Navigation } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Allocation, HAILING_SERVICE_LABELS } from '@/hooks/useAllocations';

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
    fare_amount?: number;
    receipt_reference?: string;
  }) => void;
  isLoading?: boolean;
  poolCount?: number; // Number of allocations in the pool
}

export function TripTrackingDialog({
  open,
  onOpenChange,
  allocation,
  mode,
  onSubmit,
  isLoading,
  poolCount,
}: TripTrackingDialogProps) {
  const [odometer, setOdometer] = useState<string>('');
  const [fareAmount, setFareAmount] = useState<string>('');
  const [receiptRef, setReceiptRef] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setOdometer('');
      setFareAmount(allocation?.fare_amount?.toString() || '');
      setReceiptRef(allocation?.receipt_reference || '');
      setError('');
    }
  }, [open]);

  const isHailingService = !!allocation?.hailing_service;
  const vehicleLastOdometer = allocation?.vehicle?.odometer || 0;
  const odometerStart = allocation?.odometer_start || 0;

  const handleSubmit = () => {
    // For hailing service, skip odometer validation but capture cost
    if (isHailingService) {
      if (mode === 'start') {
        onSubmit({ actual_pickup: new Date().toISOString() });
      } else {
        onSubmit({
          actual_dropoff: new Date().toISOString(),
          fare_amount: fareAmount ? parseFloat(fareAmount) : undefined,
          receipt_reference: receiptRef || undefined,
        });
      }
      return;
    }

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

  const isPooledTrip = poolCount && poolCount > 1;

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
            {isPooledTrip && (
              <Badge variant="secondary" className="ml-2">
                <Users className="h-3 w-3 mr-1" />
                {poolCount} trips
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'start'
              ? isPooledTrip
                ? `Record the starting odometer reading for ${poolCount} pooled trips`
                : 'Record the starting odometer reading before departure'
              : isPooledTrip
                ? `Record the ending odometer reading to complete ${poolCount} pooled trips`
                : 'Record the ending odometer reading to complete the trip'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Trip Info */}
          <div className="rounded-lg bg-muted p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium">{allocation.request?.request_number}</span>
              {isPooledTrip && (
                <span className="text-muted-foreground">+ {poolCount! - 1} more</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {allocation.hailing_service ? (
                <>
                  <Navigation className="h-4 w-4" />
                  {HAILING_SERVICE_LABELS[allocation.hailing_service]}
                </>
              ) : (
                <>
                  <Car className="h-4 w-4" />
                  {allocation.vehicle?.registration_number}
                  {allocation.vehicle?.make && ` (${allocation.vehicle.make} ${allocation.vehicle.model})`}
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {allocation.request?.pickup_location_name || allocation.request?.pickup_location} → {allocation.request?.dropoff_location_name || allocation.request?.dropoff_location}
            </div>
            {mode === 'complete' && allocation.actual_pickup && !isHailingService && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Started: {format(new Date(allocation.actual_pickup), 'MMM d, h:mm a')} ({odometerStart.toLocaleString()} km)
              </div>
            )}
          </div>

          {/* Pooled Trip Notice */}
          {isPooledTrip && !isHailingService && (
            <div className="rounded-lg border border-info/50 bg-info/10 p-3">
              <p className="text-sm text-info-foreground">
                <Users className="h-4 w-4 inline mr-1" />
                This odometer reading will be applied to all {poolCount} trips in this pool.
              </p>
            </div>
          )}

          {/* Hailing Service Cost Fields */}
          {isHailingService && mode === 'complete' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fare">Fare Amount (LKR)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">LKR</span>
                  <Input
                    id="fare"
                    type="number"
                    placeholder="0.00"
                    value={fareAmount}
                    onChange={(e) => setFareAmount(e.target.value)}
                    className="pl-12"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="receipt">Receipt / Booking Reference</Label>
                <Input
                  id="receipt"
                  placeholder="e.g. PK-123456"
                  value={receiptRef}
                  onChange={(e) => setReceiptRef(e.target.value)}
                />
              </div>
            </>
          )}

          {isHailingService && mode === 'start' && (
            <div className="rounded-lg border border-info/50 bg-info/10 p-3">
              <p className="text-sm text-info-foreground">
                <Navigation className="h-4 w-4 inline mr-1" />
                This is a hailing service trip — no odometer tracking required.
              </p>
            </div>
          )}

          {/* Odometer Input - only for fleet vehicles */}
          {!isHailingService && (
            <>
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
            </>
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
            {isLoading
              ? 'Saving...'
              : mode === 'start'
                ? isPooledTrip
                  ? `Start ${poolCount} Trips`
                  : 'Start Trip'
                : isPooledTrip
                  ? `Complete ${poolCount} Trips`
                  : 'Complete Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
