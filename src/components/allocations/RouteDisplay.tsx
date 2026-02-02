import { Circle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Stop {
  id: string;
  location: string;
  stop_order: number;
}

interface RouteDisplayProps {
  pickup: string;
  destination: string;
  stops?: Stop[];
  maxWidth?: string;
}

export function RouteDisplay({ pickup, destination, stops = [], maxWidth = 'max-w-[120px]' }: RouteDisplayProps) {
  const hasStops = stops.length > 0;
  
  if (!hasStops) {
    return (
      <div className="text-sm">
        <p className={`truncate ${maxWidth}`}>{pickup}</p>
        <p className={`text-muted-foreground truncate ${maxWidth}`}>
          → {destination}
        </p>
      </div>
    );
  }

  const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
  const fullRoute = [pickup, ...sortedStops.map(s => s.location), destination];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="text-sm cursor-help">
          <p className={`truncate ${maxWidth}`}>{pickup}</p>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>→</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              +{stops.length} stop{stops.length > 1 ? 's' : ''}
            </span>
            <span>→</span>
          </div>
          <p className={`text-muted-foreground truncate ${maxWidth}`}>
            {destination}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-medium text-xs text-muted-foreground uppercase">Full Route</p>
          {fullRoute.map((location, index) => (
            <div key={index} className="flex items-center gap-2">
              <Circle className={`h-2 w-2 ${index === 0 ? 'fill-primary text-primary' : index === fullRoute.length - 1 ? 'fill-green-500 text-green-500' : 'fill-muted-foreground text-muted-foreground'}`} />
              <span className="text-sm">{location}</span>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
