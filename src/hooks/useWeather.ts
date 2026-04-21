import { useEffect, useState } from 'react';
import { fallbackWeather, fetchWeather, type WeatherState } from '../services/weather';

export interface WeatherHook {
  weather: WeatherState;
  loading: boolean;
  error: string | null;
}

export function useWeather(): WeatherHook {
  const [weather, setWeather] = useState<WeatherState>(fallbackWeather);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const w = await fetchWeather();
        if (!cancelled) setWeather(w);
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { weather, loading, error };
}
