import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Car, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { SortableStops } from '@/components/requests/SortableStops';
import { LocationAutocomplete, Coordinates } from '@/components/shared/LocationAutocomplete';
import { MileageDisplay } from '@/components/requests/MileageDisplay';
import { useDistanceCalculation } from '@/hooks/useDistanceCalculation';
import { usePublicFormLink, useSubmitPublicRequest } from '@/hooks/usePublicRequest';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  guest_name: z.string().min(2, 'Name must be at least 2 characters'),
  guest_employee_id: z.string().min(1, 'Employee ID is required'),
  guest_email: z.string().email('Please enter a valid email'),
  guest_phone: z.string().min(10, 'Phone number is required (min 10 digits)'),
  trip_type: z.enum(['one_way', 'round_trip', 'multi_stop']),
  pickup_location: z.string().min(3, 'Pickup location is required'),
  dropoff_location: z.string().min(3, 'Destination is required'),
  pickup_date: z.date({ required_error: 'Pickup date is required' }),
  pickup_time: z.string().min(1, 'Pickup time is required'),
  return_date: z.date().optional(),
  return_time: z.string().optional(),
  purpose: z.string().min(5, 'Please provide a purpose for your trip'),
  passenger_count: z.number().min(1).max(50),
  special_requirements: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function PublicRequestForm() {
  const { token } = useParams<{ token: string }>();
  const { data: formLink, isLoading, error } = usePublicFormLink(token);
  const submitMutation = useSubmitPublicRequest();
  const [submitted, setSubmitted] = useState(false);
  const [requestNumber, setRequestNumber] = useState<string>('');
  const [stops, setStops] = useState<string[]>([]);
  const [pickupCoords, setPickupCoords] = useState<Coordinates | null>(null);
  const [dropoffCoords, setDropoffCoords] = useState<Coordinates | null>(null);
  const [stopCoords, setStopCoords] = useState<(Coordinates | null)[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      guest_name: '',
      guest_employee_id: '',
      guest_email: '',
      guest_phone: '',
      trip_type: 'one_way',
      pickup_location: '',
      dropoff_location: '',
      pickup_time: '09:00',
      return_time: '',
      purpose: '',
      passenger_count: 1,
      special_requirements: '',
      notes: '',
    },
  });

  const tripType = form.watch('trip_type');

  const waypoints = useMemo(() => {
    if (tripType === 'multi_stop') {
      return [pickupCoords, ...stopCoords, dropoffCoords];
    }
    return [pickupCoords, dropoffCoords];
  }, [pickupCoords, dropoffCoords, stopCoords, tripType]);

  const { distanceKm, durationMinutes, isLoading: distanceLoading } = useDistanceCalculation(waypoints);

  const handleStopsChange = (newStops: string[], newCoords?: (Coordinates | null)[]) => {
    setStops(newStops);
    if (newCoords) setStopCoords(newCoords);
  };

  const onSubmit = async (values: FormValues) => {
    if (!token) return;

    const pickupDatetime = new Date(values.pickup_date);
    const [hours, minutes] = values.pickup_time.split(':');
    pickupDatetime.setHours(parseInt(hours), parseInt(minutes));

    let returnDatetime: string | undefined;
    if (values.trip_type === 'round_trip' && values.return_date && values.return_time) {
      const returnDt = new Date(values.return_date);
      const [rHours, rMinutes] = values.return_time.split(':');
      returnDt.setHours(parseInt(rHours), parseInt(rMinutes));
      returnDatetime = returnDt.toISOString();
    }

    try {
      const result = await submitMutation.mutateAsync({
        token,
        guestInfo: {
          name: values.guest_name,
          employee_id: values.guest_employee_id,
          email: values.guest_email,
          phone: values.guest_phone,
        },
        requestData: {
          pickup_location: values.pickup_location,
          dropoff_location: values.dropoff_location,
          pickup_datetime: pickupDatetime.toISOString(),
          return_datetime: returnDatetime,
          trip_type: values.trip_type,
          passenger_count: values.passenger_count,
          purpose: values.purpose,
          special_requirements: values.special_requirements,
          notes: values.notes,
          stops: values.trip_type === 'multi_stop' ? stops.filter(s => s.trim()) : [],
          estimated_distance_km: distanceKm,
        },
      });
      setRequestNumber(result.requestNumber);
      setSubmitted(true);
      setStops([]);
    } catch (e) {
      // Error handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading form...</span>
        </div>
      </div>
    );
  }

  if (error || !formLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-2" />
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              {error?.message || 'This form link is invalid, expired, or has been deactivated.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-primary mx-auto mb-2" />
            <CardTitle>Request Submitted!</CardTitle>
            <CardDescription>
              Your travel request <strong>{requestNumber}</strong> has been submitted successfully.
              You will receive updates via email at the address you provided.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Car className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold">Travel Request Form</h1>
          </div>
          {formLink.description && (
            <p className="text-muted-foreground">{formLink.description}</p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Guest Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guest_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guest_employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Employee ID *</FormLabel>
                        <FormControl>
                          <Input placeholder="EMP001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="guest_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="guest_phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 234 567 8900" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Trip Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Trip Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="trip_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Trip Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickup_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pickup Location *</FormLabel>
                        <FormControl>
                          <LocationAutocomplete
                            value={field.value}
                            onChange={(val, coords) => {
                              field.onChange(val);
                              setPickupCoords(coords);
                            }}
                            placeholder="Search pickup address"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="dropoff_location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tripType === 'multi_stop' ? 'Final Destination *' : 'Destination *'}</FormLabel>
                        <FormControl>
                          <LocationAutocomplete
                            value={field.value}
                            onChange={(val, coords) => {
                              field.onChange(val);
                              setDropoffCoords(coords);
                            }}
                            placeholder="Search destination"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Intermediate Stops */}
                {tripType === 'multi_stop' && (
                  <SortableStops
                    stops={stops}
                    onStopsChange={handleStopsChange}
                    stopCoords={stopCoords}
                  />
                )}

                {/* Mileage Display */}
                <MileageDisplay
                  distanceKm={distanceKm}
                  durationMinutes={durationMinutes}
                  isLoading={distanceLoading}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="pickup_date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Pickup Date *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? format(field.value, "PPP") : "Select date"}
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
                        <FormLabel>Pickup Time *</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {tripType === 'round_trip' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="return_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Return Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? format(field.value, "PPP") : "Select date"}
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

                <FormField
                  control={form.control}
                  name="purpose"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purpose *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the purpose of your trip" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          max={50}
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="special_requirements"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Special Requirements</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any special requirements (wheelchair access, child seats, etc.)" 
                          className="resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full" 
              size="lg"
              disabled={submitMutation.isPending}
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
