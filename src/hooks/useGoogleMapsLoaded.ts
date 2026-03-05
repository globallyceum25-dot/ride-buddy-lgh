import { useState, useEffect } from 'react';

interface GoogleMapsLoadState {
  loaded: boolean;
  timedOut: boolean;
}

export function useGoogleMapsLoaded(): GoogleMapsLoadState {
  const [loaded, setLoaded] = useState(() => typeof google !== 'undefined' && !!google.maps);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loaded) return;

    const interval = setInterval(() => {
      if (typeof google !== 'undefined' && google.maps) {
        setLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      if (!loaded) {
        setTimedOut(true);
        clearInterval(interval);
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [loaded]);

  return { loaded, timedOut };
}
