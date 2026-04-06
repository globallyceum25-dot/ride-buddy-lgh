import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { useCreateUser, AppRole } from '@/hooks/useUsers';
import { useLocations } from '@/hooks/useLocations';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.object({
  identifier_type: z.literal('email'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  full_name: z.string().min(1, 'Full name is required'),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  cost_center: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  primary_location_id: z.string().optional(),
});

const phoneSchema = z.object({
  identifier_type: z.literal('phone'),
  phone: z.string().min(10, 'Phone number is required (E.164 format, e.g. +94771234567)'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  full_name: z.string().min(1, 'Full name is required'),
  employee_id: z.string().optional(),
  department: z.string().optional(),
  cost_center: z.string().optional(),
  roles: z.array(z.string()).min(1, 'At least one role is required'),
  primary_location_id: z.string().optional(),
});

const formSchema = z.discriminatedUnion('identifier_type', [emailSchema, phoneSchema]);

type FormValues = z.infer<typeof formSchema>;

const ALL_ROLES: { value: AppRole; label: string; description: string }[] = [
  { value: 'staff', label: 'Staff', description: 'Can request rides and view own trips' },
  { value: 'driver', label: 'Driver', description: 'Can be assigned to drive trips' },
  { value: 'approver', label: 'Approver', description: 'Can approve or reject trip requests' },
  { value: 'location_coordinator', label: 'Location Coordinator', description: 'Manages vehicles and drivers at a location' },
  { value: 'group_admin', label: 'Group Admin', description: 'Full system access' },
];

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const createUser = useCreateUser();
  const { data: locations } = useLocations();
  const { toast } = useToast();
  const [identifierType, setIdentifierType] = useState<'email' | 'phone'>('email');
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [createdUserName, setCreatedUserName] = useState('');
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      identifier_type: 'email',
      email: '',
      full_name: '',
      phone: '',
      employee_id: '',
      department: '',
      cost_center: '',
      roles: ['staff'],
      primary_location_id: '',
    },
  });

  const handleIdentifierTypeChange = (value: 'email' | 'phone') => {
    setIdentifierType(value);
    form.setValue('identifier_type', value);
    form.clearErrors();
  };

  const handleCopyPassword = async () => {
    if (generatedPassword) {
      await navigator.clipboard.writeText(generatedPassword);
      toast({ title: 'Copied', description: 'Password copied to clipboard' });
    }
  };

  const handleClosePasswordDialog = () => {
    setGeneratedPassword(null);
    setShowPassword(false);
    setCreatedUserName('');
  };

  const onSubmit = async (values: FormValues) => {
    try {
      const result = await createUser.mutateAsync({
        identifier_type: values.identifier_type,
        email: values.email || undefined,
        full_name: values.full_name,
        phone: values.phone,
        employee_id: values.employee_id,
        department: values.department,
        cost_center: values.cost_center,
        roles: values.roles as AppRole[],
        primary_location_id: values.primary_location_id || undefined,
      });
      
      // Show generated password
      if (result?.temporary_password) {
        setGeneratedPassword(result.temporary_password);
        setCreatedUserName(values.full_name);
      }
      
      form.reset();
      setIdentifierType('email');
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Identifier Type Toggle */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Create by</Label>
                <RadioGroup
                  value={identifierType}
                  onValueChange={(v) => handleIdentifierTypeChange(v as 'email' | 'phone')}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="email" id="id-email" />
                    <Label htmlFor="id-email" className="cursor-pointer">Email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="phone" id="id-phone" />
                    <Label htmlFor="id-phone" className="cursor-pointer">Phone</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {identifierType === 'email' ? (
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="user@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <>
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="+94771234567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Email (optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="user@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {identifierType === 'email' && (
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input placeholder="EMP001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl>
                        <Input placeholder="Operations" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost_center"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost Center</FormLabel>
                      <FormControl>
                        <Input placeholder="CC001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primary_location_id"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Primary Location</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a location" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {locations?.filter(l => l.is_active).map(location => (
                            <SelectItem key={location.id} value={location.id}>
                              {location.name} ({location.code})
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
                name="roles"
                render={() => (
                  <FormItem>
                    <FormLabel>Roles *</FormLabel>
                    <div className="space-y-2">
                      {ALL_ROLES.map((role) => (
                        <FormField
                          key={role.value}
                          control={form.control}
                          name="roles"
                          render={({ field }) => (
                            <FormItem className="flex items-start space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(role.value)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), role.value]
                                      : field.value?.filter((v) => v !== role.value);
                                    field.onChange(newValue);
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-0.5">
                                <span className="text-sm font-medium">{role.label}</span>
                                <p className="text-xs text-muted-foreground">{role.description}</p>
                              </div>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-xs text-muted-foreground">
                A secure temporary password will be auto-generated and shown after creation.
              </p>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create User
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Password Display Dialog */}
      <Dialog open={!!generatedPassword} onOpenChange={(open) => { if (!open) handleClosePasswordDialog(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              User Created Successfully
            </DialogTitle>
            <DialogDescription>
              A temporary password has been generated for <strong>{createdUserName}</strong>. 
              Copy it now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Label className="text-sm font-medium">Temporary Password</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted px-3 py-2 font-mono text-sm">
                {showPassword ? generatedPassword : '••••••••••••••••'}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyPassword}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-destructive font-medium">
              ⚠ Share this password securely. The user should change it on first login.
            </p>
          </div>

          <DialogFooter>
            <Button onClick={handleClosePasswordDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}