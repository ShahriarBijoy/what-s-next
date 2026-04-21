import { useEffect, useMemo, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { PALETTE, CATEGORIES, CAT_ICON, hexToRgba, type CategoryId } from '../types';
import { encodeCategoryMarker, resolveDefaultCalendarId } from '../services/calendar';
import { haptic } from '../services/haptics';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

const DAY_PILL_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_TITLE = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
      // custom sheet, no need to bounce through the OS creation UI. Pin to
      // the OS default calendar so the event actually appears in the user's
      // synced calendar app, not a hidden local-only one.
      const calendarId = await resolveDefaultCalendarId();
      await CapacitorCalendar.createEvent({
        title: cleanTitle,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
        notes: encodeCategoryMarker(cat),
        ...(calendarId ? { calendarId } : {}),
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
              onClick={() => {
                if (off !== selectedOffset) haptic('tick');
                onChange(off);
              }}
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

// Wheel geometry — each item is ITEM_H px tall and we show VISIBLE items
// with the middle one selected. Must stay odd so there's a single centered
// row to align the highlight bar with.
const ITEM_H = 40;
const VISIBLE = 5;
const PAD_SLOTS = Math.floor(VISIBLE / 2);
const MINUTES_STEP = 5;

const HOUR_VALUES = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTE_VALUES = Array.from({ length: 60 / MINUTES_STEP }, (_, i) => i * MINUTES_STEP);
const AMPM_VALUES = ['AM', 'PM'] as const;

function TimeField({ label, minutes, onChange, minMinutes = 0 }: TimeFieldProps) {
  const h24 = Math.floor(minutes / 60);
  const m = minutes % 60;
  const displayH = ((h24 + 11) % 12) + 1;
  // Snap the shown minute to the wheel's step so the highlight always lines
  // up; the real stored value can be anything.
  const snappedMin = Math.round(m / MINUTES_STEP) * MINUTES_STEP;
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';

  const clampMinutes = (v: number) => Math.max(minMinutes, Math.min(23 * 60 + 55, v));

  const setFrom = (h12: number, mm: number, ap: 'AM' | 'PM') => {
    const h24new = ap === 'AM' ? h12 % 12 : (h12 % 12) + 12;
    onChange(clampMinutes(h24new * 60 + mm));
  };

  return (
    <div
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.45)',
        borderRadius: 20,
        padding: '12px 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontSize: 10,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          opacity: 0.6,
          fontWeight: 500,
          paddingLeft: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'stretch',
          gap: 2,
          height: ITEM_H * VISIBLE,
        }}
      >
        {/* Center highlight bar — sits behind the wheel columns and marks
            the currently-selected row. */}
        <div
          style={{
            position: 'absolute',
            top: ITEM_H * PAD_SLOTS,
            left: 2,
            right: 2,
            height: ITEM_H,
            borderRadius: 12,
            background: hexToRgba(PALETTE.ink, 0.08),
            pointerEvents: 'none',
          }}
        />
        <WheelColumn
          values={HOUR_VALUES}
          value={displayH}
          onChange={(v) => setFrom(v, snappedMin, ampm)}
          format={(v) => String(v)}
          align="right"
        />
        <div
          style={{
            alignSelf: 'center',
            fontFamily: 'Instrument Serif, serif',
            fontSize: 26,
            lineHeight: 1,
            opacity: 0.5,
            marginBottom: 2,
          }}
        >
          :
        </div>
        <WheelColumn
          values={MINUTE_VALUES}
          value={snappedMin}
          onChange={(v) => setFrom(displayH, v, ampm)}
          format={(v) => String(v).padStart(2, '0')}
          align="left"
        />
        <WheelColumn
          values={AMPM_VALUES as unknown as string[]}
          value={ampm}
          onChange={(v) => setFrom(displayH, snappedMin, v as 'AM' | 'PM')}
          format={(v) => String(v)}
          align="center"
          monoFont
        />
      </div>
    </div>
  );
}

