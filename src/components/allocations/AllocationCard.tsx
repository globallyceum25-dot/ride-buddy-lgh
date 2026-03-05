import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { Car, Clock, MapPin, User, MoreHorizontal, Play, CheckCircle, X, Users, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Allocation, HAILING_SERVICE_LABELS } from '@/hooks/useAllocations';

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
  /** When true, card is rendered inside a PoolGroup - hides individual pool banner and uses reduced spacing */
  isGrouped?: boolean;
  /** When true, this card's pool is being hovered - shows highlight effect */
  isPoolHighlighted?: boolean;
  /** Callback to set the hovered pool ID */
  onPoolHover?: (poolId: string | null) => void;
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
  isGrouped = false,
  isPoolHighlighted = false,
  onPoolHover,
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
  const isPooled = !!allocation.pool_id;

  const handleMouseEnter = () => {
    if (isPooled && onPoolHover) {
      onPoolHover(allocation.pool_id!);
    }
  };

  const handleMouseLeave = () => {
    if (isPooled && onPoolHover) {
      onPoolHover(null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'bg-card rounded-lg border shadow-sm cursor-grab active:cursor-grabbing',
        'transition-all duration-200 hover:shadow-md',
        priorityStyles[priority],
        // Grouped cards have reduced padding, standalone pooled cards have accent styling
        isGrouped ? 'p-2' : 'p-3',
        isPooled && !isGrouped && 'ring-2 ring-accent ring-offset-1 bg-gradient-to-br from-accent/30 to-card',
        isCurrentlyDragging && 'opacity-50 shadow-lg scale-105 rotate-2 z-50',
        // Pool highlight effect
        isPoolHighlighted && !isCurrentlyDragging && 'ring-2 ring-primary shadow-lg bg-primary/5'
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...attributes}
      {...listeners}
    >
      {/* Pooled Indicator Banner - only show for standalone pooled cards, not grouped ones */}
      {isPooled && !isGrouped && (
        <div className="flex items-center gap-1.5 mb-2 -mt-1 -mx-1 px-2 py-1 bg-accent rounded-t text-accent-foreground text-xs font-medium">
          <Users className="h-3 w-3" />
          <span>Pooled Trip</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center flex-wrap gap-1">
          <span className="font-semibold text-sm">
            {allocation.request?.request_number}
          </span>
          {priority === 'vip' && (
            <Badge variant="destructive" className="text-xs">
              VIP
            </Badge>
          )}
          {priority === 'urgent' && (
            <Badge className="text-xs bg-warning text-warning-foreground">
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

      {/* Passenger Count */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Users className="h-3 w-3" />
        <span>
          {allocation.request?.passenger_count || 1} passenger{(allocation.request?.passenger_count || 1) !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-start gap-1.5 text-xs mb-2">
        <MapPin className="h-3 w-3 mt-0.5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="truncate font-medium">
            {allocation.request?.pickup_location}
          </p>
          {allocation.stops && allocation.stops.length > 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="truncate text-muted-foreground cursor-help">
                  <span className="inline-flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      +{allocation.stops.length} stops
                    </Badge>
                  </span>
                  → {allocation.request?.dropoff_location}
                </p>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[200px]">
                <p className="font-medium mb-1">Intermediate stops:</p>
                <ol className="list-decimal list-inside text-xs space-y-0.5">
                  {allocation.stops.map((stop, idx) => (
                    <li key={idx} className="truncate">{stop.location}</li>
                  ))}
                </ol>
              </TooltipContent>
            </Tooltip>
          ) : (
            <p className="truncate text-muted-foreground">
              → {allocation.request?.dropoff_location}
            </p>
          )}
        </div>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
        <Clock className="h-3 w-3" />
        <span>
          {format(new Date(allocation.scheduled_pickup), 'h:mm a')}
        </span>
      </div>

      {/* Vehicle & Driver / Hailing Service */}
      <div className="flex items-center justify-between pt-2 border-t">
        {allocation.hailing_service ? (
          <div className="flex items-center gap-1.5 text-xs">
            <Navigation className="h-3 w-3 text-muted-foreground" />
            <Badge variant="secondary" className="text-xs">
              {HAILING_SERVICE_LABELS[allocation.hailing_service]}
            </Badge>
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
