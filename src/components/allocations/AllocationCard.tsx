import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Car, Clock, MapPin, User, MoreHorizontal, Play, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Allocation } from '@/hooks/useAllocations';

interface AllocationCardProps {
  allocation: Allocation & {
    requester?: { full_name: string; department: string | null } | null;
    driverProfile?: { full_name: string } | null;
    stops?: { location: string; stop_order: number }[];
  };
  onStartTrip?: () => void;
  onCompleteTrip?: () => void;
  onCancel?: () => void;
  onDispatch?: () => void;
  isDragging?: boolean;
}

const priorityStyles: Record<string, string> = {
  vip: 'border-l-4 border-l-destructive',
  urgent: 'border-l-4 border-l-warning',
  normal: 'border-l-4 border-l-info',
};

export function AllocationCard({
  allocation,
  onStartTrip,
  onCompleteTrip,
  onCancel,
  onDispatch,
  isDragging = false,
}: AllocationCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: allocation.id,
    data: {
      type: 'allocation',
      allocation,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = allocation.request?.priority || 'normal';
  const isCurrentlyDragging = isDragging || isSortableDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card rounded-lg border shadow-sm p-3 cursor-grab active:cursor-grabbing',
        'transition-all duration-200 hover:shadow-md',
        priorityStyles[priority],
        isCurrentlyDragging && 'opacity-50 shadow-lg scale-105 rotate-2 z-50'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="font-semibold text-sm">
            {allocation.request?.request_number}
          </span>
          {priority === 'vip' && (
            <Badge variant="destructive" className="ml-2 text-xs">
              VIP
            </Badge>
          )}
          {priority === 'urgent' && (
            <Badge className="ml-2 text-xs bg-warning text-warning-foreground">
              Urgent
            </Badge>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {allocation.status === 'scheduled' && onDispatch && (
              <DropdownMenuItem onClick={onDispatch}>
                <Play className="h-4 w-4 mr-2" />
                Dispatch
              </DropdownMenuItem>
            )}
            {allocation.status === 'dispatched' && onStartTrip && (
              <DropdownMenuItem onClick={onStartTrip}>
                <Play className="h-4 w-4 mr-2" />
                Start Trip
              </DropdownMenuItem>
            )}
            {allocation.status === 'in_progress' && onCompleteTrip && (
              <DropdownMenuItem onClick={onCompleteTrip}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Trip
              </DropdownMenuItem>
            )}
            {allocation.status !== 'completed' && onCancel && (
              <DropdownMenuItem onClick={onCancel} className="text-destructive">
                <X className="h-4 w-4 mr-2" />
                Cancel
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Requester */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <User className="h-3 w-3" />
        <span className="truncate">
          {allocation.requester?.full_name || 'Unknown'}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-start gap-1.5 text-xs mb-2">
        <MapPin className="h-3 w-3 mt-0.5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">
            {allocation.request?.pickup_location}
          </p>
          <p className="truncate text-muted-foreground">
            → {allocation.request?.dropoff_location}
          </p>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>
          {format(new Date(allocation.scheduled_pickup), 'h:mm a')}
        </span>
      </div>

      {/* Vehicle & Driver */}
      <div className="flex items-center justify-between pt-2 border-t">
        <div className="flex items-center gap-1.5 text-xs">
          <Car className="h-3 w-3 text-muted-foreground" />
          <span className="font-medium truncate max-w-[100px]">
            {allocation.vehicle?.registration_number || 'No vehicle'}
          </span>
        </div>
        {allocation.driverProfile && (
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">
            {allocation.driverProfile.full_name}
          </span>
        )}
      </div>
    </div>
  );
}
