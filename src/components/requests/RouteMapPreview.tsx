import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGoogleMapsLoaded } from '@/hooks/useGoogleMapsLoaded';

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

  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) {
      return;
    }

    setIsLoading(true);
    setError(null);

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
          setError('Could not calculate route for the given locations.');
        }
        setIsLoading(false);
      }
    );
  }, [mapsLoaded, pickup, dropoff, stops.join('|')]);

  if (timedOut) {
    return (
      <div className="w-full h-[120px] rounded-lg bg-destructive/10 border border-destructive/30 flex items-center justify-center">
        <p className="text-sm text-destructive">Google Maps failed to load. Please check your connection and refresh the page.</p>
      </div>
    );
  }

  if (!mapsLoaded || (isLoading && !error)) {
    return (
      <div className="relative w-full h-[250px] rounded-lg overflow-hidden border border-border">
        <Skeleton className="absolute inset-0" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[120px] rounded-lg bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[250px] rounded-lg overflow-hidden border border-border">
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      <div ref={mapRef} className="w-full h-full" />
    </div>
  );
}
