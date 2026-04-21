import { PALETTE, type CalendarEvent } from '../types';

// Used when running in the browser (no Capacitor plugin) or when calendar
// access is denied. Mirrors the prototype's sample schedule.
export const FALLBACK_EVENTS: CalendarEvent[] = [
  { id: 'f1',  day: 'Tue', date: 13, month: 'DEC', title: 'Morning Run',      loc: 'Prospect Park',    start: '07:00', end: '07:45', dur: '45m',     color: PALETTE.mint,     cat: 'fitness', people: 1, notes: 'Easy pace, 5km loop.',           dateISO: '2024-12-13' },
  { id: 'f2',  day: 'Tue', date: 13, month: 'DEC', title: 'Team Standup',     loc: 'Zoom · Link ↗',    start: '09:30', end: '09:50', dur: '20m',     color: PALETTE.butter,   cat: 'work',    people: 6, notes: 'Sprint 14 kickoff.',              dateISO: '2024-12-13' },
  { id: 'f3',  day: 'Tue', date: 13, month: 'DEC', title: 'Coffee w/ Amelia', loc: 'Devoción',         start: '11:00', end: '11:45', dur: '45m',     color: PALETTE.peach,    cat: 'social',  people: 2, notes: 'Catch up, portfolio review.',     dateISO: '2024-12-13' },
  { id: 'f4',  day: 'Tue', date: 13, month: 'DEC', title: 'Design Review',    loc: 'HQ · Rm 4',        start: '14:00', end: '15:00', dur: '1h',      color: PALETTE.lavender, cat: 'work',    people: 4, notes: 'Present calendar flow v2.',       dateISO: '2024-12-13' },
  { id: 'f5',  day: 'Tue', date: 13, month: 'DEC', title: 'Pottery Class',    loc: 'Clay Studio BK',   start: '18:30', end: '20:00', dur: '1h 30m',  color: PALETTE.rose,     cat: 'fun',     people: 1, notes: 'Wheel throwing, week 3.',         dateISO: '2024-12-13' },
  { id: 'f6',  day: 'Wed', date: 14, month: 'DEC', title: 'Dentist',          loc: 'Dr. Park · 5th Ave', start: '08:30', end: '09:15', dur: '45m',   color: PALETTE.sky,      cat: 'health',  people: 1,                                            dateISO: '2024-12-14' },
  { id: 'f7',  day: 'Wed', date: 14, month: 'DEC', title: 'App Update Review', loc: 'Slack huddle',    start: '10:00', end: '11:00', dur: '1h',      color: PALETTE.lime,     cat: 'work',    people: 3,                                            dateISO: '2024-12-14' },
  { id: 'f8',  day: 'Wed', date: 14, month: 'DEC', title: 'Lunch · Ana',      loc: 'Rosemary’s',  start: '13:00', end: '14:00', dur: '1h',      color: PALETTE.orange,   cat: 'social',  people: 2,                                            dateISO: '2024-12-14' },
  { id: 'f9',  day: 'Thu', date: 15, month: 'DEC', title: 'Flight → LAX',     loc: 'JFK T5',           start: '06:15', end: '09:30', dur: '3h 15m',  color: PALETTE.navy,     cat: 'travel',  people: 1, dark: true,                                dateISO: '2024-12-15' },
  { id: 'f10', day: 'Thu', date: 15, month: 'DEC', title: 'Client Dinner',    loc: 'Bestia',           start: '19:30', end: '21:30', dur: '2h',      color: PALETTE.rose,     cat: 'work',    people: 5,                                            dateISO: '2024-12-15' },
  { id: 'f11', day: 'Fri', date: 16, month: 'DEC', title: 'Yoga Flow',        loc: 'Sky Ting',         start: '08:00', end: '09:00', dur: '1h',      color: PALETTE.mint,     cat: 'fitness', people: 1,                                            dateISO: '2024-12-16' },
  { id: 'f12', day: 'Fri', date: 16, month: 'DEC', title: 'Focus Block',      loc: 'Deep Work',        start: '10:00', end: '12:30', dur: '2h 30m',  color: PALETTE.butter,   cat: 'work',    people: 1,                                            dateISO: '2024-12-16' },
  { id: 'f13', day: 'Sat', date: 17, month: 'DEC', title: 'Farmers Market',   loc: 'Grand Army Plaza', start: '09:00', end: '10:30', dur: '1h 30m',  color: PALETTE.lime,     cat: 'fun',     people: 2,                                            dateISO: '2024-12-17' },
  { id: 'f14', day: 'Sat', date: 17, month: 'DEC', title: 'Lia’s Birthday', loc: 'The Ides',      start: '20:00', end: '23:00', dur: '3h',      color: PALETTE.orange,   cat: 'social',  people: 8,                                            dateISO: '2024-12-17' },
];
