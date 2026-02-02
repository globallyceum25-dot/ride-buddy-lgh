import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Vehicle, 
  useCreateVehicle, 
  useUpdateVehicle,
  VehicleStatus,
  VehicleType,
  FuelType,
  OwnershipType,
} from '@/hooks/useVehicles';
import { useLocations } from '@/hooks/useLocations';
import { useEffect } from 'react';

const formSchema = z.object({
  registration_number: z.string().min(1, 'Registration number is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().min(1900).max(new Date().getFullYear() + 1).optional().nullable(),
  vehicle_type: z.enum(['sedan', 'suv', 'van', 'minibus', 'bus', 'other']).optional().nullable(),
  capacity: z.coerce.number().min(1).optional().nullable(),
  fuel_type: z.enum(['petrol', 'diesel', 'electric', 'hybrid', 'cng']).optional().nullable(),
  ownership: z.enum(['owned', 'leased', 'rented']).optional().nullable(),
  status: z.enum(['available', 'in_trip', 'maintenance', 'breakdown', 'retired']).optional().nullable(),
  location_id: z.string().optional().nullable(),
  insurance_expiry: z.string().optional(),
  registration_expiry: z.string().optional(),
  last_service_date: z.string().optional(),
  next_service_due: z.string().optional(),
  odometer: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

const vehicleTypes: { value: VehicleType; label: string }[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'van', label: 'Van' },
  { value: 'minibus', label: 'Minibus' },
  { value: 'bus', label: 'Bus' },
  { value: 'other', label: 'Other' },
];

const fuelTypes: { value: FuelType; label: string }[] = [
  { value: 'petrol', label: 'Petrol' },
  { value: 'diesel', label: 'Diesel' },
  { value: 'electric', label: 'Electric' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'cng', label: 'CNG' },
];

const ownershipTypes: { value: OwnershipType; label: string }[] = [
  { value: 'owned', label: 'Owned' },
  { value: 'leased', label: 'Leased' },
  { value: 'rented', label: 'Rented' },
];

const statusTypes: { value: VehicleStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'in_trip', label: 'In Trip' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'breakdown', label: 'Breakdown' },
  { value: 'retired', label: 'Retired' },
];

interface VehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle?: Vehicle | null;
}

export function VehicleDialog({ open, onOpenChange, vehicle }: VehicleDialogProps) {
  const { data: locations } = useLocations();
  const createVehicle = useCreateVehicle();
  const updateVehicle = useUpdateVehicle();
  const isEditing = !!vehicle;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registration_number: '',
      make: '',
      model: '',
      year: null,
      vehicle_type: null,
      capacity: null,
      fuel_type: null,
      ownership: 'owned',
      status: 'available',
      location_id: null,
      insurance_expiry: '',
      registration_expiry: '',
      last_service_date: '',
      next_service_due: '',
      odometer: null,
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        registration_number: vehicle.registration_number,
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year,
        vehicle_type: vehicle.vehicle_type,
        capacity: vehicle.capacity,
        fuel_type: vehicle.fuel_type,
        ownership: vehicle.ownership,
        status: vehicle.status,
        location_id: vehicle.location_id,
        insurance_expiry: vehicle.insurance_expiry || '',
        registration_expiry: vehicle.registration_expiry || '',
        last_service_date: vehicle.last_service_date || '',
        next_service_due: vehicle.next_service_due || '',
        odometer: vehicle.odometer,
        notes: vehicle.notes || '',
        is_active: vehicle.is_active,
      });
    } else {
      form.reset({
        registration_number: '',
        make: '',
        model: '',
        year: null,
        vehicle_type: null,
        capacity: null,
        fuel_type: null,
        ownership: 'owned',
        status: 'available',
        location_id: null,
        insurance_expiry: '',
        registration_expiry: '',
        last_service_date: '',
        next_service_due: '',
        odometer: null,
        notes: '',
        is_active: true,
      });
    }
  }, [vehicle, form]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      registration_number: data.registration_number.toUpperCase(),
      make: data.make || null,
      model: data.model || null,
      year: data.year || null,
      vehicle_type: data.vehicle_type || null,
      capacity: data.capacity || null,
      fuel_type: data.fuel_type || null,
      ownership: data.ownership || null,
      status: data.status || 'available',
      location_id: data.location_id || null,
      insurance_expiry: data.insurance_expiry || null,
      registration_expiry: data.registration_expiry || null,
      last_service_date: data.last_service_date || null,
      next_service_due: data.next_service_due || null,
      odometer: data.odometer || null,
      notes: data.notes || null,
      is_active: data.is_active,
    };

    if (isEditing && vehicle) {
      await updateVehicle.mutateAsync({ id: vehicle.id, ...payload });
    } else {
      await createVehicle.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createVehicle.isPending || updateVehicle.isPending;
  const activeLocations = locations?.filter(l => l.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Vehicle' : 'Add Vehicle'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="registration_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="ABC-1234" {...field} className="uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="make"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Make</FormLabel>
                    <FormControl>
                      <Input placeholder="Toyota" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                      <Input placeholder="Hiace" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="2023" 
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="vehicle_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicleTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacity (seats)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="8" 
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fuel_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fuel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {fuelTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownership"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ownership</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ownership" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ownershipTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Home Location</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {activeLocations?.map((loc) => (
                          <SelectItem key={loc.id} value={loc.id}>
                            {loc.name} ({loc.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Documents & Maintenance */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="insurance_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="registration_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Registration Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="last_service_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="next_service_due"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Service Due</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer (km)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="50000" 
                        {...field}
                        value={field.value ?? ''}
                        onChange={e => field.onChange(e.target.value ? Number(e.target.value) : null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditing && (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive vehicles won't be available for trips
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
