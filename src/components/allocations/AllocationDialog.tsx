import { useState, useEffect } from 'react';
import { format, isPast } from 'date-fns';
import { AlertTriangle, Calendar, Car, User } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useVehicles } from '@/hooks/useVehicles';
import { useDrivers } from '@/hooks/useDrivers';
import { useCreateAllocation } from '@/hooks/useAllocations';
import { useBusyResources, BusyAllocation } from '@/hooks/useBusyResources';

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

// Tooltip content component for busy resources
function BusyTooltipContent({ allocation }: { allocation: BusyAllocation }) {
  return (
    <div className="space-y-1">
      <div className="font-medium">
        {allocation.poolNumber || allocation.requestNumber || 'Unknown Trip'}
      </div>
      <div className="text-xs">
        {format(new Date(allocation.scheduledPickup), 'h:mm a')}
      </div>
      <div className="text-xs">
        {allocation.pickup} → {allocation.dropoff}
      </div>
      <div className="text-xs capitalize">
        Status: {allocation.status.replace('_', ' ')}
      </div>
    </div>
  );
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
  
  // Filter vehicles by basic availability and capacity (but include busy ones for display)
  const eligibleVehicles = vehicles.filter(v => 
    v.is_active && 
    v.status === 'available' && 
    (v.capacity ?? 0) >= (request?.passenger_count || 1)
  );
  
  const eligibleDrivers = drivers.filter(d => 
    d.is_active && 
    d.status === 'available'
  );
  
  // Helper to get allocation for a resource
  const getResourceAllocation = (resourceId: string, type: 'vehicle' | 'driver') => {
    return busyResources?.allocations.find(a => 
      type === 'vehicle' ? a.vehicleId === resourceId : a.driverId === resourceId
    );
  };
  
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

  const isOverdue = isPast(new Date(request.pickup_datetime));
  
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
          {isOverdue && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This request's pickup date has passed. Please update the request date before allocating.
              </AlertDescription>
            </Alert>
          )}
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
                <TooltipProvider delayDuration={300}>
                  {eligibleVehicles.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No vehicles meet capacity requirements
                    </div>
                  ) : (
                    eligibleVehicles.map((vehicle) => {
                      const isBusy = busyResources?.busyVehicleIds.includes(vehicle.id);
                      const allocation = isBusy ? getResourceAllocation(vehicle.id, 'vehicle') : null;
                      
                      if (isBusy && allocation) {
                        return (
                          <Tooltip key={vehicle.id}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 px-2 py-1.5 opacity-50 cursor-not-allowed text-sm">
                                <Car className="h-4 w-4" />
                                <span>{vehicle.registration_number}</span>
                                <span className="text-muted-foreground">
                                  ({vehicle.make} {vehicle.model} • {vehicle.capacity} seats)
                                </span>
                                <Badge variant="secondary" className="ml-auto">Busy</Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <BusyTooltipContent allocation={allocation} />
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      
                      return (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4" />
                            <span>{vehicle.registration_number}</span>
                            <span className="text-muted-foreground">
                              ({vehicle.make} {vehicle.model} • {vehicle.capacity} seats)
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </TooltipProvider>
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
                <TooltipProvider delayDuration={300}>
                  {eligibleDrivers.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No available drivers
                    </div>
                  ) : (
                    eligibleDrivers.map((driver) => {
                      const isBusy = busyResources?.busyDriverIds.includes(driver.id);
                      const allocation = isBusy ? getResourceAllocation(driver.id, 'driver') : null;
                      
                      if (isBusy && allocation) {
                        return (
                          <Tooltip key={driver.id}>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 px-2 py-1.5 opacity-50 cursor-not-allowed text-sm">
                                <User className="h-4 w-4" />
                                <span>{driver.profile?.full_name || driver.employee_id}</span>
                                <span className="text-muted-foreground">
                                  ({driver.license_type} license)
                                </span>
                                <Badge variant="secondary" className="ml-auto">Busy</Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <BusyTooltipContent allocation={allocation} />
                            </TooltipContent>
                          </Tooltip>
                        );
                      }
                      
                      return (
                        <SelectItem key={driver.id} value={driver.id}>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{driver.profile?.full_name || driver.employee_id}</span>
                            <span className="text-muted-foreground">
                              ({driver.license_type} license)
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })
                  )}
                </TooltipProvider>
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
            disabled={!vehicleId || !driverId || createAllocation.isPending || isOverdue}
          >
            {createAllocation.isPending ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
