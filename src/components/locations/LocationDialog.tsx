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
import { Location, useCreateLocation, useUpdateLocation } from '@/hooks/useLocations';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required').max(10, 'Code must be 10 characters or less'),
  address: z.string().optional(),
  city: z.string().optional(),
  gps_lat: z.coerce.number().optional().nullable(),
  gps_lng: z.coerce.number().optional().nullable(),
  operating_hours_start: z.string().optional(),
  operating_hours_end: z.string().optional(),
  is_active: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

interface LocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location?: Location | null;
}

export function LocationDialog({ open, onOpenChange, location }: LocationDialogProps) {
  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();
  const isEditing = !!location;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      city: '',
      gps_lat: null,
      gps_lng: null,
      operating_hours_start: '',
      operating_hours_end: '',
      is_active: true,
    },
  });

  useEffect(() => {
    if (location) {
      form.reset({
        name: location.name,
        code: location.code,
        address: location.address || '',
        city: location.city || '',
        gps_lat: location.gps_lat ? Number(location.gps_lat) : null,
        gps_lng: location.gps_lng ? Number(location.gps_lng) : null,
        operating_hours_start: location.operating_hours_start || '',
        operating_hours_end: location.operating_hours_end || '',
        is_active: location.is_active,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        address: '',
        city: '',
        gps_lat: null,
        gps_lng: null,
        operating_hours_start: '',
        operating_hours_end: '',
        is_active: true,
      });
    }
  }, [location, form]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      code: data.code.toUpperCase(),
      address: data.address || null,
      city: data.city || null,
      gps_lat: data.gps_lat || null,
      gps_lng: data.gps_lng || null,
      operating_hours_start: data.operating_hours_start || null,
      operating_hours_end: data.operating_hours_end || null,
      is_active: data.is_active,
    };

    if (isEditing && location) {
      await updateLocation.mutateAsync({ id: location.id, ...payload });
    } else {
      await createLocation.mutateAsync(payload);
    }
    onOpenChange(false);
  };

  const isLoading = createLocation.isPending || updateLocation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Location' : 'Add Location'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Head Office" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code *</FormLabel>
                    <FormControl>
                      <Input placeholder="HO" {...field} className="uppercase" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Input placeholder="Colombo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gps_lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="6.9271" 
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
                name="gps_lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitude</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="any" 
                        placeholder="79.8612" 
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="operating_hours_start"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours Start</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="operating_hours_end"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours End</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEditing && (
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Inactive locations won't be available for selection
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
