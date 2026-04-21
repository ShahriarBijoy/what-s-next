import { useEffect, useMemo, useRef, useState } from 'react';
import { PALETTE, hexToRgba, type CalendarEvent } from '../types';
import { useWeather } from '../hooks/useWeather';
import { ALL_WEATHER_STATES } from '../services/weather';
import { haptic } from '../services/haptics';

interface Props {
  events: CalendarEvent[];
  onOpenEvent: (ev: CalendarEvent) => void;
  onCreateNew: () => void;
}

export function TodayView({ events, onOpenEvent, onCreateNew }: Props) {
  // Pick today, then upcoming 2 days — the prototype showed Dec 13/14/15.
  const now = new Date();
  const todayISO = useMemo(() => {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, [now.getDate()]);

  const cards = useMemo(() => {
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() + 3);
    const cutoffISO = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(cutoff.getDate()).padStart(2, '0')}`;
    const candidates = events
      .filter((e) => e.dateISO >= todayISO && e.dateISO < cutoffISO)
      .slice(0, 10);
    return candidates.length > 0 ? candidates : events.slice(0, 10);
  }, [events, todayISO]);

  const [active, setActive] = useState(() => Math.min(2, Math.max(0, cards.length - 1)));
  const [mounted, setMounted] = useState(false);
  const { weather: liveWeather, source: weatherSource, loading: weatherLoading, reload: reloadWeather } = useWeather();
  const [weatherIdx, setWeatherIdx] = useState<number | null>(null);
  const weather = weatherIdx === null ? liveWeather : ALL_WEATHER_STATES[weatherIdx];

  const containerRef = useRef<HTMLDivElement>(null);
  const scrollAccum = useRef(0);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Clamp active to the current cards array whenever it shrinks.
  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, cards.length - 1)));
  }, [cards.length]);

  // Light haptic whenever the user flips to a different card. The `mounted`
  // gate skips the feedback that would otherwise fire on first render.
  const firstActiveRef = useRef(true);
  useEffect(() => {
    if (firstActiveRef.current) {
      firstActiveRef.current = false;
      return;
    }
    haptic('tick');
  }, [active]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      scrollAccum.current += e.deltaY;
      const threshold = 60;
      if (scrollAccum.current > threshold) {
        setActive((a) => Math.min(cards.length - 1, a + 1));
        scrollAccum.current = 0;
      } else if (scrollAccum.current < -threshold) {
        setActive((a) => Math.max(0, a - 1));
        scrollAccum.current = 0;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    const onTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (touchStartY.current == null) return;
      const dy = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(dy) > 50) {
        setActive((a) => (dy > 0 ? Math.min(cards.length - 1, a + 1) : Math.max(0, a - 1)));
        touchStartY.current = e.touches[0].clientY;
      }
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
    };
  }, [cards.length]);

  const todayNum = now.getDate();
  // "Apr" / "May" — title-case, used in the hero date ("21 Apr").
  const MONTH_TITLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthTitle = MONTH_TITLE[now.getMonth()];
  const FULL_DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const fullDayName = FULL_DAY[now.getDay()];

  return (
    <div
      style={{
        padding: 0,
        fontFamily: 'Space Grotesk, system-ui',
        flex: 1,
        minHeight: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          padding: '4px 24px 0',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1)',
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 12,
              letterSpacing: 1.3,
              textTransform: 'uppercase',
              color: PALETTE.ink,
              opacity: 0.55,
              fontWeight: 500,
              marginBottom: 8,
            }}
          >
            Today's events
          </div>
          <div
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 92,
              lineHeight: 0.95,
              letterSpacing: -2.5,
              color: PALETTE.ink,
              fontWeight: 400,
              display: 'flex',
              alignItems: 'baseline',
              gap: 14,
            }}
          >
            <span>{todayNum}</span>
            <span
              style={{
                fontSize: 54,
                fontStyle: 'italic',
                letterSpacing: -1,
                color: PALETTE.orange,
                fontWeight: 400,
              }}
            >
              {monthTitle}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button
            onClick={() => {
              // If we're on the live feed and it hasn't landed (still on
              // fallback), a tap re-requests location + weather. Otherwise
              // step through the demo states for preview / design QA.
              if (weatherIdx === null && weatherSource === 'fallback') {
                reloadWeather();
                return;
              }
              if (weatherIdx === null && weatherSource === 'live') {
                reloadWeather();
                return;
              }
              const next = ((weatherIdx ?? -1) + 1) % ALL_WEATHER_STATES.length;
              setWeatherIdx(next);
            }}
            title={
              weatherSource === 'fallback'
                ? 'Weather unavailable — tap to retry'
                : weatherSource === 'loading'
                  ? 'Fetching weather…'
                  : 'Tap to refresh, long-press to cycle states'
            }
            onContextMenu={(e) => {
              e.preventDefault();
              const next = ((weatherIdx ?? -1) + 1) % ALL_WEATHER_STATES.length;
              setWeatherIdx(next);
            }}
            style={{
              background: weather.tone,
              border: 'none',
              cursor: 'pointer',
              borderRadius: 22,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 4,
              minWidth: 120,
              position: 'relative',
              transition: 'background 0.5s cubic-bezier(.2,.9,.2,1), transform 0.35s cubic-bezier(.3,1.3,.4,1)',
              color: PALETTE.ink,
              opacity: weatherLoading ? 0.75 : 1,
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)')}
            onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                key={weather.id}
                style={{
                  fontSize: 24,
                  display: 'inline-block',
                  animation: 'kdWx 0.5s cubic-bezier(.3,1.4,.4,1)',
                }}
              >
                {weather.icon}
              </span>
              <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 30, letterSpacing: -0.3, lineHeight: 1 }}>
                {weather.temp}°
              </span>
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                opacity: 0.6,
                fontWeight: 500,
              }}
            >
              {weather.label}
            </div>
            {weatherIdx === null && weatherSource === 'fallback' && !weatherLoading && (
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  top: 6,
                  left: 8,
                  width: 6,
                  height: 6,
                  borderRadius: 999,
                  background: PALETTE.orange,
                  opacity: 0.9,
                }}
              />
            )}
          </button>

          <div
            key={weather.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              maxWidth: 200,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: PALETTE.ink,
              opacity: 0.72,
              fontWeight: 500,
              textAlign: 'right',
              lineHeight: 1.3,
              animation: 'kdReminder 0.55s cubic-bezier(.2,.9,.2,1)',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                background: PALETTE.ink,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                flexShrink: 0,
                fontFamily: 'Space Grotesk, system-ui',
              }}
            >
              !
            </span>
            <span>{weather.reminder}</span>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '14px 24px 0',
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          opacity: mounted ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.08s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            background: PALETTE.ink,
            color: '#fff',
            padding: '7px 14px',
            borderRadius: 999,
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          {fullDayName}
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            color: PALETTE.ink,
            opacity: 0.55,
            letterSpacing: 0.8,
          }}
        >
          {Math.min(active + 1, cards.length)} / {cards.length || 0}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: PALETTE.ink,
            opacity: 0.4,
            letterSpacing: 0.5,
          }}
        >
          scroll ↕
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 260,
          marginTop: 0,
          perspective: 1400,
          perspectiveOrigin: '50% 35%',
          touchAction: 'none',
        }}
      >
        <div style={{ position: 'absolute', left: 0, right: 0, top: 80, transformStyle: 'preserve-3d' }}>
          {cards.length === 0 ? (
            <EmptyState mounted={mounted} onCreateNew={onCreateNew} />
          ) : (
            cards.map((ev, i) => (
              <StackedCard
                key={ev.id}
                ev={ev}
                offset={i - active}
                isActive={i === active}
                mounted={mounted}
                onClick={() => {
                  if (i === active) onOpenEvent(ev);
                  else setActive(i);
                }}
              />
            ))
          )}
        </div>
      </div>

      <div
        style={{
          padding: '12px 0 18px',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 14,
          opacity: mounted ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.2s',
        }}
      >
        <button
          onClick={onCreateNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '10px 6px',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              background: PALETTE.ink,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 500,
            }}
          >
            +
          </div>
          <span style={{ fontFamily: 'Space Grotesk, system-ui', fontSize: 17, fontWeight: 500, color: PALETTE.ink }}>
            New event
          </span>
        </button>
      </div>
    </div>
  );
}

function EmptyState({ mounted, onCreateNew }: { mounted: boolean; onCreateNew: () => void }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: 60,
        transform: `translateX(-50%) translateY(${mounted ? 0 : 12}px)`,
        opacity: mounted ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(.2,.9,.2,1)',
        width: 300,
        textAlign: 'center',
        fontFamily: 'Space Grotesk, system-ui',
        color: PALETTE.ink,
      }}
    >
      <div
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontStyle: 'italic',
          fontSize: 40,
          color: PALETTE.orange,
          letterSpacing: -0.8,
          lineHeight: 1,
        }}
      >
        nothing today
      </div>
      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.55 }}>Your calendar is clear.</div>
      <button
        onClick={onCreateNew}
        style={{
          marginTop: 22,
          background: PALETTE.ink,
          color: '#fff',
          border: 'none',
          borderRadius: 999,
          padding: '12px 22px',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: -0.1,
        }}
      >
        + Add an event
      </button>
    </div>
  );
}

interface StackedProps {
  ev: CalendarEvent;
  offset: number;
  isActive: boolean;
  mounted: boolean;
  onClick: () => void;
}

function StackedCard({ ev, offset, isActive, mounted, onClick }: StackedProps) {
  const [hover, setHover] = useState(false);
  const abs = Math.abs(offset);

  let translateY: number, translateZ: number, rotateX: number, scale: number, opacity: number, zIndex: number, rotateZ: number;
  if (offset < 0) {
    translateY = offset * 18;
    translateZ = offset * 40;
    rotateX = Math.min(-offset * 2, 30);
    scale = Math.max(1 - abs * 0.04, 0.7);
    opacity = Math.max(1 - abs * 0.12, 0.25);
    rotateZ = 0;
    zIndex = 100 - abs;
  } else if (offset === 0) {
    translateY = 0;
    translateZ = 40;
    rotateX = 0;
    scale = 1;
    opacity = 1;
    rotateZ = -4;
    zIndex = 200;
  } else {
    translateY = 40 + offset * 16;
    translateZ = -offset * 30;
    rotateX = 0;
    scale = Math.max(1 - offset * 0.05, 0.7);
    opacity = Math.max(1 - offset * 0.15, 0.2);
    rotateZ = 0;
    zIndex = 100 - offset;
  }

  if (abs > 5) opacity = 0;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        // Responsive width — takes most of the viewport on phones but caps on
        // tablets/desktop-preview so the card doesn't stretch comically wide.
        width: 'min(92%, 380px)',
        aspectRatio: '5 / 3',
        transform: `
          translate(-50%, 0)
          translate3d(0, ${translateY}px, ${translateZ}px)
          rotateX(${rotateX}deg)
          rotateZ(${rotateZ + (hover && isActive ? 2 : 0)}deg)
          scale(${scale * (mounted ? 1 : 0.92)})
        `,
        borderRadius: 24,
        background: ev.color,
        color: ev.dark ? '#fff' : PALETTE.ink,
        fontFamily: 'Space Grotesk, system-ui',
        padding: '22px 24px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
        opacity: mounted ? opacity : 0,
        transition: 'transform 0.7s cubic-bezier(.2,.9,.25,1), opacity 0.5s cubic-bezier(.2,.9,.2,1)',
        boxShadow: isActive
          ? `0 30px 60px ${hexToRgba(ev.color, 0.45)}, 0 10px 20px rgba(0,0,0,0.1)`
          : `0 ${4 + abs * 2}px ${10 + abs * 4}px rgba(0,0,0,0.12)`,
        willChange: 'transform, opacity',
        zIndex,
        overflow: 'hidden',
      }}
    >
      {isActive ? <ActiveCardContent ev={ev} /> : <InactiveCardContent ev={ev} offset={offset} />}
    </div>
  );
}

function ActiveCardContent({ ev }: { ev: CalendarEvent }) {
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 11,
          background: ev.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
          padding: '5px 11px',
          borderRadius: 999,
          letterSpacing: 1,
          textTransform: 'uppercase',
          fontWeight: 500,
        }}
      >
        {ev.cat}
      </div>
      <div
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: 34,
          lineHeight: 1.05,
          letterSpacing: -0.7,
          fontWeight: 400,
          paddingRight: 80,
        }}
      >
        {ev.title}
      </div>
      <div style={{ fontSize: 14, opacity: 0.72, marginTop: 6 }}>{ev.loc || '—'}</div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Start</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 48, letterSpacing: -1, lineHeight: 1 }}>{ev.start}</div>
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            background: ev.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
            padding: '6px 13px',
            borderRadius: 999,
            fontWeight: 500,
            marginBottom: 6,
          }}
        >
          {ev.dur}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 10, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>End</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 48, letterSpacing: -1, lineHeight: 1 }}>{ev.end}</div>
        </div>
      </div>
    </div>
  );
}

function InactiveCardContent({ ev, offset }: { ev: CalendarEvent; offset: number }) {
  const abs = Math.abs(offset);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 48 }}>
      <div
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: 22,
          letterSpacing: -0.4,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          marginRight: 14,
          opacity: Math.max(1 - abs * 0.1, 0.5),
        }}
      >
        {ev.title}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, opacity: 0.65, fontWeight: 500 }}>{ev.start}</div>
    </div>
  );
}
