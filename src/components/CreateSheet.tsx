import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { PALETTE, CATEGORIES, CAT_ICON, type CategoryId } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

// Turn "HH:MM" into a Date on the given base day.
function composeDate(base: Date, hm: string): Date {
  const [h, m] = hm.split(':').map(Number);
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

export function CreateSheet({ open, onClose, onCreated }: Props) {
  const [mounted, setMounted] = useState(false);
  const [cat, setCat] = useState<CategoryId>('work');
  const [title, setTitle] = useState('');
  const [startHM, setStartHM] = useState('15:00');
  const [endHM, setEndHM] = useState('16:00');
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

  if (!open) return null;

  const selectedCat = CATEGORIES.find((c) => c.id === cat)!;

  const handleSave = async () => {
    setError(null);
    const cleanTitle = title.trim() || `${selectedCat.label} event`;

    if (!Capacitor.isNativePlatform()) {
      // On web, just close — no EventKit available. The prototype fallback
      // events remain visible.
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
      const today = new Date();
      const startDate = composeDate(today, startHM);
      const endDate = composeDate(today, endHM);
      if (endDate <= startDate) endDate.setHours(endDate.getHours() + 1);

      await CapacitorCalendar.createEventWithPrompt({
        title: cleanTitle,
        startDate: startDate.getTime(),
        endDate: endDate.getTime(),
      });

      onCreated?.();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not create event');
    } finally {
      setSaving(false);
    }
  };

  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' }).toUpperCase();

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
          transform: `translateY(${mounted ? 0 : 100}%)`,
          transition: 'transform 0.55s cubic-bezier(.2,.9,.2,1), background 0.5s',
          fontFamily: 'Space Grotesk, system-ui',
          color: PALETTE.ink,
          boxShadow: '0 -10px 40px rgba(0,0,0,0.2)',
        }}
      >
        <div style={{ width: 40, height: 5, borderRadius: 999, background: 'rgba(0,0,0,0.2)', margin: '0 auto 18px' }} />

        <div style={{ fontFamily: 'Instrument Serif, serif', fontSize: 40, letterSpacing: -0.8, lineHeight: 1, marginBottom: 4 }}>
          New event
        </div>
        <div style={{ fontSize: 13, opacity: 0.6, marginBottom: 18 }}>{todayLabel}</div>

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

        <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
          <TimeField label="Start" value={startHM} onChange={setStartHM} />
          <TimeField label="End" value={endHM} onChange={setEndHM} />
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

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label
      style={{
        flex: 1,
        background: 'rgba(255,255,255,0.5)',
        borderRadius: 18,
        padding: '12px 16px',
        display: 'block',
        cursor: 'text',
      }}
    >
      <div style={{ fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.6, fontWeight: 500 }}>{label}</div>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: 'transparent',
          border: 'none',
          padding: 0,
          marginTop: 2,
          fontFamily: 'Instrument Serif, serif',
          fontSize: 22,
          letterSpacing: -0.3,
          color: PALETTE.ink,
          outline: 'none',
          width: '100%',
        }}
      />
    </label>
  );
}
