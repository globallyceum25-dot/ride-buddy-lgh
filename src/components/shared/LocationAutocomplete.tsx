import { useState, useRef, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGoogleMapsLoaded } from '@/hooks/useGoogleMapsLoaded';
export interface Coordinates {
  lat: number;
  lng: number;
}

interface Prediction {
  placeId: string;
  description: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string, coords: Coordinates | null, placeName?: string) => void;
  placeholder?: string;
  className?: string;
}

export function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search for a location...',
  className,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<Prediction[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);
  const dummyDivRef = useRef<HTMLDivElement | null>(null);
  const { loaded: mapsLoaded, timedOut } = useGoogleMapsLoaded();

  // Initialize Google services when loaded
  useEffect(() => {
    if (!mapsLoaded) return;
    autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
    if (!dummyDivRef.current) {
      dummyDivRef.current = document.createElement('div');
    }
    placesServiceRef.current = new google.maps.places.PlacesService(dummyDivRef.current);
  }, [mapsLoaded]);

  // Sync external value changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchLocations = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3 || !autocompleteServiceRef.current) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: searchQuery,
          componentRestrictions: { country: 'lk' },
        },
        (predictions, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setResults(
              predictions.map((p) => ({
                placeId: p.place_id,
                description: p.description,
              }))
            );
            setIsOpen(true);
          } else {
            setResults([]);
            setIsOpen(false);
          }
          setIsLoading(false);
        }
      );
    } catch {
      setResults([]);
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    onChange(val, null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchLocations(val), 300);
  };

  const handleSelect = (prediction: Prediction) => {
    if (!placesServiceRef.current) return;

    setQuery(prediction.description);
    setIsOpen(false);
    setResults([]);

    placesServiceRef.current.getDetails(
      { placeId: prediction.placeId, fields: ['geometry', 'formatted_address', 'name'] },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const displayName = place.formatted_address || prediction.description;
          const placeName = place.name || undefined;
          setQuery(displayName);
          onChange(displayName, {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }, placeName);
        } else {
          onChange(prediction.description, null);
        }
      }
    );
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={handleInputChange}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder={timedOut ? 'Maps failed to load' : !mapsLoaded ? 'Loading maps...' : placeholder}
          className={cn('pr-8', timedOut && 'border-destructive', className)}
          disabled={!mapsLoaded || timedOut}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2">
          {!mapsLoaded || isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <MapPin className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-y-auto">
          {results.map((result) => (
            <button
              key={result.placeId}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors border-b last:border-b-0 border-border/50"
              onClick={() => handleSelect(result)}
            >
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="line-clamp-2">{result.description}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
