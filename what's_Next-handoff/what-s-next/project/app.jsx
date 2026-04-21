// Calendar app — playful, colorful, non-uniform
// Palette pulled from moodboard + pastels

const PALETTE = {
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
};

// Event data
const EVENTS = [
  { id: 1, day: 'Tue', date: 13, month: 'DEC', title: 'Morning Run', loc: 'Prospect Park', start: '07:00', end: '07:45', dur: '45m', color: PALETTE.mint, cat: 'fitness', people: 1, notes: 'Easy pace, 5km loop.' },
  { id: 2, day: 'Tue', date: 13, month: 'DEC', title: 'Team Standup', loc: 'Zoom · Link ↗', start: '09:30', end: '09:50', dur: '20m', color: PALETTE.butter, cat: 'work', people: 6, notes: 'Sprint 14 kickoff.' },
  { id: 3, day: 'Tue', date: 13, month: 'DEC', title: 'Coffee w/ Amelia', loc: 'Devoción', start: '11:00', end: '11:45', dur: '45m', color: PALETTE.peach, cat: 'social', people: 2, notes: 'Catch up, portfolio review.' },
  { id: 4, day: 'Tue', date: 13, month: 'DEC', title: 'Design Review', loc: 'HQ · Rm 4', start: '14:00', end: '15:00', dur: '1h', color: PALETTE.lavender, cat: 'work', people: 4, notes: 'Present calendar flow v2.' },
  { id: 5, day: 'Tue', date: 13, month: 'DEC', title: 'Pottery Class', loc: 'Clay Studio BK', start: '18:30', end: '20:00', dur: '1h 30m', color: PALETTE.rose, cat: 'fun', people: 1, notes: 'Wheel throwing, week 3.' },
  { id: 6, day: 'Wed', date: 14, month: 'DEC', title: 'Dentist', loc: 'Dr. Park · 5th Ave', start: '08:30', end: '09:15', dur: '45m', color: PALETTE.sky, cat: 'health', people: 1 },
  { id: 7, day: 'Wed', date: 14, month: 'DEC', title: 'App Update Review', loc: 'Slack huddle', start: '10:00', end: '11:00', dur: '1h', color: PALETTE.lime, cat: 'work', people: 3 },
  { id: 8, day: 'Wed', date: 14, month: 'DEC', title: 'Lunch · Ana', loc: 'Rosemary\u2019s', start: '13:00', end: '14:00', dur: '1h', color: PALETTE.orange, cat: 'social', people: 2 },
  { id: 9, day: 'Thu', date: 15, month: 'DEC', title: 'Flight → LAX', loc: 'JFK T5', start: '06:15', end: '09:30', dur: '3h 15m', color: PALETTE.navy, cat: 'travel', people: 1, dark: true },
  { id: 10, day: 'Thu', date: 15, month: 'DEC', title: 'Client Dinner', loc: 'Bestia', start: '19:30', end: '21:30', dur: '2h', color: PALETTE.rose, cat: 'work', people: 5 },
  { id: 11, day: 'Fri', date: 16, month: 'DEC', title: 'Yoga Flow', loc: 'Sky Ting', start: '08:00', end: '09:00', dur: '1h', color: PALETTE.mint, cat: 'fitness', people: 1 },
  { id: 12, day: 'Fri', date: 16, month: 'DEC', title: 'Focus Block', loc: 'Deep Work', start: '10:00', end: '12:30', dur: '2h 30m', color: PALETTE.butter, cat: 'work', people: 1 },
  { id: 13, day: 'Sat', date: 17, month: 'DEC', title: 'Farmers Market', loc: 'Grand Army Plaza', start: '09:00', end: '10:30', dur: '1h 30m', color: PALETTE.lime, cat: 'fun', people: 2 },
  { id: 14, day: 'Sat', date: 17, month: 'DEC', title: 'Lia\u2019s Birthday', loc: 'The Ides', start: '20:00', end: '23:00', dur: '3h', color: PALETTE.orange, cat: 'social', people: 8 },
];

const CATEGORIES = [
  { id: 'work', label: 'Work', color: PALETTE.butter },
  { id: 'fitness', label: 'Fitness', color: PALETTE.mint },
  { id: 'social', label: 'Social', color: PALETTE.orange },
  { id: 'health', label: 'Health', color: PALETTE.sky },
  { id: 'fun', label: 'Fun', color: PALETTE.lime },
  { id: 'travel', label: 'Travel', color: PALETTE.navy },
];

const CAT_ICON = {
  work: '◼',
  fitness: '▲',
  social: '●',
  health: '+',
  fun: '✦',
  travel: '→',
};

// ───────── helpers
function hexToRgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function parseHM(s) {
  const [h, m] = s.split(':').map(Number);
  return h * 60 + m;
}

Object.assign(window, { PALETTE, EVENTS, CATEGORIES, CAT_ICON, hexToRgba, parseHM });
