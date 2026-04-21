import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { PALETTE, type CalendarEvent } from './types';
import { IOSDevice } from './components/IOSFrame';
import { SegControl } from './components/SegControl';
import { PlusButton } from './components/PlusButton';
import { TodayView } from './components/TodayView';
import { CalendarView } from './components/CalendarView';
import { EventDetail } from './components/EventDetail';
import { CreateSheet } from './components/CreateSheet';
import { useCalendarEvents } from './hooks/useCalendarEvents';

type View = 'today' | 'cal';

export default function App() {
  const isNative = Capacitor.isNativePlatform();
  const [view, setView] = useState<View>(() => (localStorage.getItem('kd_view') as View) || 'today');
  const [openEvent, setOpenEvent] = useState<CalendarEvent | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const { events, source, reload } = useCalendarEvents();

  useEffect(() => {
    localStorage.setItem('kd_view', view);
  }, [view]);

  useEffect(() => {
    document.body.style.background = PALETTE.cream;
  }, []);

  // On native we use the real safe-area insets (status bar + gesture bar).
  // In the desktop preview we fall back to fixed gaps that match the iOS
  // bezel + home indicator drawn by <IOSDevice />.
  const safeTop = isNative ? 'calc(env(safe-area-inset-top, 0px) + 12px)' : '58px';
  const safeBottom = isNative ? 'env(safe-area-inset-bottom, 0px)' : '34px';

  const content = (
    <div
      style={{
        background: PALETTE.cream,
        height: '100%',
        width: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        paddingTop: safeTop,
        paddingBottom: safeBottom,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px 18px',
          flexShrink: 0,
        }}
      >
        <SegControl<View>
          value={view}
          onChange={setView}
          options={[
            { value: 'today', label: 'Today' },
            { value: 'cal', label: 'Calendar' },
          ]}
        />
        <PlusButton onClick={() => setCreateOpen(true)} rotate={createOpen} />
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          key={view}
          style={{
            animation: 'kdFade 0.5s cubic-bezier(.2,.9,.2,1)',
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: view === 'today' ? 'hidden' : 'auto',
          }}
        >
          {view === 'today' ? (
            <TodayView
              events={events}
              onOpenEvent={setOpenEvent}
              onCreateNew={() => setCreateOpen(true)}
            />
          ) : (
            <CalendarView events={events} onOpenEvent={setOpenEvent} />
          )}
        </div>
      </div>

      {openEvent && <EventDetail ev={openEvent} onClose={() => setOpenEvent(null)} />}
      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} onCreated={reload} />

      {source === 'fallback' && !isNative && (
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 9,
            opacity: 0.4,
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          preview · sample data
        </div>
      )}
    </div>
  );

  if (isNative) {
    return <IOSDevice fullscreen>{content}</IOSDevice>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PALETTE.cream,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
      }}
    >
      <div style={{ position: 'relative' }}>
        <IOSDevice width={402} height={874}>
          {content}
        </IOSDevice>
        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            color: PALETTE.ink,
            opacity: 0.45,
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}
        >
          Kaleidar — {view === 'today' ? 'Today' : 'Week'} view
        </div>
      </div>
    </div>
  );
}
