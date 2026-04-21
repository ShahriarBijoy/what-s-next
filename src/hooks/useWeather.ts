import { useCallback, useEffect, useState } from 'react';
import { fallbackWeather, fetchWeather, type WeatherState } from '../services/weather';

export type WeatherSource = 'loading' | 'live' | 'fallback';

export interface WeatherHook {
  weather: WeatherState;
  loading: boolean;
  source: WeatherSource;
  error: string | null;
  reload: () => void;
}

export function useWeather(): WeatherHook {
  const [weather, setWeather] = useState<WeatherState>(fallbackWeather);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<WeatherSource>('loading');
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const w = await fetchWeather();
        if (cancelled) return;
        setWeather(w);
        setSource('live');
      } catch (err: unknown) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        // Surface errors to logcat / Safari Web Inspector so the root cause
        // (permission denied, offline, timeout, etc.) is visible during
        // device testing. Without this they would fail silently.
        console.warn('[weather] fetch failed:', message, err);
        setError(message);
        setSource('fallback');
        setWeather(fallbackWeather());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  return { weather, loading, source, error, reload };
}
