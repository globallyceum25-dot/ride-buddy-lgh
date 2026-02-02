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
  FormDescription,
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
  Driver, 
  useCreateDriver, 
  useUpdateDriver,
  useDriversWithRole,
  DriverStatus,
  LicenseType,
} from '@/hooks/useDrivers';
import { useLocations } from '@/hooks/useLocations';
import { useEffect } from 'react';

const formSchema = z.object({
  user_id: z.string().min(1, 'Please select a user'),
  license_number: z.string().min(1, 'License number is required'),
  license_type: z.enum(['light', 'heavy', 'commercial']).optional().nullable(),
  license_expiry: z.string().optional(),
  status: z.enum(['available', 'on_trip', 'on_leave', 'inactive']).optional().nullable(),
  location_id: z.string().optional().nullable(),
  is_floating: z.boolean().default(false),
  emergency_contact: z.string().optional(),
  blood_group: z.string().optional(),
  date_joined: z.string().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

const licenseTypes: { value: LicenseType; label: string }[] = [
  { value: 'light', label: 'Light Vehicle' },
  { value: 'heavy', label: 'Heavy Vehicle' },
  { value: 'commercial', label: 'Commercial' },
];

const statusTypes: { value: DriverStatus; label: string }[] = [
  { value: 'available', label: 'Available' },
  { value: 'on_trip', label: 'On Trip' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
];

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

interface DriverDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driver?: Driver | null;
}

export function DriverDialog({ open, onOpenChange, driver }: DriverDialogProps) {
  const { data: locations } = useLocations();
  const { data: eligibleUsers } = useDriversWithRole();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const isEditing = !!driver;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: '',
      license_number: '',
      license_type: null,
      license_expiry: '',
      status: 'available',
      location_id: null,
      is_floating: false,
      emergency_contact: '',
      blood_group: '',
      date_joined: '',
      notes: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (driver) {
      form.reset({
        user_id: driver.user_id,
        license_number: driver.license_number,
        license_type: driver.license_type,
        license_expiry: driver.license_expiry || '',
        status: driver.status,
        location_id: driver.location_id,
        is_floating: driver.is_floating || false,
        emergency_contact: driver.emergency_contact || '',
        blood_group: driver.blood_group || '',
        date_joined: driver.date_joined || '',
        notes: driver.notes || '',
        is_active: driver.is_active,
      });
    } else {
      form.reset({
        user_id: '',
        license_number: '',
        license_type: null,
        license_expiry: '',
        status: 'available',
        location_id: null,
        is_floating: false,
        emergency_contact: '',
        blood_group: '',
        date_joined: '',
        notes: '',
        is_active: true,
      });
    }
  }, [driver, form]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      user_id: data.user_id,
      license_number: data.license_number,
      license_type: data.license_type || null,
      license_expiry: data.license_expiry || null,
      status: data.status || 'available',
      location_id: data.location_id || null,
      is_floating: data.is_floating,
      emergency_contact: data.emergency_contact || null,
      blood_group: data.blood_group || null,
      date_joined: data.date_joined || null,
      notes: data.notes || null,
      is_active: data.is_active,
    };

    if (isEditing && driver) {
      await updateDriver.mutateAsync({ id: driver.id, ...payload });
    } else {
      await createDriver.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createDriver.isPending || updateDriver.isPending;
  const activeLocations = locations?.filter(l => l.is_active);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Driver' : 'Add Driver'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* User Selection - Only for new drivers */}
            {!isEditing ? (
              <FormField
                control={form.control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>User Account *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user with driver role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {eligibleUsers?.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No eligible users found. Assign the "Driver" role to users first.
                          </div>
                        ) : (
                          eligibleUsers?.map((user) => (
                            <SelectItem key={user.user_id} value={user.user_id}>
                              {user.full_name} ({user.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Only users with the "Driver" role who don't have a driver profile yet are shown.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Driver</p>
                <p className="font-medium">{driver?.profile?.full_name}</p>
                <p className="text-sm text-muted-foreground">{driver?.profile?.email}</p>
              </div>
            )}

            {/* License Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="license_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Number *</FormLabel>
                    <FormControl>
                      <Input placeholder="DL-123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="license_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {licenseTypes.map((type) => (
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
                name="license_expiry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License Expiry</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
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

            {/* Location & Assignment */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="location_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assigned Location</FormLabel>
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

              <FormField
                control={form.control}
                name="date_joined"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Joined</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_floating"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Floating Driver</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Can be assigned to any location
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

            {/* Personal Info */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="emergency_contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Emergency Contact</FormLabel>
                    <FormControl>
                      <Input placeholder="+94 77 123 4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="blood_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blood Group</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select blood group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {bloodGroups.map((bg) => (
                          <SelectItem key={bg} value={bg}>
                            {bg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                        Inactive drivers won't be available for trips
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
