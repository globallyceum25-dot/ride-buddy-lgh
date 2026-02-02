import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Trash2 } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useCreateRequest, useApprovers } from '@/hooks/useRequests';
import { Database } from '@/integrations/supabase/types';

type TripType = Database['public']['Enums']['trip_type'];
type RequestPriority = Database['public']['Enums']['request_priority'];

const formSchema = z.object({
  trip_type: z.enum(['one_way', 'round_trip', 'multi_stop'] as const),
  pickup_location: z.string().min(1, 'Pickup location is required'),
  pickup_datetime: z.date({
    required_error: 'Pickup date and time is required',
  }),
  pickup_time: z.string().min(1, 'Pickup time is required'),
  dropoff_location: z.string().min(1, 'Dropoff location is required'),
  return_datetime: z.date().optional().nullable(),
  return_time: z.string().optional(),
  purpose: z.string().min(1, 'Purpose is required'),
  passenger_count: z.number().min(1, 'At least 1 passenger required'),
  priority: z.enum(['normal', 'urgent', 'vip'] as const),
  approver_id: z.string().min(1, 'Approver is required'),
  special_requirements: z.string().optional(),
  cost_center: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface Passenger {
  name: string;
  phone: string;
  is_primary: boolean;
}

interface RequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDialog({ open, onOpenChange }: RequestDialogProps) {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [stops, setStops] = useState<string[]>([]);
  const createRequest = useCreateRequest();
  const { data: approvers = [], isLoading: loadingApprovers } = useApprovers();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trip_type: 'one_way',
      pickup_location: '',
      pickup_time: '09:00',
      dropoff_location: '',
      return_time: '',
      purpose: '',
      passenger_count: 1,
      priority: 'normal',
      approver_id: '',
      special_requirements: '',
      cost_center: '',
      notes: '',
    },
  });

  const tripType = form.watch('trip_type');

  // Stops management
  const addStop = () => setStops([...stops, '']);
  const removeStop = (index: number) => setStops(stops.filter((_, i) => i !== index));
  const updateStop = (index: number, value: string) => {
    const updated = [...stops];
    updated[index] = value;
    setStops(updated);
  };

  const addPassenger = () => {
    setPassengers([...passengers, { name: '', phone: '', is_primary: passengers.length === 0 }]);
  };

  const removePassenger = (index: number) => {
    const updated = passengers.filter((_, i) => i !== index);
    if (updated.length > 0 && !updated.some(p => p.is_primary)) {
      updated[0].is_primary = true;
    }
    setPassengers(updated);
  };

  const updatePassenger = (index: number, field: keyof Passenger, value: string | boolean) => {
    const updated = [...passengers];
    updated[index] = { ...updated[index], [field]: value };
    
    if (field === 'is_primary' && value === true) {
      updated.forEach((p, i) => {
        if (i !== index) p.is_primary = false;
      });
    }
    
    setPassengers(updated);
  };

  const combineDateTime = (date: Date, time: string): string => {
    const [hours, minutes] = time.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  };

  const onSubmit = async (values: FormValues) => {
    const pickupDatetime = combineDateTime(values.pickup_datetime, values.pickup_time);
    
    let returnDatetime: string | undefined;
    if (values.trip_type === 'round_trip' && values.return_datetime && values.return_time) {
      returnDatetime = combineDateTime(values.return_datetime, values.return_time);
    }

    await createRequest.mutateAsync({
      trip_type: values.trip_type,
      pickup_location: values.pickup_location,
      pickup_datetime: pickupDatetime,
      dropoff_location: values.dropoff_location,
      return_datetime: returnDatetime || null,
      purpose: values.purpose,
      passenger_count: values.passenger_count,
      priority: values.priority,
      approver_id: values.approver_id,
      special_requirements: values.special_requirements || null,
      cost_center: values.cost_center || null,
      notes: values.notes || null,
      passengers: passengers.filter(p => p.name.trim()),
      stops: values.trip_type === 'multi_stop' ? stops.filter(s => s.trim()) : [],
    });

    form.reset();
    setPassengers([]);
    setStops([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Travel Request</DialogTitle>
          <DialogDescription>
            Submit a new travel request for approval.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Trip Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Trip Details</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="trip_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select trip type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one_way">One Way</SelectItem>
                          <SelectItem value="round_trip">Round Trip</SelectItem>
                          <SelectItem value="multi_stop">Multi Stop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="vip">VIP</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="pickup_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter pickup address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="pickup_datetime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Pickup Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickup_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pickup Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Intermediate Stops Section - shown only for multi_stop */}
              {tripType === 'multi_stop' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Intermediate Stops</h4>
                    <Button type="button" variant="outline" size="sm" onClick={addStop}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Stop
                    </Button>
                  </div>
                  {stops.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No intermediate stops added. Click "Add Stop" to add locations between pickup and final destination.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stops.map((stop, index) => (
                        <div key={index} className="flex gap-2 items-center">
                          <span className="text-sm text-muted-foreground w-16">Stop {index + 1}</span>
                          <Input
                            placeholder={`Enter stop ${index + 1} location`}
                            value={stop}
                            onChange={(e) => updateStop(index, e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeStop(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="dropoff_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{tripType === 'multi_stop' ? 'Final Destination' : 'Dropoff Location'}</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter destination address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {tripType === 'round_trip' && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="return_datetime"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Return Date</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  'w-full pl-3 text-left font-normal',
                                  !field.value && 'text-muted-foreground'
                                )}
                              >
                                {field.value ? (
                                  format(field.value, 'PPP')
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value || undefined}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="return_time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Return Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>

            {/* Passengers Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Passengers</h3>
                <Button type="button" variant="outline" size="sm" onClick={addPassenger}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Passenger
                </Button>
              </div>

              <FormField
                control={form.control}
                name="passenger_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Passengers</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {passengers.map((passenger, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <FormLabel className={index > 0 ? 'sr-only' : ''}>Name</FormLabel>
                    <Input
                      placeholder="Passenger name"
                      value={passenger.name}
                      onChange={(e) => updatePassenger(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <FormLabel className={index > 0 ? 'sr-only' : ''}>Phone</FormLabel>
                    <Input
                      placeholder="Phone number"
                      value={passenger.phone}
                      onChange={(e) => updatePassenger(index, 'phone', e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePassenger(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Request Details Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Request Details</h3>

              <FormField
                control={form.control}
                name="purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purpose of Travel</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the business purpose for this travel"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="approver_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Approver</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an approver" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingApprovers ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
                        ) : approvers.length === 0 ? (
                          <div className="px-2 py-1.5 text-sm text-muted-foreground">No approvers available</div>
                        ) : (
                          approvers.map((approver) => (
                            <SelectItem key={approver.user_id} value={approver.user_id}>
                              {approver.full_name} ({approver.email})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select a manager to approve this request
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cost_center"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Center</FormLabel>
                      <FormControl>
                        <Input placeholder="Cost center code" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="special_requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Special Requirements</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Accessibility needs, luggage, equipment, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any other information"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createRequest.isPending}>
                {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
