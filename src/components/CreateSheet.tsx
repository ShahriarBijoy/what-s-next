import { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { PALETTE, CATEGORIES, CAT_ICON, hexToRgba, type CategoryId } from '../types';
import { encodeCategoryMarker } from '../services/calendar';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const DAY_PILL_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_TITLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function sameDate(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function formatFullDate(d: Date): string {
  const wk = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()];
  return `${wk}, ${d.getDate()} ${MONTH_TITLE[d.getMonth()]}`.toUpperCase();
}

export function CreateSheet({ open, onClose, onCreated }: Props) {
  const [mounted, setMounted] = useState(false);
  const [cat, setCat] = useState<CategoryId>('work');
  const [title, setTitle] = useState('');
  const [startMinutes, setStartMinutes] = useState(15 * 60);
  const [endMinutes, setEndMinutes] = useState(16 * 60);
  const [dateOffset, setDateOffset] = useState(0); // 0 = today
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => setMounted(true), 20);
      return () => clearTimeout(t);
    }
    setMounted(false);
    setError(null);
    return;
  }, [open]);

  // Hooks must run in a stable order, so everything below runs whether or not
  // the sheet is open. The early `return null` lives further down.
  const todayMidnight = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  if (!open) return null;

  const selectedCat = CATEGORIES.find((c) => c.id === cat)!;
  const selectedDate = addDays(todayMidnight, dateOffset);

  const handleSave = async () => {
    setError(null);
    const cleanTitle = title.trim() || `${selectedCat.label} event`;

    if (!Capacitor.isNativePlatform()) {
      onClose();
      return;
    }

    setSaving(true);
    try {
      const perm = await CapacitorCalendar.requestAllPermissions();
      if (perm.writeCalendar !== 'granted') {
        setError('Calendar write permission denied');
        setSaving(false);
        return;
      }

      const startDate = new Date(selectedDate);
      startDate.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
      const endDate = new Date(selectedDate);
      endDate.setHours(Math.floor(endMinutes / 60), endMinutes % 60, 0, 0);
      if (endDate <= startDate) endDate.setTime(startDate.getTime() + 60 * 60 * 1000);

      // Create silently — we already collected everything we need via the
      // custom sheet, no need to bounce through the OS creation UI.
      await CapacitorCalendar.createEvent({
        title: cleanTitle,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        notes: encodeCategoryMarker(cat),
      });

      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 90,
          background: 'rgba(0,0,0,0.4)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.35s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 95,
          background: selectedCat.color,
          borderRadius: '32px 32px 0 0',
          padding: '14px 22px 28px',
          paddingBottom: 'calc(28px + env(safe-area-inset-bottom, 0px))',
          transform: `translateY(${mounted ? 0 : 100}%)`,
          transition: 'transform 0.55s cubic-bezier(.2,.9,.2,1), background 0.5s',
          fontFamily: 'Space Grotesk, system-ui',
          color: PALETTE.ink,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
          maxHeight: '92%',
          overflowY: 'auto',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.2)', margin: '0 auto 18px' }} />

        <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, letterSpacing: -0.8, lineHeight: 1, marginBottom: 4 }}>
          New event
        </div>
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 14, letterSpacing: 0.8 }}>{formatFullDate(selectedDate)}</div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's happening?"
          style={{
            width: '100%',
            boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.5)',
            border: 'none',
            borderRadius: 18,
            padding: '16px 18px',
            fontFamily: 'Instrument Serif, serif',
            fontSize: 22,
            color: PALETTE.ink,
            letterSpacing: -0.3,
            outline: 'none',
          }}
        />

        <DateStrip
          selectedOffset={dateOffset}
          onChange={setDateOffset}
          todayMidnight={todayMidnight}
        />

        <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
          <TimeField
            label="Start"
            minutes={startMinutes}
            onChange={(m) => {
              setStartMinutes(m);
              if (endMinutes <= m) setEndMinutes(Math.min(m + 60, 23 * 60 + 55));
            }}
          />
          <TimeField
            label="End"
            minutes={endMinutes}
            onChange={setEndMinutes}
            minMinutes={startMinutes + 5}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500, marginBottom: 8 }}>
            Category
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {CATEGORIES.map((c) => {
              const on = c.id === cat;
              return (
                <button
                  key={c.id}
                  onClick={() => setCat(c.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    background: on ? PALETTE.ink : 'rgba(255,255,255,0.5)',
                    color: on ? '#fff' : PALETTE.ink,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Space Grotesk, system-ui',
                    fontSize: 13,
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.3s cubic-bezier(.3,1.3,.4,1)',
                    transform: on ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <span style={{ fontSize: 10 }}>{CAT_ICON[c.id]}</span>
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div
            style={{
              marginTop: 14,
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              color: PALETTE.ink,
              background: 'rgba(0,0,0,0.08)',
              padding: '8px 12px',
              borderRadius: 12,
            }}
          >
            {error}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            marginTop: 20,
            background: PALETTE.ink,
            color: '#fff',
            border: 'none',
            borderRadius: 20,
            padding: '16px',
            fontFamily: 'Space Grotesk, system-ui',
            fontSize: 16,
            fontWeight: 500,
            cursor: saving ? 'wait' : 'pointer',
            letterSpacing: -0.1,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Add to calendar →'}
        </button>
      </div>
    </>
  );
}

interface DateStripProps {
  selectedOffset: number;
  onChange: (offset: number) => void;
  todayMidnight: Date;
}

function DateStrip({ selectedOffset, onChange, todayMidnight }: DateStripProps) {
  const offsets = useMemo(() => Array.from({ length: 21 }, (_, i) => i), []);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Keep the selected pill in view when the sheet opens or the user skips
    // ahead via some other path.
    const el = scrollRef.current;
    if (!el) return;
    const target = el.querySelector<HTMLElement>(`[data-off="${selectedOffset}"]`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedOffset]);

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ fontSize: 11, letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500, marginBottom: 8 }}>
        Date
      </div>
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 6,
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {offsets.map((off) => {
          const d = addDays(todayMidnight, off);
          const on = off === selectedOffset;
          const isToday = off === 0;
          return (
            <button
              key={off}
              data-off={off}
              onClick={() => onChange(off)}
              style={{
                flexShrink: 0,
                scrollSnapAlign: 'center',
                width: 60,
                padding: '10px 0',
                borderRadius: 16,
                border: 'none',
                background: on ? PALETTE.ink : 'rgba(255,255,255,0.5)',
                color: on ? '#fff' : PALETTE.ink,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                transition: 'background 0.25s, transform 0.25s cubic-bezier(.3,1.3,.4,1)',
                transform: on ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 9,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  opacity: on ? 0.85 : 0.55,
                  fontWeight: 500,
                }}
              >
                {isToday ? 'Today' : DAY_PILL_SHORT[d.getDay()]}
              </span>
              <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, letterSpacing: -0.3, lineHeight: 1 }}>
                {d.getDate()}
              </span>
              <span
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 8,
                  letterSpacing: 0.5,
                  textTransform: 'uppercase',
                  opacity: on ? 0.7 : 0.45,
                  fontWeight: 500,
                }}
              >
                {MONTH_TITLE[d.getMonth()]}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface TimeFieldProps {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  minMinutes?: number;
}

function TimeField({ label, minutes, onChange, minMinutes = 0 }: TimeFieldProps) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const displayH = ((h + 11) % 12) + 1;
  const ampm = h < 12 ? 'AM' : 'PM';

  const clamp = (v: number) => Math.max(minMinutes, Math.min(23 * 60 + 55, v));

  const stepHour = (delta: number) => onChange(clamp(minutes + delta * 60));
  const stepMinute = (delta: number) => {
    // 5-minute increments — enough granularity without making the stepper
    // tedious to operate.
    const stepped = Math.round(minutes / 5) * 5 + delta * 5;
    onChange(clamp(stepped));
  };

  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 18,
        padding: '10px 14px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          opacity: 0.6,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
        <Stepper value={displayH} onUp={() => stepHour(1)} onDown={() => stepHour(-1)} />
        <span style={{ fontFamily: 'Instrument Serif, serif', fontSize: 22, lineHeight: 1, opacity: 0.5 }}>:</span>
        <Stepper value={String(m).padStart(2, '0')} onUp={() => stepMinute(1)} onDown={() => stepMinute(-1)} />
        <button
          onClick={() => onChange(clamp(minutes + (h < 12 ? 12 : -12) * 60))}
          style={{
            background: 'transparent',
            border: `1px solid ${hexToRgba(PALETTE.ink, 0.25)}`,
            borderRadius: 10,
            padding: '4px 8px',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 1,
            color: PALETTE.ink,
            cursor: 'pointer',
          }}
        >
          {ampm}
        </button>
      </div>
    </div>
  );
}

function Stepper({ value, onUp, onDown }: { value: number | string; onUp: () => void; onDown: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <StepperArrow dir="up" onClick={onUp} />
      <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 24, letterSpacing: -0.3, lineHeight: 1, minWidth: 24, textAlign: 'center' }}>
        {value}
      </div>
      <StepperArrow dir="down" onClick={onDown} />
    </div>
  );
}

function StepperArrow({ dir, onClick }: { dir: 'up' | 'down'; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={dir === 'up' ? 'increase' : 'decrease'}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 2,
        cursor: 'pointer',
        color: PALETTE.ink,
        opacity: 0.6,
        lineHeight: 0,
      }}
    >
      <svg width="12" height="8" viewBox="0 0 12 8">
        {dir === 'up' ? (
          <path d="M1 6l5-5 5 5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M1 2l5 5 5-5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}
