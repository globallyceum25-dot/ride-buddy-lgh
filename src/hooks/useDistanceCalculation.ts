import { useState, useEffect, useRef } from 'react';
import type { Coordinates } from '@/components/shared/LocationAutocomplete';
import { useGoogleMapsLoaded } from '@/hooks/useGoogleMapsLoaded';

interface DistanceResult {
  distanceKm: number | null;
  durationMinutes: number | null;
  isLoading: boolean;
}

export function useDistanceCalculation(waypoints: (Coordinates | null)[]): DistanceResult {
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const { loaded: mapsLoaded } = useGoogleMapsLoaded();

  useEffect(() => {
    if (!mapsLoaded) return;

    const validWaypoints = waypoints.filter((w): w is Coordinates => w !== null);

    if (validWaypoints.length < 2) {
      setDistanceKm(null);
      setDurationMinutes(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {

      setIsLoading(true);
      const service = new google.maps.DirectionsService();

      const origin = new google.maps.LatLng(validWaypoints[0].lat, validWaypoints[0].lng);
      const destination = new google.maps.LatLng(
        validWaypoints[validWaypoints.length - 1].lat,
        validWaypoints[validWaypoints.length - 1].lng
      );

      const intermediateWaypoints = validWaypoints.slice(1, -1).map((w) => ({
        location: new google.maps.LatLng(w.lat, w.lng),
        stopover: true,
      }));

      service.route(
        {
          origin,
          destination,
          waypoints: intermediateWaypoints,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result?.routes?.[0]) {
            const legs = result.routes[0].legs;
            let totalDistance = 0;
            let totalDuration = 0;
            for (const leg of legs) {
              totalDistance += leg.distance?.value ?? 0;
              totalDuration += leg.duration?.value ?? 0;
            }
            setDistanceKm(Math.round((totalDistance / 1000) * 10) / 10);
            setDurationMinutes(Math.round(totalDuration / 60));
          } else {
            setDistanceKm(null);
            setDurationMinutes(null);
          }
          setIsLoading(false);
        }
      );
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [mapsLoaded, waypoints.map((w) => (w ? `${w.lat},${w.lng}` : 'null')).join('|')]);

  return { distanceKm, durationMinutes, isLoading };
}
