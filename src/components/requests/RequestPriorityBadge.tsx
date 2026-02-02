import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type RequestPriority = Database['public']['Enums']['request_priority'];

interface RequestPriorityBadgeProps {
  priority: RequestPriority;
}

const priorityConfig: Record<RequestPriority, { label: string; className: string }> = {
  normal: {
    label: 'Normal',
    className: 'bg-muted text-muted-foreground',
  },
  urgent: {
    label: 'Urgent',
    className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
  vip: {
    label: 'VIP',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
};

export function RequestPriorityBadge({ priority }: RequestPriorityBadgeProps) {
  const config = priorityConfig[priority];
  
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