interface WheelColumnProps<T extends string | number> {
  values: T[];
  value: T;
  onChange: (v: T) => void;
  format: (v: T) => string;
  align?: 'left' | 'center' | 'right';
  monoFont?: boolean;
}

function WheelColumn<T extends string | number>({
  values,
  value,
  onChange,
  format,
  align = 'center',
  monoFont,
}: WheelColumnProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const settleRef = useRef<number | undefined>(undefined);
  const lastCommittedIdxRef = useRef<number>(-1);
  // Visual index = which row the highlight bar is currently over. Updated
  // on every scroll event so we can fire a haptic tick the instant a new
  // value crosses the selection line (the iOS rolling-click feel).
  const lastVisualIdxRef = useRef<number>(-1);

  const indexOfValue = (v: T) => {
    const i = values.indexOf(v);
    return i === -1 ? 0 : i;
  };

  // Keep the wheel synced to the external value — runs on mount and whenever
  // the prop changes from elsewhere (e.g. start-time bump shifting end).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const i = indexOfValue(value);
    // Avoid fighting the user's in-flight scroll.
    if (lastCommittedIdxRef.current === i) return;
    const target = i * ITEM_H;
    if (Math.abs(el.scrollTop - target) < 2) return;
    el.scrollTo({ top: target, behavior: 'auto' });
    lastCommittedIdxRef.current = i;
    lastVisualIdxRef.current = i;
  }, [value, values]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;

    // Haptic tick whenever a new value passes under the highlight bar, so
    // a swipe produces "click-click-click" like an iOS picker. This runs on
    // every scroll event (not debounced), so it feels live.
    const visualIdx = Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / ITEM_H)));
    if (visualIdx !== lastVisualIdxRef.current) {
      if (lastVisualIdxRef.current >= 0) haptic('tick');
      lastVisualIdxRef.current = visualIdx;
    }

    if (settleRef.current) window.clearTimeout(settleRef.current);
    // Debounce the *commit* separately from the tick: wait for scroll to
    // settle, then snap precisely to the nearest value and emit onChange.
    settleRef.current = window.setTimeout(() => {
      const raw = el.scrollTop / ITEM_H;
      const idx = Math.max(0, Math.min(values.length - 1, Math.round(raw)));
      const snapped = idx * ITEM_H;
      if (Math.abs(el.scrollTop - snapped) > 0.5) {
        el.scrollTo({ top: snapped, behavior: 'smooth' });
      }
      if (idx !== lastCommittedIdxRef.current) {
        lastCommittedIdxRef.current = idx;
        const next = values[idx];
        if (next !== value) onChange(next);
      }
    }, 120);
  };

  const textAlign = align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center';
  const paddingX = align === 'center' ? 6 : 10;

  return (
    <div
      ref={ref}
      onScroll={handleScroll}
      style={{
        flex: 1,
        height: ITEM_H * VISIBLE,
        overflowY: 'auto',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        touchAction: 'pan-y',
        position: 'relative',
      }}
    >
      <div style={{ paddingTop: ITEM_H * PAD_SLOTS, paddingBottom: ITEM_H * PAD_SLOTS }}>
        {values.map((v, i) => {
          const on = v === value;
          // Gentle fall-off so far-away rows feel out of focus without
          // disappearing entirely.
          const dist = Math.abs(i - indexOfValue(value));
          const opacity = on ? 1 : Math.max(0.2, 0.7 - dist * 0.18);
          return (
            <div
              key={String(v)}
              onClick={() => {
                const el = ref.current;
                if (!el) return;
                el.scrollTo({ top: i * ITEM_H, behavior: 'smooth' });
              }}
              style={{
                height: ITEM_H,
                scrollSnapAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: textAlign,
                padding: `0 ${paddingX}px`,
                fontFamily: monoFont ? 'JetBrains Mono, monospace' : 'Instrument Serif, serif',
                fontSize: monoFont ? 14 : 28,
                fontWeight: monoFont ? 600 : 400,
                letterSpacing: monoFont ? 1 : -0.3,
                lineHeight: 1,
                color: PALETTE.ink,
                opacity,
                transition: 'opacity 0.2s',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              {format(v)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
