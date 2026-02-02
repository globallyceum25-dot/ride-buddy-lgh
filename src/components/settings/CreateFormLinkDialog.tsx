import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useCreateFormLink } from '@/hooks/usePublicRequest';
import { useUsers } from '@/hooks/useUsers';
import { useDepartments } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  department_id: z.string().optional(),
  default_approver_id: z.string().optional(),
  expires_at: z.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateFormLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateFormLinkDialog({ open, onOpenChange }: CreateFormLinkDialogProps) {
  const createMutation = useCreateFormLink();
  const queryClient = useQueryClient();
  const { data: users } = useUsers();
  const { data: departments } = useDepartments();

  // Filter users with approver or admin roles
  const approvers = users?.filter(user => 
    user.roles?.some(role => ['approver', 'group_admin', 'location_coordinator'].includes(role))
  ) || [];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      department_id: undefined,
      default_approver_id: undefined,
      expires_at: undefined,
    },
  });

  const onSubmit = async (values: FormValues) => {
    await createMutation.mutateAsync({
      name: values.name,
      description: values.description || undefined,
      department_id: values.department_id === 'none' ? undefined : values.department_id,
      default_approver_id: values.default_approver_id === 'none' ? undefined : values.default_approver_id,
      expires_at: values.expires_at?.toISOString(),
    });
    queryClient.invalidateQueries({ queryKey: ['form-links'] });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Shareable Form Link</DialogTitle>
          <DialogDescription>
            Create a public link that external users can use to submit travel requests without logging in.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HR Department Requests" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name to identify this form link.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Optional description shown to users when they open the form" 
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
              name="department_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No department</SelectItem>
                      {departments?.filter(d => d.is_active).map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>
                          {dept.name} {dept.code && `(${dept.code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Associate this form link with a department.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_approver_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Approver</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === "none" ? undefined : val)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an approver" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No default approver</SelectItem>
                      {approvers.map((user) => (
                        <SelectItem key={user.user_id} value={user.user_id}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Requests submitted through this link will be assigned to this approver.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expires_at"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiry Date</FormLabel>
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
                          {field.value ? format(field.value, "PPP") : "No expiry"}
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
                  <FormDescription>
                    Leave empty for no expiry, or set a date after which the link becomes inactive.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Link'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
