import { Route, Clock, Loader2 } from 'lucide-react';

interface MileageDisplayProps {
  distanceKm: number | null;
  durationMinutes: number | null;
  isLoading: boolean;
}

export function MileageDisplay({ distanceKm, durationMinutes, isLoading }: MileageDisplayProps) {
  if (!isLoading && distanceKm === null) return null;

  return (
    <div className="flex items-center gap-4 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Calculating route...</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1.5 text-foreground">
            <Route className="h-4 w-4 text-primary" />
            <span className="font-medium">{distanceKm} km</span>
          </div>
          {durationMinutes !== null && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {durationMinutes >= 60
                  ? `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`
                  : `${durationMinutes} min`}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
