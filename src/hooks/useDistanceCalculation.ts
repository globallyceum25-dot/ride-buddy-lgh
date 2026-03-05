import { useState, useEffect, useRef } from 'react';
import type { Coordinates } from '@/components/shared/LocationAutocomplete';

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

  useEffect(() => {
    // Filter valid waypoints
    const validWaypoints = waypoints.filter((w): w is Coordinates => w !== null);
    
    if (validWaypoints.length < 2) {
      setDistanceKm(null);
      setDurationMinutes(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const coordsStr = validWaypoints
          .map((w) => `${w.lng},${w.lat}`)
          .join(';');

        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=false`
        );
        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.[0]) {
          const route = data.routes[0];
          setDistanceKm(Math.round((route.distance / 1000) * 10) / 10);
          setDurationMinutes(Math.round(route.duration / 60));
        } else {
          setDistanceKm(null);
          setDurationMinutes(null);
        }
      } catch {
        setDistanceKm(null);
        setDurationMinutes(null);
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [waypoints.map((w) => w ? `${w.lat},${w.lng}` : 'null').join('|')]);

  return { distanceKm, durationMinutes, isLoading };
}
