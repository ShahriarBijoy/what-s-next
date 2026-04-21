// ───────────────── CALENDAR (week) VIEW ─────────────────

function CalendarView({ onOpenEvent }) {
  const [monthIdx, setMonthIdx] = React.useState(1); // 0=NOV 1=DEC 2=JAN
  const months = ['NOV', 'DEC', 'JAN'];
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => { const t = setTimeout(() => setMounted(true), 50); return () => clearTimeout(t); }, []);

  // Group events by day
  const days = React.useMemo(() => {
    const map = {};
    EVENTS.forEach(e => {
      const k = `${e.day}-${e.date}`;
      if (!map[k]) map[k] = { day: e.day, date: e.date, month: e.month, events: [] };
      map[k].events.push(e);
    });
    return Object.values(map);
  }, []);

  const dayColors = [PALETTE.lavender, PALETTE.rose, PALETTE.mint, PALETTE.butter, PALETTE.sky, PALETTE.peach];

  return (
    <div style={{ padding: '0 0 120px', fontFamily: 'Space Grotesk, system-ui' }}>
      {/* Month switcher */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 0, padding: '6px 20px 22px',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(-8px)',
        transition: 'all 0.5s cubic-bezier(.2,.8,.2,1)',
      }}>
        {months.map((m, i) => {
          const on = i === monthIdx;
          return (
            <button key={m}
              onClick={() => setMonthIdx(i)}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontFamily: 'Instrument Serif, serif',
                fontSize: on ? 32 : 22,
                color: on ? PALETTE.ink : 'rgba(0,0,0,0.25)',
                fontWeight: 400, letterSpacing: -0.3,
                padding: '0 12px', transition: 'all 0.4s cubic-bezier(.3,1.3,.4,1)',
                fontStyle: on ? 'italic' : 'normal',
              }}>
              {on && <span style={{ marginRight: 8, fontSize: 16, fontStyle: 'normal', color: PALETTE.orange }}>‹</span>}
              {m}
              {on && <span style={{ marginLeft: 8, fontSize: 16, fontStyle: 'normal', color: PALETTE.orange }}>›</span>}
            </button>
          );
        })}
      </div>

      {/* Day cards stack */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '0 20px' }}>
        {days.map((d, i) => (
          <DayCard key={d.date} d={d} index={i} color={dayColors[i % dayColors.length]}
            mounted={mounted} onOpenEvent={onOpenEvent} />
        ))}
      </div>
    </div>
  );
}

function DayCard({ d, index, color, mounted, onOpenEvent }) {
  const [expanded, setExpanded] = React.useState(index === 0);

  // timeline 6am to 11pm
  const startH = 6, endH = 23;
  const range = (endH - startH) * 60;

  return (
    <div style={{
      background: color, borderRadius: 26, padding: '18px 18px 18px 20px',
      color: PALETTE.ink, position: 'relative', overflow: 'hidden',
      transform: `translateY(${mounted ? 0 : 18}px)`,
      opacity: mounted ? 1 : 0,
      transition: `all 0.55s cubic-bezier(.2,.9,.2,1) ${0.08 + index * 0.05}s`,
      boxShadow: `0 4px 14px ${hexToRgba(color, 0.25)}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Date block */}
        <div style={{ flexShrink: 0, width: 92 }}>
          <div style={{
            fontFamily: 'Space Grotesk, system-ui', fontSize: 13,
            fontWeight: 500, letterSpacing: 0.2, opacity: 0.6,
          }}>{d.day === 'Sat' || d.day === 'Sun' ? d.day + 'urday'.slice(0, d.day === 'Sat' ? 5 : 0) : fullDay(d.day)}</div>
          <div style={{
            fontFamily: 'Instrument Serif, serif', fontSize: 56,
            lineHeight: 0.9, letterSpacing: -1.5, marginTop: 4,
          }}>{d.date}</div>
          <div style={{
            fontFamily: 'Instrument Serif, serif', fontSize: 28,
            fontStyle: 'italic', color: PALETTE.orange, lineHeight: 1,
            marginTop: 2, letterSpacing: -0.5,
          }}>{d.month}</div>
        </div>

        {/* Mini timeline */}
        <div style={{ flex: 1, position: 'relative', minHeight: 110, paddingTop: 6 }}>
          <div style={{ position: 'relative', height: 90 }}>
            {/* hour lines */}
            {[6, 10, 14, 18, 22].map(h => {
              const left = ((h - startH) * 60 / range) * 100;
              return (
                <div key={h} style={{
                  position: 'absolute', left: `${left}%`, top: 0, bottom: 20,
                  width: 1, background: 'rgba(0,0,0,0.1)',
                }}>
                  <div style={{
                    position: 'absolute', top: -4, left: 4,
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9,
                    opacity: 0.45, letterSpacing: 0.4,
                  }}>{h}</div>
                </div>
              );
            })}
            {/* events as chips on timeline */}
            {d.events.map((ev, ei) => {
              const startM = parseHM(ev.start) - startH * 60;
              const endM = parseHM(ev.end) - startH * 60;
              const left = (startM / range) * 100;
              const width = Math.max(((endM - startM) / range) * 100, 10);
              const top = 16 + (ei % 3) * 22;
              return (
                <button key={ev.id}
                  onClick={(e) => { e.stopPropagation(); onOpenEvent(ev); }}
                  style={{
                    position: 'absolute', left: `${left}%`, top, width: `${width}%`,
                    background: PALETTE.ink, color: '#fff',
                    borderRadius: 6, border: 'none',
                    padding: '3px 8px',
                    fontFamily: 'Space Grotesk, system-ui', fontSize: 10, fontWeight: 500,
                    textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis', cursor: 'pointer',
                    transition: 'transform 0.25s cubic-bezier(.3,1.3,.4,1)',
                    minHeight: 18,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {ev.title}
                </button>
              );
            })}
            {/* Add chip */}
            <button
              onClick={() => {}}
              style={{
                position: 'absolute', right: 0, bottom: 0,
                width: 22, height: 22, borderRadius: 999,
                background: 'rgba(0,0,0,0.12)', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: PALETTE.ink, fontSize: 14,
              }}>+</button>
          </div>
        </div>
      </div>

      {/* Event pills below */}
      {d.events.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10, paddingLeft: 106 }}>
          {d.events.map(ev => (
            <div key={'p' + ev.id} style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
              background: 'rgba(0,0,0,0.08)', padding: '3px 8px', borderRadius: 999,
              letterSpacing: 0.2,
            }}>{ev.start}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function fullDay(d) {
  return { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }[d] || d;
}

Object.assign(window, { CalendarView, DayCard });
