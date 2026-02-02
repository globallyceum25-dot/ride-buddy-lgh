import { Badge } from '@/components/ui/badge';
import { AllocationStatus, PoolStatus } from '@/hooks/useAllocations';

interface AllocationStatusBadgeProps {
  status: AllocationStatus | PoolStatus;
}

export function AllocationStatusBadge({ status }: AllocationStatusBadgeProps) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
    scheduled: { variant: 'outline', label: 'Scheduled' },
    pending: { variant: 'outline', label: 'Pending' },
    confirmed: { variant: 'secondary', label: 'Confirmed' },
    dispatched: { variant: 'secondary', label: 'Dispatched' },
    in_progress: { variant: 'default', label: 'In Progress' },
    completed: { variant: 'default', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  };

  const config = variants[status] || { variant: 'outline', label: status };

  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
