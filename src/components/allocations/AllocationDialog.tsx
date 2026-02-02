import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar, Car, User } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { useCreateAllocation } from '@/hooks/useAllocations';
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

interface AllocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: Request | null;
}

export function AllocationDialog({ open, onOpenChange, request }: AllocationDialogProps) {
  const [vehicleId, setVehicleId] = useState<string>('');
  const [driverId, setDriverId] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const { data: vehicles = [] } = useVehicles();
  const { data: drivers = [] } = useDrivers();
  const createAllocation = useCreateAllocation();
  
  // Get the date from the request for busy resource check
  const requestDate = request ? format(new Date(request.pickup_datetime), 'yyyy-MM-dd') : null;
  const { data: busyResources } = useBusyResources(requestDate);
  
  // Filter available vehicles and drivers (excluding those with active allocations)
  const availableVehicles = vehicles.filter(v => 
    v.is_active && 
    v.status === 'available' && 
    (v.capacity ?? 0) >= (request?.passenger_count || 1) &&
    !busyResources?.busyVehicleIds.includes(v.id)
  );
  
  const availableDrivers = drivers.filter(d => 
    d.is_active && 
    d.status === 'available' &&
    !busyResources?.busyDriverIds.includes(d.id)
  );
  
  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setVehicleId('');
      setDriverId('');
      setNotes('');
    }
  }, [open]);
  
  const handleSubmit = async () => {
    if (!request || !vehicleId || !driverId) return;
    
    await createAllocation.mutateAsync({
      request_id: request.id,
      vehicle_id: vehicleId,
      driver_id: driverId,
      scheduled_pickup: request.pickup_datetime,
      notes: notes || undefined,
    });
    
    onOpenChange(false);
  };
  
  if (!request) return null;
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Assign Vehicle & Driver</DialogTitle>
          <DialogDescription>
            Allocate resources to request {request.request_number}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Request Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(request.pickup_datetime), 'PPP p')}</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{request.pickup_location}</span>
              <span className="text-muted-foreground"> → </span>
              <span className="font-medium">{request.dropoff_location}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {request.passenger_count} passenger(s) • {request.requester?.full_name}
            </div>
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
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Any special instructions for the driver..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={!vehicleId || !driverId || createAllocation.isPending}
          >
            {createAllocation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
