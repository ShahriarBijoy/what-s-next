import { PALETTE } from '../types';

interface Option<T extends string> {
  value: T;
  label: string;
}

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: Option<T>[];
}

export function SegControl<T extends string>({ value, onChange, options }: Props<T>) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'rgba(0,0,0,0.06)',
        borderRadius: 999,
        padding: 5,
        position: 'relative',
        fontFamily: 'Space Grotesk, system-ui',
        fontSize: 17,
        fontWeight: 500,
      }}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            style={{
              padding: '10px 22px',
              borderRadius: 999,
              border: 'none',
              background: on ? PALETTE.ink : 'transparent',
              color: on ? '#fff' : PALETTE.ink,
              cursor: 'pointer',
              transition: 'background 0.35s cubic-bezier(.4,1.4,.5,1), color 0.25s',
              letterSpacing: -0.1,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
