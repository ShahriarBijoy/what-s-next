export const PALETTE = {
  cream: '#EDE6D6',
  ink: '#1A1A1A',
  navy: '#4B607F',
  orange: '#F3701E',
  mint: '#B8E5C2',
  sky: '#A9D8E8',
  butter: '#F2D56F',
  lavender: '#C9BBE0',
  rose: '#F0B8BC',
  lime: '#D4E560',
  peach: '#F5C79A',
} as const;

export type CategoryId = 'work' | 'fitness' | 'social' | 'health' | 'fun' | 'travel';

export interface CalendarEvent {
  id: string;
  day: string;
  date: number;
  month: string;
  title: string;
  loc: string;
  start: string;
  end: string;
  dur: string;
  color: string;
  cat: CategoryId;
  people: number;
  notes?: string;
  dark?: boolean;
  dateISO: string;
}

export const CATEGORIES: { id: CategoryId; label: string; color: string }[] = [
  { id: 'work', label: 'Work', color: PALETTE.butter },
  { id: 'fitness', label: 'Fitness', color: PALETTE.mint },
  { id: 'social', label: 'Social', color: PALETTE.orange },
  { id: 'health', label: 'Health', color: PALETTE.sky },
  { id: 'fun', label: 'Fun', color: PALETTE.lime },
  { id: 'travel', label: 'Travel', color: PALETTE.navy },
];

export const CAT_ICON: Record<CategoryId, string> = {
  work: '◼',
  fitness: '▲',
  social: '●',
  health: '+',
  fun: '✦',
  travel: '→',
};

export function hexToRgba(hex: string, a: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

export function parseHM(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

export function fullDay(d: string): string {
  return (
    {
      Mon: 'Monday',
      Tue: 'Tuesday',
      Wed: 'Wednesday',
      Thu: 'Thursday',
      Fri: 'Friday',
      Sat: 'Saturday',
      Sun: 'Sunday',
    }[d] || d
  );
}

export const MONTH_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
