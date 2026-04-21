import { PALETTE, hexToRgba } from '../types';

interface Props {
  onClick: () => void;
  rotate: boolean;
}

export function PlusButton({ onClick, rotate }: Props) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 44,
        height: 44,
        borderRadius: 999,
        background: PALETTE.orange,
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: `0 6px 16px ${hexToRgba(PALETTE.orange, 0.35)}`,
        transition: 'transform 0.4s cubic-bezier(.4,1.6,.4,1)',
        transform: rotate ? 'rotate(135deg)' : 'rotate(0deg)',
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18">
        <path d="M9 2v14M2 9h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </button>
  );
}
