import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar, Car, User, Users, AlertCircle, Check } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { useCreateTripPool, checkPoolCompatibility } from '@/hooks/useAllocations';
import { useBusyResources } from '@/hooks/useBusyResources';

interface Request {
  id: string;
  request_number: string | null;
  purpose: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_datetime: string;
  passenger_count: number;
  priority: string;
  requester?: {
    full_name: string;
    email: string;
    department?: string;
  } | null;
}

interface MergeRequestsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requests: Request[];
}

export function MergeRequestsDialog({ open, onOpenChange, requests }: MergeRequestsDialogProps) {
  const [vehicleId, setVehicleId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [routeSummary, setRouteSummary] = useState('');
  
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const createTripPool = useCreateTripPool();
  
  // Get the date from the first request for busy resource check
  const requestDate = requests.length > 0 
    ? format(new Date(requests[0].pickup_datetime), 'yyyy-MM-dd') 
    : null;
  const { data: busyResources } = useBusyResources(requestDate);
  
  // Calculate total passengers
  const totalPassengers = useMemo(() => 
    requests.reduce((sum, r) => sum + r.passenger_count, 0),
    [requests]
  );
  
  // Get the selected vehicle's capacity
  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  const vehicleCapacity = selectedVehicle?.capacity || 12;
  
  // Check compatibility
  const compatibility = useMemo(() => 
    checkPoolCompatibility(requests, vehicleCapacity),
    [requests, vehicleCapacity]
  );
  
  // Filter available vehicles with sufficient capacity (excluding those with active allocations)
  const availableVehicles = vehicles.filter(v => 
    v.is_active && 
    v.status === 'available' && 
    (v.capacity ?? 0) >= totalPassengers &&
    !busyResources?.busyVehicleIds.includes(v.id)
  );
  
  const availableDrivers = drivers.filter(d => 
    d.is_active && 
    d.status === 'available' &&
    !busyResources?.busyDriverIds.includes(d.id)
  );
  
  // Reset form and set defaults when dialog opens
  useEffect(() => {
    if (open && requests.length > 0) {
      setVehicleId('');
      setDriverId('');
      
      // Set default time to earliest pickup time
      const earliestTime = requests
        .map(r => new Date(r.pickup_datetime))
        .sort((a, b) => a.getTime() - b.getTime())[0];
      setScheduledTime(format(earliestTime, 'HH:mm'));
      
      // Generate route summary
      const pickups = [...new Set(requests.map(r => r.pickup_location))];
      const dropoffs = [...new Set(requests.map(r => r.dropoff_location))];
      setRouteSummary(`${pickups.join(', ')} → ${dropoffs.join(', ')}`);
    }
  }, [open, requests]);
  
  const handleSubmit = async () => {
    // Validation with feedback
    if (requests.length < 2) {
      toast.error('Need at least 2 requests to merge');
      return;
    }
    if (!vehicleId) {
      toast.error('Please select a vehicle');
      return;
    }
    if (!driverId) {
      toast.error('Please select a driver');
      return;
    }
    if (!compatibility.compatible) {
      toast.error(compatibility.reason || 'Requests are not compatible');
      return;
    }
    
    try {
      // Get the scheduled date from the first request
      const scheduledDate = format(new Date(requests[0].pickup_datetime), 'yyyy-MM-dd');
      
      await createTripPool.mutateAsync({
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        vehicle_id: vehicleId,
        driver_id: driverId,
        route_summary: routeSummary,
        request_ids: requests.map(r => r.id),
      });
      
      onOpenChange(false);
    } catch (error) {
      // Error is already handled by mutation's onError
    }
  };
  
  if (requests.length === 0) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Merge Requests into Trip Pool</DialogTitle>
          <DialogDescription>
            Combine {requests.length} requests into a single trip with shared vehicle and driver
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Compatibility Warning */}
          {!compatibility.compatible && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{compatibility.reason}</AlertDescription>
            </Alert>
          )}
          
          {compatibility.compatible && (
            <Alert>
              <Check className="h-4 w-4" />
              <AlertDescription>
                Requests are compatible for pooling
              </AlertDescription>
            </Alert>
          )}
          
          {/* Requests Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Total: {totalPassengers} passengers</span>
            </div>
            
            {requests.map((request) => (
              <div key={request.id} className="text-sm border-t pt-2 first:border-t-0 first:pt-0">
                <div className="flex justify-between">
                  <span className="font-medium">{request.request_number}</span>
                  <span className="text-muted-foreground">
                    {request.passenger_count} pax • {format(new Date(request.pickup_datetime), 'h:mm a')}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {request.pickup_location} → {request.dropoff_location}
                </div>
                <div className="text-muted-foreground">
                  {request.requester?.full_name}
                </div>
              </div>
            ))}
          </div>
          
          {/* Scheduled Time */}
          <div className="space-y-2">
            <Label htmlFor="time">Pickup Time *</Label>
            <Input
              id="time"
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
            />
          </div>
          
          {/* Vehicle Selection */}
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vehicle *</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Select a vehicle" />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No available vehicles — all are assigned to trips on this date
                  </div>
                ) : (
                  availableVehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      <div className="flex items-center gap-2">
                        <Car className="h-4 w-4" />
                        <span>{vehicle.registration_number}</span>
                        <span className="text-muted-foreground">
                          ({vehicle.make} {vehicle.model} • {vehicle.capacity} seats)
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Driver Selection */}
          <div className="space-y-2">
            <Label htmlFor="driver">Driver *</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger id="driver">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    No available drivers — all are assigned to trips on this date
                  </div>
                ) : (
                  availableDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{driver.profile?.full_name || driver.employee_id}</span>
                        <span className="text-muted-foreground">
                          ({driver.license_type} license)
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          {/* Route Summary */}
          <div className="space-y-2">
            <Label htmlFor="route">Route Summary</Label>
            <Textarea
              id="route"
              placeholder="Describe the route..."
              value={routeSummary}
              onChange={(e) => setRouteSummary(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!vehicleId || !driverId || !compatibility.compatible || createTripPool.isPending}
          >
            {createTripPool.isPending ? 'Creating Pool...' : 'Create Pool'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
