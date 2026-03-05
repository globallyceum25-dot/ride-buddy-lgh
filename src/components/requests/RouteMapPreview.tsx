import { useState, useEffect, useRef, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoogleMapsLoaded } from '@/hooks/useGoogleMapsLoaded';
import { MapPin } from 'lucide-react';

interface RouteMapPreviewProps {
  pickup: string;
  dropoff: string;
  stops?: string[];
}

export function RouteMapPreview({ pickup, dropoff, stops = [] }: RouteMapPreviewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const rendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const { loaded: mapsLoaded, timedOut } = useGoogleMapsLoaded();

  // Stabilize stops dependency
  const stopsKey = useMemo(() => stops.join('|'), [stops]);

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Initialize map if not done
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new google.maps.Map(mapRef.current, {
          zoom: 10,
          center: { lat: 7.8731, lng: 80.7718 }, // Sri Lanka center
          disableDefaultUI: true,
          zoomControl: true,
        });
      }

      // Clear previous renderer
      if (rendererRef.current) {
        rendererRef.current.setMap(null);
      }

      rendererRef.current = new google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
      });

      const service = new google.maps.DirectionsService();

      const waypoints = stops.map((stop) => ({
        location: stop,
        stopover: true,
      }));

      service.route(
        {
          origin: pickup,
          destination: dropoff,
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            rendererRef.current?.setDirections(result);
          } else {
            console.error('Directions request failed:', status);
            setError('Could not calculate route for the given locations.');
          }
          setIsLoading(false);
        }
      );
    } catch (err) {
      console.error('Map initialization error:', err);
      setError('Failed to initialize the map. Please refresh the page.');
      setIsLoading(false);
    }
  }, [mapsLoaded, pickup, dropoff, stopsKey]);

  if (timedOut) {
    return (
      <div className="w-full h-[120px] rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center gap-2">
        <MapPin className="h-4 w-4 text-destructive" />
        <p className="text-sm text-destructive">Google Maps failed to load. Please check your connection and refresh the page.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[120px] rounded-lg bg-muted flex items-center justify-center gap-2">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[250px] rounded-lg overflow-hidden border border-border">
      {(!mapsLoaded || isLoading) && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
