import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { listEvents } from '../services/calendar';
import { FALLBACK_EVENTS } from '../data/fallbackEvents';
import type { CalendarEvent } from '../types';

export interface CalendarEventsState {
  events: CalendarEvent[];
  source: 'native' | 'fallback';
  loading: boolean;
  error: string | null;
  reload: () => void;
}

function twoWeekWindow(): { from: Date; to: Date } {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  from.setDate(from.getDate() - 1);
  const to = new Date(from);
  to.setDate(to.getDate() + 14);
  return { from, to };
}

export function useCalendarEvents(): CalendarEventsState {
  const [state, setState] = useState<Omit<CalendarEventsState, 'reload'>>({
    events: FALLBACK_EVENTS,
    source: 'fallback',
    loading: Capacitor.isNativePlatform(),
    error: null,
  });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    (async () => {
      try {
        const { from, to } = twoWeekWindow();
        const events = await listEvents({ from, to });
        if (cancelled) return;
        if (events.length === 0) {
          // Permission likely denied, or genuinely empty calendar — show the
          // prototype schedule so the UI still has something to render.
          setState({ events: FALLBACK_EVENTS, source: 'fallback', loading: false, error: null });
        } else {
          setState({ events, source: 'native', loading: false, error: null });
        }
      } catch (err: unknown) {
        if (cancelled) return;
        setState({
          events: FALLBACK_EVENTS,
          source: 'fallback',
          loading: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return {
    ...state,
    reload: () => setNonce((n) => n + 1),
  };
}
