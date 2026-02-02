import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type StatusType = 
  | 'available' | 'in_trip' | 'maintenance' | 'breakdown' | 'retired'
  | 'on_trip' | 'on_leave' | 'inactive'
  | 'active' | 'pending' | 'expired';

interface StatusBadgeProps {
  status: StatusType | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Vehicle statuses
  available: { label: 'Available', className: 'bg-success/20 text-success border-success/30' },
  in_trip: { label: 'In Trip', className: 'bg-info/20 text-info border-info/30' },
  maintenance: { label: 'Maintenance', className: 'bg-warning/20 text-warning border-warning/30' },
  breakdown: { label: 'Breakdown', className: 'bg-destructive/20 text-destructive border-destructive/30' },
  retired: { label: 'Retired', className: 'bg-muted/20 text-muted-foreground border-muted/30' },
  
  // Driver statuses
  on_trip: { label: 'On Trip', className: 'bg-info/20 text-info border-info/30' },
  on_leave: { label: 'On Leave', className: 'bg-warning/20 text-warning border-warning/30' },
  inactive: { label: 'Inactive', className: 'bg-muted/20 text-muted-foreground border-muted/30' },
  
  // Generic statuses
  active: { label: 'Active', className: 'bg-success/20 text-success border-success/30' },
  pending: { label: 'Pending', className: 'bg-warning/20 text-warning border-warning/30' },
  expired: { label: 'Expired', className: 'bg-destructive/20 text-destructive border-destructive/30' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { 
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 
    className: 'bg-secondary/20 text-secondary-foreground' 
  };

  return (
    <Badge 
      variant="outline" 
      className={cn('font-medium', config.className, className)}
    >
      {config.label}
    </Badge>
  );
}

export function ExpiryBadge({ date }: { date: string | null | undefined }) {
  if (!date) return null;
  
  const expiryDate = new Date(date);
  const today = new Date();
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry < 0) {
    return <StatusBadge status="expired" />;
  }
  
  if (daysUntilExpiry <= 30) {
    return (
      <Badge variant="outline" className="bg-warning/20 text-warning border-warning/30">
        Expires in {daysUntilExpiry} days
      </Badge>
    );
  }
  
  return null;
}
