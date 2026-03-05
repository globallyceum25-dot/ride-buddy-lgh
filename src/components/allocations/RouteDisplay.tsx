import { Circle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Stop {
  id: string;
  location: string;
  location_name?: string | null;
  stop_order: number;
}

interface RouteDisplayProps {
  pickup: string;
  pickupName?: string | null;
  destination: string;
  destinationName?: string | null;
  stops?: Stop[];
  maxWidth?: string;
}

export function RouteDisplay({ pickup, pickupName, destination, destinationName, stops = [], maxWidth = 'max-w-[120px]' }: RouteDisplayProps) {
  const hasStops = stops.length > 0;
  const displayPickup = pickupName || pickup;
  const displayDestination = destinationName || destination;
  
  if (!hasStops) {
    return (
      <div className="text-sm">
        <p className={`truncate ${maxWidth}`} title={pickup}>{displayPickup}</p>
        <p className={`text-muted-foreground truncate ${maxWidth}`} title={destination}>
          → {displayDestination}
        </p>
      </div>
    );
  }

  const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
  const fullRoute = [
    { name: pickupName, address: pickup },
    ...sortedStops.map(s => ({ name: s.location_name, address: s.location })),
    { name: destinationName, address: destination },
  ];
  
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="text-sm cursor-help">
          <p className={`truncate ${maxWidth}`} title={pickup}>{displayPickup}</p>
          <div className="flex items-center gap-1 text-muted-foreground">
            <span>→</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
              +{stops.length} stop{stops.length > 1 ? 's' : ''}
            </span>
            <span>→</span>
          </div>
          <p className={`text-muted-foreground truncate ${maxWidth}`} title={destination}>
            {displayDestination}
          </p>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="max-w-xs">
        <div className="space-y-1.5">
          <p className="font-medium text-xs text-muted-foreground uppercase">Full Route</p>
          {fullRoute.map((loc, index) => (
            <div key={index} className="flex items-center gap-2">
              <Circle className={`h-2 w-2 ${index === 0 ? 'fill-primary text-primary' : index === fullRoute.length - 1 ? 'fill-green-500 text-green-500' : 'fill-muted-foreground text-muted-foreground'}`} />
              <div>
                {loc.name && <span className="text-sm font-medium">{loc.name}</span>}
                {loc.name && <br />}
                <span className="text-sm text-muted-foreground">{loc.address}</span>
              </div>
            </div>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
