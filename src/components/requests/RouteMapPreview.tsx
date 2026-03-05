import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Skeleton } from '@/components/ui/skeleton';

// Fix Leaflet default marker icons in Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface RouteMapPreviewProps {
  pickup: string;
  dropoff: string;
  stops?: string[];
}

interface LatLng {
  lat: number;
  lng: number;
}

function FitBounds({ positions }: { positions: LatLng[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [positions, map]);
  return null;
}

async function geocode(locationName: string): Promise<LatLng | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1&countrycodes=lk`
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    // Retry without country filter
    const res2 = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=1`
    );
    const data2 = await res2.json();
    if (data2.length > 0) {
      return { lat: parseFloat(data2[0].lat), lng: parseFloat(data2[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function RouteMapPreview({ pickup, dropoff, stops = [] }: RouteMapPreviewProps) {
  const [waypoints, setWaypoints] = useState<(LatLng | null)[]>([]);
  const [routePositions, setRoutePositions] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    const allLocations = [pickup, ...stops, dropoff];

    (async () => {
      // Sequential geocoding to respect Nominatim rate limits
      const coords: (LatLng | null)[] = [];
      for (let i = 0; i < allLocations.length; i++) {
        if (abortRef.current) return;
        const result = await geocode(allLocations[i]);
        coords.push(result);
        if (i < allLocations.length - 1) await delay(1100);
      }

      if (abortRef.current) return;

      const validCoords = coords.filter((c): c is LatLng => c !== null);
      setWaypoints(coords);

      if (validCoords.length < 2) {
        setError('Could not geocode enough locations to show a route.');
        setIsLoading(false);
        return;
      }

      // Fetch route from OSRM
      try {
        const coordsStr = validCoords.map(c => `${c.lng},${c.lat}`).join(';');
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`
        );
        const data = await res.json();

        if (data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates) {
          const positions: [number, number][] = data.routes[0].geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          );
          setRoutePositions(positions);
        }
      } catch {
        // Route line won't show but markers still will
      }

      setIsLoading(false);
    })();

    return () => {
      abortRef.current = true;
    };
  }, [pickup, dropoff, stops.join('|')]);

  if (isLoading) {
    return <Skeleton className="w-full h-[250px] rounded-lg" />;
  }

  if (error) {
    return (
      <div className="w-full h-[120px] rounded-lg bg-muted flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const validWaypoints = waypoints.filter((w): w is LatLng => w !== null);
  if (validWaypoints.length === 0) return null;

  const center: [number, number] = [validWaypoints[0].lat, validWaypoints[0].lng];

  // Build marker data: first = pickup (green), last = dropoff (red), middle = stops (blue)
  const markers = validWaypoints.map((pos, i) => {
    let icon = blueIcon;
    if (i === 0) icon = greenIcon;
    else if (i === validWaypoints.length - 1) icon = redIcon;
    return { pos, icon };
  });

  return (
    <div className="w-full h-[250px] rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds positions={validWaypoints} />
        {routePositions.length > 0 && (
          <Polyline positions={routePositions} color="hsl(258, 89%, 66%)" weight={4} opacity={0.8} />
        )}
        {markers.map((m, i) => (
          <Marker key={i} position={[m.pos.lat, m.pos.lng]} icon={m.icon} />
        ))}
      </MapContainer>
    </div>
  );
}
