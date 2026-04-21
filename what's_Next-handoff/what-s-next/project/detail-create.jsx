// ───────────────── EVENT DETAIL (full-screen overlay) ─────────────────

function EventDetail({ ev, onClose }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  if (!ev) return null;

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 280);
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 100,
      background: ev.color, color: ev.dark ? '#fff' : PALETTE.ink,
      transform: `translateY(${mounted ? 0 : 100}%)`,
      transition: 'transform 0.55s cubic-bezier(.2,.9,.2,1)',
      overflowY: 'auto',
      fontFamily: 'Space Grotesk, system-ui',
      paddingBottom: 40,
    }}>
      {/* top bar */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        padding: '60px 20px 12px', alignItems: 'center',
      }}>
        <button onClick={handleClose} style={{
          width: 42, height: 42, borderRadius: 999,
          background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'inherit',
        }}>
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 11,
          background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
          padding: '7px 14px', borderRadius: 999, letterSpacing: 1,
          textTransform: 'uppercase', fontWeight: 500,
        }}>
          <span style={{ marginRight: 6 }}>{CAT_ICON[ev.cat]}</span>{ev.cat}
        </div>
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        {/* Date */}
        <div style={{
          fontFamily: 'Space Grotesk, system-ui', fontSize: 13,
          fontWeight: 500, letterSpacing: 0.4, textTransform: 'uppercase', opacity: 0.65,
          transform: `translateY(${mounted ? 0 : 16}px)`, opacity: mounted ? 0.65 : 0,
          transition: 'all 0.5s cubic-bezier(.2,.9,.2,1) 0.1s',
        }}>
          {fullDay(ev.day)} · {ev.date} {ev.month}
        </div>

        {/* Title — huge */}
        <div style={{
          fontFamily: 'Instrument Serif, serif', fontSize: 56,
          lineHeight: 0.95, letterSpacing: -1.5, marginTop: 8,
          transform: `translateY(${mounted ? 0 : 24}px)`, opacity: mounted ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.18s',
        }}>
          {ev.title}
        </div>

        {/* Location */}
        <div style={{
          fontSize: 15, marginTop: 10, opacity: 0.75,
          transform: `translateY(${mounted ? 0 : 16}px)`, opacity: mounted ? 0.75 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.25s',
        }}>
          <span style={{ marginRight: 6 }}>◉</span>{ev.loc}
        </div>

        {/* Time trio */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 26,
          transform: `translateY(${mounted ? 0 : 18}px)`, opacity: mounted ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.3s',
        }}>
          <TimeBlock label="Start" value={ev.start} big dark={ev.dark} />
          <TimeBlock label="Duration" value={ev.dur} dark={ev.dark} />
          <TimeBlock label="End" value={ev.end} big dark={ev.dark} />
        </div>

        {/* People */}
        {ev.people > 1 && (
          <div style={{
            background: ev.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
            borderRadius: 20, padding: '14px 16px', marginTop: 14,
            display: 'flex', alignItems: 'center', gap: 12,
            transform: `translateY(${mounted ? 0 : 18}px)`, opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.36s',
          }}>
            <div style={{ display: 'flex' }}>
              {Array.from({ length: Math.min(ev.people, 4) }).map((_, i) => (
                <div key={i} style={{
                  width: 32, height: 32, borderRadius: 999,
                  background: [PALETTE.orange, PALETTE.lavender, PALETTE.mint, PALETTE.butter][i],
                  border: `2px solid ${ev.color}`,
                  marginLeft: i === 0 ? 0 : -10,
                  fontFamily: 'Instrument Serif, serif', fontSize: 14,
                  color: PALETTE.ink,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>{['A', 'M', 'J', 'K'][i]}</div>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>
              {ev.people} people attending
            </div>
          </div>
        )}

        {/* Notes */}
        {ev.notes && (
          <div style={{
            background: ev.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.45)',
            borderRadius: 20, padding: '16px 18px', marginTop: 12,
            transform: `translateY(${mounted ? 0 : 18}px)`, opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.42s',
          }}>
            <div style={{
              fontSize: 11, letterSpacing: 1, textTransform: 'uppercase',
              opacity: 0.6, marginBottom: 6, fontWeight: 500,
            }}>Notes</div>
            <div style={{
              fontFamily: 'Instrument Serif, serif', fontSize: 20,
              lineHeight: 1.3, letterSpacing: -0.2,
            }}>{ev.notes}</div>
          </div>
        )}

        {/* Action buttons */}
        <div style={{
          display: 'flex', gap: 10, marginTop: 22,
          transform: `translateY(${mounted ? 0 : 18}px)`, opacity: mounted ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.48s',
        }}>
          <button style={{
            flex: 1, background: PALETTE.ink, color: '#fff',
            border: 'none', borderRadius: 18, padding: '15px',
            fontFamily: 'Space Grotesk, system-ui', fontSize: 15, fontWeight: 500,
            cursor: 'pointer', letterSpacing: -0.1,
          }}>✓ Attending</button>
          <button style={{
            width: 54, background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            color: 'inherit', border: 'none', borderRadius: 18, padding: '15px',
            cursor: 'pointer', fontSize: 18,
          }}>⤴</button>
          <button style={{
            width: 54, background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
            color: 'inherit', border: 'none', borderRadius: 18, padding: '15px',
            cursor: 'pointer', fontSize: 18,
          }}>⋯</button>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ label, value, big, dark }) {
  return (
    <div style={{
      background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      borderRadius: 20, padding: '14px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500 }}>{label}</div>
      <div style={{
        fontFamily: 'Instrument Serif, serif',
        fontSize: big ? 30 : 20, marginTop: 4, letterSpacing: -0.5,
        lineHeight: 1.05,
      }}>{value}</div>
    </div>
  );
}

// ───────────────── CREATE SHEET ─────────────────

function CreateSheet({ open, onClose }) {
  const [mounted, setMounted] = React.useState(false);
  const [cat, setCat] = React.useState('work');
  const [title, setTitle] = React.useState('');

  React.useEffect(() => {
    if (open) {
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [open]);

  if (!open) return null;

  const selectedCat = CATEGORIES.find(c => c.id === cat);

  return (
    <>
      {/* backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0, zIndex: 90,
        background: 'rgba(0,0,0,0.4)',
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.35s',
      }} />
      {/* sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 95,
        background: selectedCat.color,
        borderRadius: '32px 32px 0 0',
        padding: '14px 22px 28px',
        transform: `translateY(${mounted ? 0 : 100}%)`,
        transition: 'transform 0.55s cubic-bezier(.2,.9,.2,1), background 0.5s',
        fontFamily: 'Space Grotesk, system-ui', color: PALETTE.ink,
        boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
      }}>
        <div style={{
          width: 40, height: 5, borderRadius: 999,
          background: 'rgba(0,0,0,0.2)', margin: '0 auto 18px',
        }} />

        <div style={{
          fontFamily: 'Instrument Serif, serif', fontSize: 40,
          letterSpacing: -0.8, lineHeight: 1, marginBottom: 4,
        }}>New event</div>
        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 18 }}>Tuesday 13 DEC</div>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="What's happening?"
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.5)', border: 'none',
            borderRadius: 18, padding: '16px 18px',
            fontFamily: 'Instrument Serif, serif', fontSize: 22,
            color: PALETTE.ink, letterSpacing: -0.3,
            outline: 'none',
          }}
        />

        {/* time row */}
        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 18, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500 }}>Start</div>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, letterSpacing: -0.3 }}>15:00</div>
          </div>
          <div style={{
            flex: 1, background: 'rgba(255,255,255,0.5)', borderRadius: 18, padding: '12px 16px',
          }}>
            <div style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500 }}>End</div>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, letterSpacing: -0.3 }}>16:00</div>
          </div>
        </div>

        {/* Category chooser */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500, marginBottom: 8 }}>Category</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map(c => {
              const on = c.id === cat;
              return (
                <button key={c.id}
                  onClick={() => setCat(c.id)}
                  style={{
                    padding: '8px 14px', borderRadius: 999,
                    background: on ? PALETTE.ink : 'rgba(255,255,255,0.5)',
                    color: on ? '#fff' : PALETTE.ink,
                    border: 'none', cursor: 'pointer',
                    fontFamily: 'Space Grotesk, system-ui', fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 6,
                    transition: 'all 0.3s cubic-bezier(.3,1.3,.4,1)',
                    transform: on ? 'scale(1.05)' : 'scale(1)',
                  }}>
                  <span style={{ fontSize: 10 }}>{CAT_ICON[c.id]}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Create button */}
        <button
          onClick={onClose}
          style={{
            width: '100%', marginTop: 20,
            background: PALETTE.ink, color: '#fff', border: 'none',
            borderRadius: 20, padding: '16px',
            fontFamily: 'Space Grotesk, system-ui', fontSize: 16, fontWeight: 500,
            cursor: 'pointer', letterSpacing: -0.1,
          }}>
          Add to calendar →
        </button>
      </div>
    </>
  );
}

Object.assign(window, { EventDetail, CreateSheet, TimeBlock });
