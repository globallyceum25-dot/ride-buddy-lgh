import { useState, useEffect } from 'react';

export function useGoogleMapsLoaded(): boolean {
  const [loaded, setLoaded] = useState(() => typeof google !== 'undefined' && !!google.maps);

  useEffect(() => {
    if (loaded) return;
    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [loaded]);

  return loaded;
}
