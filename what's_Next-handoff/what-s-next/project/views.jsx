// ───────────────── shared UI atoms ─────────────────

function SegControl({ value, onChange, options }) {
  return (
    <div style={{
      display: 'inline-flex', background: 'rgba(0,0,0,0.06)',
      borderRadius: 999, padding: 4, position: 'relative',
      fontFamily: 'Space Grotesk, system-ui', fontSize: 15, fontWeight: 500,
    }}>
      {options.map(o => {
        const on = o.value === value;
        return (
          <button key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '8px 18px', borderRadius: 999, border: 'none',
              background: on ? PALETTE.ink : 'transparent',
              color: on ? '#fff' : PALETTE.ink,
              cursor: 'pointer', transition: 'background 0.35s cubic-bezier(.4,1.4,.5,1), color 0.25s',
              letterSpacing: -0.1,
            }}>
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function PlusButton({ onClick, rotate }) {
  return (
    <button onClick={onClick} style={{
      width: 44, height: 44, borderRadius: 999,
      background: PALETTE.orange, border: 'none',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: `0 6px 16px ${hexToRgba(PALETTE.orange, 0.35)}`,
      transition: 'transform 0.4s cubic-bezier(.4,1.6,.4,1)',
      transform: rotate ? 'rotate(135deg)' : 'rotate(0deg)',
    }}>
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 2v14M2 9h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
}

// ───────────────── TODAY VIEW — 3D infinite-scroll card stack ─────────────────

// Weather states with matching contextual reminders
const WEATHER_STATES = [
  { id: 'sunny', icon: '☀', temp: 72, label: 'Sunny', reminder: 'Use sunscreen', tone: PALETTE.butter },
  { id: 'rain',  icon: '☂', temp: 54, label: 'Rain',   reminder: "Don't forget your umbrella", tone: PALETTE.sky },
  { id: 'cloud', icon: '☁', temp: 61, label: 'Cloudy', reminder: 'Layer up, chance of drizzle', tone: PALETTE.lavender },
  { id: 'snow',  icon: '❄', temp: 28, label: 'Snow',   reminder: 'Wear boots, roads icy',       tone: PALETTE.cream },
  { id: 'wind',  icon: '⌇', temp: 48, label: 'Windy',  reminder: 'Hold onto your hat',          tone: PALETTE.mint },
];

function TodayView({ onOpenEvent, onCreateNew }) {
  const cards = EVENTS.filter(e => e.date === 13 || e.date === 14 || e.date === 15).slice(0, 10);
  const [active, setActive] = React.useState(2); // start a few in, so we can see cards above
  const [mounted, setMounted] = React.useState(false);
  const [weatherIdx, setWeatherIdx] = React.useState(0);
  const weather = WEATHER_STATES[weatherIdx];
  const containerRef = React.useRef(null);
  const scrollAccum = React.useRef(0);
  const touchStartY = React.useRef(null);

  React.useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  // Wheel handler — accumulate small scrolls, step between cards
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      e.preventDefault();
      scrollAccum.current += e.deltaY;
      const threshold = 60;
      if (scrollAccum.current > threshold) {
        setActive(a => Math.min(cards.length - 1, a + 1));
        scrollAccum.current = 0;
      } else if (scrollAccum.current < -threshold) {
        setActive(a => Math.max(0, a - 1));
        scrollAccum.current = 0;
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });

    const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (touchStartY.current == null) return;
      const dy = touchStartY.current - e.touches[0].clientY;
      if (Math.abs(dy) > 50) {
        setActive(a => dy > 0 ? Math.min(cards.length - 1, a + 1) : Math.max(0, a - 1));
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

  return (
    <div style={{ padding: '0 0 0', fontFamily: 'Space Grotesk, system-ui', height: 720, position: 'relative', overflow: 'hidden' }}>
      {/* Title block + weather (with reminder beneath weather) */}
      <div style={{
        padding: '4px 24px 0',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-10px)',
        transition: 'all 0.6s cubic-bezier(.2,.9,.2,1)',
      }}>
        <div>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            letterSpacing: 1.2, textTransform: 'uppercase', color: PALETTE.ink, opacity: 0.55,
            fontWeight: 500, marginBottom: 6,
          }}>Today's events</div>
          <div style={{
            fontFamily: 'Instrument Serif, serif', fontSize: 68,
            lineHeight: 0.9, letterSpacing: -2, color: PALETTE.ink, fontWeight: 400,
          }}>13.12</div>
          <div style={{
            fontFamily: 'Instrument Serif, serif', fontSize: 38, fontStyle: 'italic',
            lineHeight: 1, letterSpacing: -0.8, color: PALETTE.orange,
            marginTop: -2,
          }}>DEC</div>
        </div>

        {/* Right column — weather chip + reminder underneath */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <button
            onClick={() => setWeatherIdx((weatherIdx + 1) % WEATHER_STATES.length)}
            title="Tap to cycle weather (demo)"
            style={{
              background: weather.tone, border: 'none', cursor: 'pointer',
              borderRadius: 18, padding: '10px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
              gap: 2, minWidth: 96,
              transition: 'background 0.5s cubic-bezier(.2,.9,.2,1), transform 0.35s cubic-bezier(.3,1.3,.4,1)',
              color: PALETTE.ink,
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span key={weather.id} style={{
                fontSize: 18, display: 'inline-block',
                animation: 'kdWx 0.5s cubic-bezier(.3,1.4,.4,1)',
              }}>{weather.icon}</span>
              <span style={{
                fontFamily: 'Instrument Serif, serif', fontSize: 22, letterSpacing: -0.3, lineHeight: 1,
              }}>{weather.temp}°</span>
            </div>
            <div style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
              letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.55, fontWeight: 500,
            }}>{weather.label}</div>
          </button>

          {/* Weather-dependent reminder — sits under the widget, right-aligned, mono font */}
          <div key={weather.id} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            maxWidth: 180,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10, letterSpacing: 0.5, textTransform: 'uppercase',
            color: PALETTE.ink, opacity: 0.7, fontWeight: 500,
            textAlign: 'right', lineHeight: 1.3,
            animation: 'kdReminder 0.55s cubic-bezier(.2,.9,.2,1)',
          }}>
            <span style={{
              width: 14, height: 14, borderRadius: 999,
              background: PALETTE.ink, color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, flexShrink: 0, fontFamily: 'Space Grotesk, system-ui',
            }}>!</span>
            <span>{weather.reminder}</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes kdWx {
          0% { transform: scale(0.6) rotate(-20deg); opacity: 0; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        @keyframes kdReminder {
          0% { transform: translateY(-4px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Meta strip */}
      <div style={{
        padding: '10px 24px 0', display: 'flex', gap: 8, alignItems: 'center',
        opacity: mounted ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.08s',
      }}>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          background: PALETTE.ink, color: '#fff',
          padding: '5px 10px', borderRadius: 999, letterSpacing: 1, textTransform: 'uppercase',
        }}>Tue 13 DEC</div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          color: PALETTE.ink, opacity: 0.5, letterSpacing: 0.8,
        }}>{active + 1} / {cards.length}</div>
        <div style={{ flex: 1 }}/>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
          color: PALETTE.ink, opacity: 0.4, letterSpacing: 0.5,
        }}>scroll ↕</div>
      </div>

      {/* 3D card stack */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          height: 540, marginTop: 0,
          perspective: 1400,
          perspectiveOrigin: '50% 35%',
          touchAction: 'none',
        }}>
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 80,
          transformStyle: 'preserve-3d',
        }}>
          {cards.map((ev, i) => (
            <StackedCard key={ev.id}
              ev={ev} offset={i - active}
              isActive={i === active}
              total={cards.length}
              mounted={mounted}
              onClick={() => {
                if (i === active) onOpenEvent(ev);
                else setActive(i);
              }}/>
          ))}
        </div>
      </div>

      {/* Bottom control — active card info + step */}
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14,
        opacity: mounted ? 1 : 0,
        transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.2s',
      }}>
        <button
          onClick={() => setActive(a => Math.max(0, a - 1))}
          style={{
            width: 46, height: 46, borderRadius: 999,
            background: 'transparent', border: `1.5px dashed ${hexToRgba(PALETTE.ink, 0.35)}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 12V2M3 6l4-4 4 4" stroke={PALETTE.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={onCreateNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '8px 4px',
          }}>
          <div style={{
            width: 28, height: 28, borderRadius: 999,
            background: PALETTE.ink, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 500,
          }}>+</div>
          <span style={{
            fontFamily: 'Space Grotesk, system-ui', fontSize: 14, fontWeight: 500, color: PALETTE.ink,
          }}>New event</span>
        </button>
        <button
          onClick={() => setActive(a => Math.min(cards.length - 1, a + 1))}
          style={{
            width: 46, height: 46, borderRadius: 999,
            background: 'transparent', border: `1.5px dashed ${hexToRgba(PALETTE.ink, 0.35)}`,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 2v10M3 8l4 4 4-4" stroke={PALETTE.ink} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

// ───────────────── Single stacked card ─────────────────
// offset: card index relative to active (0 = active, negative = above/behind, positive = below)

function StackedCard({ ev, offset, isActive, total, mounted, onClick }) {
  const [hover, setHover] = React.useState(false);

  // Behind-the-active cards fan upward & backward in Z
  // Below-the-active cards peek from below
  const abs = Math.abs(offset);

  let translateY, translateZ, rotateX, scale, opacity, zIndex, rotateZ;
  if (offset < 0) {
    // Above (already passed) — stack receding up and back
    translateY = offset * 18;        // step up
    translateZ = offset * 40;        // step back (negative z)
    rotateX = Math.min(-offset * 2, 30);
    scale = Math.max(1 - abs * 0.04, 0.7);
    opacity = Math.max(1 - abs * 0.12, 0.25);
    rotateZ = 0;
    zIndex = 100 - abs;
  } else if (offset === 0) {
    // Active — big, slightly rotated for playful feel
    translateY = 0;
    translateZ = 40;
    rotateX = 0;
    scale = 1;
    opacity = 1;
    rotateZ = -4;
    zIndex = 200;
  } else {
    // Below (upcoming) — peek from under active, fan downward
    translateY = 40 + offset * 16;
    translateZ = -offset * 30;
    rotateX = 0;
    scale = Math.max(1 - offset * 0.05, 0.7);
    opacity = Math.max(1 - offset * 0.15, 0.2);
    rotateZ = 0;
    zIndex = 100 - offset;
  }

  // Cards farther than 5 away get fully hidden
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
        left: '50%', top: 0,
        width: cardWidth, height: cardHeight,
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
      }}>
      {/* Active-only full content */}
      {isActive && <ActiveCardContent ev={ev}/>}
      {!isActive && <InactiveCardContent ev={ev} offset={offset}/>}
    </div>
  );
}

function ActiveCardContent({ ev }) {
  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* category */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
        background: ev.dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.12)',
        padding: '4px 9px', borderRadius: 999, letterSpacing: 1,
        textTransform: 'uppercase', fontWeight: 500,
      }}>
        {ev.cat}
      </div>
      {/* title */}
      <div style={{
        fontFamily: 'Instrument Serif, serif', fontSize: 28,
        lineHeight: 1.05, letterSpacing: -0.5, fontWeight: 400,
        paddingRight: 68,
      }}>{ev.title}</div>
      <div style={{
        fontSize: 13, opacity: 0.7, marginTop: 4,
      }}>{ev.loc}</div>
      {/* huge time */}
      <div style={{
        marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>Start</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, letterSpacing: -1, lineHeight: 1 }}>{ev.start}</div>
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          background: ev.dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.1)',
          padding: '5px 11px', borderRadius: 999, fontWeight: 500,
          marginBottom: 4,
        }}>{ev.dur}</div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, opacity: 0.6, letterSpacing: 1, textTransform: 'uppercase', fontWeight: 500 }}>End</div>
          <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, letterSpacing: -1, lineHeight: 1 }}>{ev.end}</div>
        </div>
      </div>
    </div>
  );
}

function InactiveCardContent({ ev, offset }) {
  // Only top sliver is visible — show small title + time on one line
  const abs = Math.abs(offset);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      height: 42,
    }}>
      <div style={{
        fontFamily: 'Instrument Serif, serif', fontSize: 18,
        letterSpacing: -0.3, lineHeight: 1.1,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        flex: 1, marginRight: 12,
        opacity: Math.max(1 - abs * 0.1, 0.5),
      }}>{ev.title}</div>
      <div style={{
        fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
        opacity: 0.65, fontWeight: 500,
      }}>{ev.start}</div>
    </div>
  );
}

Object.assign(window, { SegControl, PlusButton, TodayView });
