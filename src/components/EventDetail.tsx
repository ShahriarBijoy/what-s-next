import { useEffect, useState } from 'react';
import { PALETTE, CAT_ICON, fullDay, type CalendarEvent } from '../types';

interface Props {
  ev: CalendarEvent;
  onClose: () => void;
}

export function EventDetail({ ev, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setMounted(false);
    setTimeout(onClose, 280);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: ev.color,
        color: ev.dark ? '#fff' : PALETTE.ink,
        transform: `translateY(${mounted ? 0 : 100}%)`,
        transition: 'transform 0.55s cubic-bezier(.2,.9,.2,1)',
        overflowY: 'auto',
        fontFamily: 'Space Grotesk, system-ui',
        paddingBottom: 40,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '60px 20px 12px', alignItems: 'center' }}>
        <button
          onClick={handleClose}
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'inherit',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)',
            padding: '7px 14px',
            borderRadius: 999,
            letterSpacing: 1,
            textTransform: 'uppercase',
            fontWeight: 500,
          }}
        >
          <span style={{ marginRight: 6 }}>{CAT_ICON[ev.cat]}</span>
          {ev.cat}
        </div>
      </div>

      <div style={{ padding: '24px 22px 0' }}>
        <div
          style={{
            fontFamily: 'Space Grotesk, system-ui',
            fontSize: 13,
            fontWeight: 500,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
            transform: `translateY(${mounted ? 0 : 16}px)`,
            opacity: mounted ? 0.65 : 0,
            transition: 'all 0.5s cubic-bezier(.2,.9,.2,1) 0.1s',
          }}
        >
          {fullDay(ev.day)} · {ev.date} {ev.month}
        </div>

        <div
          style={{
            fontFamily: 'Instrument Serif, serif',
            fontSize: 56,
            lineHeight: 0.95,
            letterSpacing: -1.5,
            marginTop: 8,
            transform: `translateY(${mounted ? 0 : 24}px)`,
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.18s',
          }}
        >
          {ev.title}
        </div>

        {ev.loc && (
          <div
            style={{
              fontSize: 15,
              marginTop: 10,
              transform: `translateY(${mounted ? 0 : 16}px)`,
              opacity: mounted ? 0.75 : 0,
              transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.25s',
            }}
          >
            <span style={{ marginRight: 6 }}>◉</span>
            {ev.loc}
          </div>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            marginTop: 26,
            transform: `translateY(${mounted ? 0 : 18}px)`,
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.3s',
          }}
        >
          <TimeBlock label="Start" value={ev.start} big dark={!!ev.dark} />
          <TimeBlock label="Duration" value={ev.dur} dark={!!ev.dark} />
          <TimeBlock label="End" value={ev.end} big dark={!!ev.dark} />
        </div>

        {ev.people > 1 && (
          <div
            style={{
              background: ev.dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
              borderRadius: 20,
              padding: '14px 16px',
              marginTop: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transform: `translateY(${mounted ? 0 : 18}px)`,
              opacity: mounted ? 1 : 0,
              transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.36s',
            }}
          >
            <div style={{ display: 'flex' }}>
              {Array.from({ length: Math.min(ev.people, 4) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    background: [PALETTE.orange, PALETTE.lavender, PALETTE.mint, PALETTE.butter][i],
                    border: `2px solid ${ev.color}`,
                    marginLeft: i === 0 ? 0 : -10,
                    fontFamily: 'Instrument Serif, serif',
                    fontSize: 14,
                    color: PALETTE.ink,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {['A', 'M', 'J', 'K'][i]}
                </div>
              ))}
            </div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>{ev.people} people attending</div>
          </div>
        )}

        {ev.notes && (
          <div
            style={{
              background: ev.dark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.45)',
              borderRadius: 20,
              padding: '16px 18px',
              marginTop: 12,
              transform: `translateY(${mounted ? 0 : 18}px)`,
              opacity: mounted ? 1 : 0,
              transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.42s',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
                opacity: 0.6,
                marginBottom: 6,
                fontWeight: 500,
              }}
            >
              Notes
            </div>
            <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 20, lineHeight: 1.3, letterSpacing: -0.2 }}>{ev.notes}</div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginTop: 22,
            transform: `translateY(${mounted ? 0 : 18}px)`,
            opacity: mounted ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(.2,.9,.2,1) 0.48s',
          }}
        >
          <button
            style={{
              flex: 1,
              background: PALETTE.ink,
              color: '#fff',
              border: 'none',
              borderRadius: 18,
              padding: '15px',
              fontFamily: 'Space Grotesk, system-ui',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              letterSpacing: -0.1,
            }}
          >
            ✓ Attending
          </button>
          <button
            style={{
              width: 54,
              background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              color: 'inherit',
              border: 'none',
              borderRadius: 18,
              padding: '15px',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ⤴
          </button>
          <button
            style={{
              width: 54,
              background: ev.dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
              color: 'inherit',
              border: 'none',
              borderRadius: 18,
              padding: '15px',
              cursor: 'pointer',
              fontSize: 18,
            }}
          >
            ⋯
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeBlock({ label, value, big, dark }: { label: string; value: string; big?: boolean; dark: boolean }) {
  return (
    <div
      style={{
        background: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
        borderRadius: 20,
        padding: '14px 12px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500 }}>{label}</div>
      <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: big ? 30 : 20, marginTop: 4, letterSpacing: -0.5, lineHeight: 1.05 }}>
        {value}
      </div>
    </div>
  );
}
