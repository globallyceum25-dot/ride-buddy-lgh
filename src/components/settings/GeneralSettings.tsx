import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSystemSettings, useUpdateSystemSetting } from '@/hooks/useSettings';
import { useLocations } from '@/hooks/useLocations';
import { Loader2, Save } from 'lucide-react';

const formSchema = z.object({
  organization_name: z.string().min(1, 'Organization name is required'),
  request_prefix: z.string().min(1, 'Request prefix is required'),
  default_location_id: z.string().optional(),
  date_format: z.string().default('DD/MM/YYYY'),
  published_domain: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export function GeneralSettings() {
  const { data: settings, isLoading: settingsLoading } = useSystemSettings();
  const { data: locations } = useLocations();
  const updateSetting = useUpdateSystemSetting();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      organization_name: '',
      request_prefix: 'TR-',
      default_location_id: '',
      date_format: 'DD/MM/YYYY',
      published_domain: '',
    },
  });

  useEffect(() => {
    if (settings) {
      const generalSettings = settings.find(s => s.key === 'general');
      if (generalSettings?.value) {
        const value = generalSettings.value as Record<string, string>;
        form.reset({
          organization_name: value.organization_name || '',
          request_prefix: value.request_prefix || 'TR-',
          default_location_id: value.default_location_id || '',
          date_format: value.date_format || 'DD/MM/YYYY',
          published_domain: value.published_domain || '',
        });
      }
    }
  }, [settings, form]);

  const onSubmit = async (values: FormValues) => {
    await updateSetting.mutateAsync({
      key: 'general',
      value: values as unknown as Record<string, unknown>,
    });
  };

  const activeLocations = locations?.filter(l => l.is_active) || [];

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Settings</CardTitle>
        <CardDescription>
          Configure general settings for your organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="organization_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., LGH Fleet Management" {...field} />
                  </FormControl>
                  <FormDescription>
                    This name appears in reports and notifications
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="request_prefix"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request Number Prefix</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., TR-" {...field} />
                  </FormControl>
                  <FormDescription>
                    Prefix used for auto-generated request numbers
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="default_location_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Location</FormLabel>
                  <Select 
                    onValueChange={(val) => field.onChange(val === "none" ? "" : val)} 
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select default location" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {activeLocations.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Pre-selected location for new requests
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date_format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date Format</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    How dates are displayed throughout the system
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="published_domain"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Published Domain</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., https://yourdomain.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The public domain used for shareable form links. Leave empty to use the default.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={updateSetting.isPending}>
              {updateSetting.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
