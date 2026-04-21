import { useEffect, useMemo, useRef, useState } from 'react';
import { PALETTE, hexToRgba, type CalendarEvent } from '../types';
import { useWeather } from '../hooks/useWeather';
import { ALL_WEATHER_STATES } from '../services/weather';

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
              fontSize: 10,
              letterSpacing: 1.2,
              textTransform: 'uppercase',
              color: PALETTE.ink,
              opacity: 0.55,
              fontWeight: 500,
              marginBottom: 6,
            }}
          >
            Today's events
          </div>
          <div
            style={{
              fontFamily: 'Instrument Serif, serif',
              fontSize: 68,
              lineHeight: 0.95,
              letterSpacing: -2,
              color: PALETTE.ink,
              fontWeight: 400,
              display: 'flex',
              alignItems: 'baseline',
              gap: 12,
            }}
          >
            <span>{todayNum}</span>
            <span
              style={{
                fontSize: 40,
                fontStyle: 'italic',
                letterSpacing: -0.8,
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
              borderRadius: 18,
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: 2,
              minWidth: 96,
              position: 'relative',
              transition: 'background 0.5s cubic-bezier(.2,.9,.2,1), transform 0.35s cubic-bezier(.3,1.3,.4,1)',
              color: PALETTE.ink,
              opacity: weatherLoading ? 0.75 : 1,
            }}
            onMouseDown={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)')}
            onMouseUp={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                key={weather.id}
                style={{
                  fontSize: 18,
                  display: 'inline-block',
                  animation: 'kdWx 0.5s cubic-bezier(.3,1.4,.4,1)',
                }}
              >
                {weather.icon}
              </span>
              <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, letterSpacing: -0.3, lineHeight: 1 }}>
                {weather.temp}°
              </span>
            </div>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 9,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                opacity: 0.55,
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
              gap: 6,
              maxWidth: 180,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 10,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              color: PALETTE.ink,
              opacity: 0.7,
              fontWeight: 500,
              textAlign: 'right',
              lineHeight: 1.3,
              animation: 'kdReminder 0.55s cubic-bezier(.2,.9,.2,1)',
            }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: PALETTE.ink,
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
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
          padding: '10px 24px 0',
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          opacity: mounted ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.08s',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            background: PALETTE.ink,
            color: '#fff',
            padding: '5px 10px',
            borderRadius: 999,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          {fullDayName}
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: PALETTE.ink,
            opacity: 0.5,
            letterSpacing: 0.8,
          }}
        >
          {Math.min(active + 1, cards.length)} / {cards.length || 0}
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
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
          onClick={() => setActive((a) => Math.max(0, a - 1))}
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            background: 'transparent',
            border: `1.5px dashed ${hexToRgba(PALETTE.ink, 0.35)}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 12V2M3 6l4-4 4 4" stroke={PALETTE.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          onClick={onCreateNew}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '8px 4px',
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background: PALETTE.ink,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 500,
            }}
          >
            +
          </div>
          <span style={{ fontFamily: 'Space Grotesk, system-ui', fontSize: 14, fontWeight: 500, color: PALETTE.ink }}>
            New event
          </span>
        </button>
        <button
          onClick={() => setActive((a) => Math.min(cards.length - 1, a + 1))}
          style={{
            width: 46,
            height: 46,
            borderRadius: 999,
            background: 'transparent',
            border: `1.5px dashed ${hexToRgba(PALETTE.ink, 0.35)}`,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 2v10M3 8l4 4 4-4" stroke={PALETTE.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
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

  const cardWidth = 300;
  const cardHeight = 180;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'absolute',
        left: '50%',
        top: 0,
        width: cardWidth,
        height: cardHeight,
        marginLeft: -cardWidth / 2,
        borderRadius: 22,
        background: ev.color,
        color: ev.dark ? '#fff' : PALETTE.ink,
        fontFamily: 'Space Grotesk, system-ui',
        padding: '18px 20px',
        boxSizing: 'border-box',
        cursor: 'pointer',
        transformStyle: 'preserve-3d',
        transform: `
          translate3d(0, ${translateY}px, ${translateZ}px)
          rotateX(${rotateX}deg)
          rotateZ(${rotateZ + (hover && isActive ? 2 : 0)}deg)
          scale(${scale * (mounted ? 1 : 0.92)})
        `,
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
          fontSize: 10,
          background: ev.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
          padding: '4px 9px',
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
          fontSize: 28,
          lineHeight: 1.05,
          letterSpacing: -0.5,
          fontWeight: 400,
          paddingRight: 68,
        }}
      >
        {ev.title}
      </div>
      <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>{ev.loc || '—'}</div>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Start</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, letterSpacing: -1, lineHeight: 1 }}>{ev.start}</div>
        </div>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            background: ev.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
            padding: '5px 11px',
            borderRadius: 999,
            fontWeight: 500,
            marginBottom: 4,
          }}
        >
          {ev.dur}
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>End</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, letterSpacing: -1, lineHeight: 1 }}>{ev.end}</div>
        </div>
      </div>
    </div>
  );
}

function InactiveCardContent({ ev, offset }: { ev: CalendarEvent; offset: number }) {
  const abs = Math.abs(offset);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 42 }}>
      <div
        style={{
          fontFamily: 'Instrument Serif, serif',
          fontSize: 18,
          letterSpacing: -0.3,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
          marginRight: 12,
          opacity: Math.max(1 - abs * 0.1, 0.5),
        }}
      >
        {ev.title}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, opacity: 0.65, fontWeight: 500 }}>{ev.start}</div>
    </div>
  );
}
