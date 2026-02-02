import { Badge } from '@/components/ui/badge';
import { Database } from '@/integrations/supabase/types';

type RequestStatus = Database['public']['Enums']['request_status'];

interface RequestStatusBadgeProps {
  status: RequestStatus;
}

const statusConfig: Record<RequestStatus, { label: string; className: string }> = {
  draft: {
    label: 'Draft',
    className: 'bg-muted text-muted-foreground',
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
  allocated: {
    label: 'Allocated',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  in_progress: {
    label: 'In Progress',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  completed: {
    label: 'Completed',
    className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
};

export function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge variant="secondary" className={config.className}>
      {config.label}
    </Badge>
  );
}
