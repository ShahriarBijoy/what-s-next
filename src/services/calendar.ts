import { Capacitor } from '@capacitor/core';
import { CapacitorCalendar } from '@ebarooni/capacitor-calendar';
import { PALETTE, type CalendarEvent, type CategoryId, MONTH_SHORT, DAY_SHORT } from '../types';

// Category → primary tint, matching the prototype's color language.
const CATEGORY_COLOR: Record<CategoryId, string> = {
  work: PALETTE.butter,
  fitness: PALETTE.mint,
  social: PALETTE.orange,
  health: PALETTE.sky,
  fun: PALETTE.lime,
  travel: PALETTE.navy,
};

// Secondary tints used when we want variety within the same category, picked
// by hashing the title so it's stable across reloads.
const VARIETY_TINTS = [PALETTE.peach, PALETTE.lavender, PALETTE.rose] as const;

const CATEGORY_KEYWORDS: { id: CategoryId; keywords: string[] }[] = [
  { id: 'fitness', keywords: ['run', 'gym', 'yoga', 'workout', 'pilates', 'cycle', 'swim', 'hike', 'fitness'] },
  { id: 'health',  keywords: ['doctor', 'dentist', 'clinic', 'therapy', 'appointment', 'checkup', 'health'] },
  { id: 'travel',  keywords: ['flight', 'train', 'airport', 'hotel', 'trip', 'travel', 'vacation'] },
  { id: 'social',  keywords: ['coffee', 'lunch', 'dinner', 'drinks', 'birthday', 'party', 'brunch', 'date'] },
  { id: 'fun',     keywords: ['market', 'class', 'concert', 'movie', 'museum', 'game', 'festival'] },
  { id: 'work',    keywords: ['meeting', 'standup', 'review', 'sync', '1:1', 'call', 'interview', 'client', 'project'] },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickCategory(title: string, loc: string): CategoryId {
  const hay = `${title} ${loc}`.toLowerCase();
  for (const entry of CATEGORY_KEYWORDS) {
    if (entry.keywords.some((k) => hay.includes(k))) return entry.id;
  }
  return 'work';
}

// Category round-trips via a marker in the event's notes, since the underlying
// OS calendar has no category field. We strip the marker from the notes we
// show the user so they never see the raw token.
const VALID_CATS: CategoryId[] = ['work', 'fitness', 'social', 'health', 'fun', 'travel'];
const CAT_MARKER_RE = /\[kd:cat=([a-z]+)\]/i;

export function encodeCategoryMarker(cat: CategoryId): string {
  return `[kd:cat=${cat}]`;
}

function extractCategoryMarker(notes: string | undefined): { cat: CategoryId | null; clean: string | undefined } {
  if (!notes) return { cat: null, clean: notes };
  const m = notes.match(CAT_MARKER_RE);
  if (!m) return { cat: null, clean: notes };
  const found = m[1].toLowerCase() as CategoryId;
  const cat = VALID_CATS.includes(found) ? found : null;
  const clean = notes.replace(CAT_MARKER_RE, '').trim() || undefined;
  return { cat, clean };
}

function fmtHM(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function fmtDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmtISODate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

interface RawEvent {
  id: string;
  title: string;
  startDate: number;
  endDate: number;
  location?: string;
  notes?: string;
  description?: string;
  isAllDay?: boolean;
}

function normalize(raw: RawEvent): CalendarEvent | null {
  if (!raw?.startDate || !raw?.endDate) return null;
  // Skip multi-day all-day events — the design doesn't have a representation
  // for them and they'd swamp the Today view.
  if (raw.isAllDay) return null;

  const start = new Date(raw.startDate);
  const end = new Date(raw.endDate);
  const title = raw.title?.trim() || '(untitled)';
  const loc = raw.location?.trim() || '';

  // An event created through our own UI carries `[kd:cat=…]` in its notes;
  // honor that before falling back to keyword detection.
  const rawNotes = (raw.notes || raw.description)?.trim();
  const { cat: markedCat, clean: cleanNotes } = extractCategoryMarker(rawNotes);
  const cat = markedCat ?? pickCategory(title, loc);

  // Social events rotate through warm tints for visual variety; travel stays
  // navy (dark card); all other categories use their primary tint.
  let color: string = CATEGORY_COLOR[cat];
  if (cat === 'social') {
    color = VARIETY_TINTS[hashString(title) % VARIETY_TINTS.length];
  }
  const dark = cat === 'travel';

  return {
    id: raw.id,
    day: DAY_SHORT[start.getDay()],
    date: start.getDate(),
    month: MONTH_SHORT[start.getMonth()],
    title,
    loc,
    start: fmtHM(start),
    end: fmtHM(end),
    dur: fmtDuration(end.getTime() - start.getTime()),
    color,
    cat,
    people: 1,
    notes: cleanNotes,
    dark,
    dateISO: fmtISODate(start),
  };
}

interface ListEventsOptions {
  from: Date;
  to: Date;
}

export async function ensureCalendarAccess(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const status = await CapacitorCalendar.checkAllPermissions();
    if (status.readCalendar === 'granted') return true;
    const req = await CapacitorCalendar.requestAllPermissions();
    return req.readCalendar === 'granted';
  } catch {
    return false;
  }
}

// Resolve a calendar id to write into. Without this Android creates events in
// the first writable calendar the plugin finds — which is often an
// unsynced local calendar, so the event shows up in our app but never lands
// in Google Calendar / the system calendar app. Preferring the OS's default
// calendar matches what the stock calendar app does.
export async function resolveDefaultCalendarId(): Promise<string | undefined> {
  if (!Capacitor.isNativePlatform()) return undefined;
  try {
    const { result } = await CapacitorCalendar.getDefaultCalendar();
    if (result?.id) {
      console.log('[calendar] default calendar:', result.title, result.id);
      return result.id;
    }
  } catch (err) {
    console.warn('[calendar] getDefaultCalendar failed:', err);
  }
  // Fall back to the first writable calendar we can see — anything non-local
  // is usually a synced account (Google/Outlook).
  try {
    const { result } = await CapacitorCalendar.listCalendars();
    const writable = (result ?? []).find((c) => c.allowsContentModifications !== false);
    if (writable?.id) {
      console.log('[calendar] fallback calendar:', writable.title, writable.id);
      return writable.id;
    }
  } catch (err) {
    console.warn('[calendar] listCalendars failed:', err);
  }
  return undefined;
}

export async function listEvents({ from, to }: ListEventsOptions): Promise<CalendarEvent[]> {
  if (!Capacitor.isNativePlatform()) return [];
  const ok = await ensureCalendarAccess();
  if (!ok) return [];

  try {
    const { result } = await CapacitorCalendar.listEventsInRange({
      startDate: from.getTime(),
      endDate: to.getTime(),
    });
    const raws = (result ?? []) as unknown as RawEvent[];
    return raws
      .map(normalize)
      .filter((e): e is CalendarEvent => e !== null)
      .sort((a, b) => (a.dateISO + a.start).localeCompare(b.dateISO + b.start));
  } catch (err) {
    console.warn('Calendar fetch failed:', err);
    return [];
  }
}
