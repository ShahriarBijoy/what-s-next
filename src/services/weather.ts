import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { PALETTE } from '../types';

export interface WeatherState {
  id: 'sunny' | 'rain' | 'cloud' | 'snow' | 'wind';
  icon: string;
  temp: number;
  label: string;
  reminder: string;
  tone: string;
}

// Five design states from the prototype. Real weather gets mapped into one of
// these, so the UI behaves identically regardless of source.
const STATES: Record<WeatherState['id'], Omit<WeatherState, 'temp'>> = {
  sunny: { id: 'sunny', icon: '☀', label: 'Sunny',  reminder: 'Use sunscreen',                   tone: PALETTE.butter },
  rain:  { id: 'rain',  icon: '☂', label: 'Rain',   reminder: "Don't forget your umbrella",      tone: PALETTE.sky },
  cloud: { id: 'cloud', icon: '☁', label: 'Cloudy', reminder: 'Layer up, chance of drizzle',     tone: PALETTE.lavender },
  snow:  { id: 'snow',  icon: '❄', label: 'Snow',   reminder: 'Wear boots, roads icy',           tone: PALETTE.cream },
  wind:  { id: 'wind',  icon: '⌇', label: 'Windy',  reminder: 'Hold onto your hat',              tone: PALETTE.mint },
};

// WMO weather interpretation codes → our five buckets.
// https://open-meteo.com/en/docs#weathervariables
function mapWmoCode(code: number): WeatherState['id'] {
  if (code === 0) return 'sunny';
  if (code >= 1 && code <= 3) return 'cloud';
  if (code === 45 || code === 48) return 'cloud';
  if (code >= 51 && code <= 67) return 'rain';
  if (code >= 71 && code <= 77) return 'snow';
  if (code >= 80 && code <= 82) return 'rain';
  if (code >= 85 && code <= 86) return 'snow';
  if (code >= 95) return 'rain';
  return 'cloud';
}

async function getPosition(): Promise<{ lat: number; lon: number }> {
  if (Capacitor.isNativePlatform()) {
    // Plugin handles the permission prompt — on iOS via Info.plist keys, on
    // Android via ACCESS_COARSE/FINE_LOCATION in the manifest.
    let perm = await Geolocation.checkPermissions();
    console.log('[weather] initial location permission:', perm);
    // On Android the top-level `location` alias can be 'prompt' even when
    // coarse is already granted, so also accept coarse.
    const granted = (p: typeof perm) => p.location === 'granted' || p.coarseLocation === 'granted';
    if (!granted(perm)) {
      perm = await Geolocation.requestPermissions({ permissions: ['location', 'coarseLocation'] });
      console.log('[weather] permission after request:', perm);
      if (!granted(perm)) {
        throw new Error('Location permission denied');
      }
    }
    const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 });
    return { lat: pos.coords.latitude, lon: pos.coords.longitude };
  }

  // Browser fallback — navigator.geolocation also works here but we prefer the
  // unified plugin API so the same code path runs in the dev server.
  const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 });
  return { lat: pos.coords.latitude, lon: pos.coords.longitude };
}

// Open-Meteo is keyless and free. Returns Fahrenheit + WMO code + wind.
export async function fetchWeather(): Promise<WeatherState> {
  const { lat, lon } = await getPosition();
  console.log('[weather] got position:', lat.toFixed(3), lon.toFixed(3));
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,weather_code,wind_speed_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather fetch failed: ${res.status}`);
  const json = await res.json();

  const temp = Math.round(json.current?.temperature_2m ?? 0);
  const code = json.current?.weather_code ?? 3;
  const wind = json.current?.wind_speed_10m ?? 0;
  console.log('[weather] open-meteo:', { temp, code, wind });

  // High winds override — Open-Meteo's WMO codes don't have a plain "windy"
  // bucket, but the design specifically calls for one.
  let id: WeatherState['id'] = mapWmoCode(code);
  if (id !== 'snow' && id !== 'rain' && wind >= 20) id = 'wind';

  return { ...STATES[id], temp };
}

// Used before the real fetch completes, or when permission is denied.
export function fallbackWeather(): WeatherState {
  return { ...STATES.sunny, temp: 72 };
}

// Expose the full set so the header widget can still cycle through states
// as a demo affordance (matches the prototype's tap-to-cycle behavior).
export const ALL_WEATHER_STATES: WeatherState[] = [
  { ...STATES.sunny, temp: 72 },
  { ...STATES.rain,  temp: 54 },
  { ...STATES.cloud, temp: 61 },
  { ...STATES.snow,  temp: 28 },
  { ...STATES.wind,  temp: 48 },
];
