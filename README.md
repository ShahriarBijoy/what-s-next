# Kaleidar — iOS app

Native iOS app built from the Kaleidar Claude Design prototype. Uses
**Capacitor** to ship the React/TypeScript UI inside a WKWebView while talking
to real iOS APIs (EventKit, CoreLocation) through native plugins.

## Why Capacitor (not SwiftUI)

The prototype leans heavily on web-only features:

- 3D CSS `perspective` + `rotateX/Z` on the Today card stack
- `backdrop-filter: blur()` for the iOS 26 liquid-glass look
- CSS keyframes + cubic-bezier transitions
- Instrument Serif + Space Grotesk from Google Fonts

Rewriting all of that in SwiftUI would take weeks and lose fidelity. Capacitor
keeps the pixel-perfect React implementation and adds native access to what
actually needs to be native: calendar events and weather-by-location.

The output is still a real native app — signed `.ipa`, App Store compatible,
native status bar, native permission dialogs.

## What's native vs. what's web

| Concern           | Where it lives                                              |
| ----------------- | ----------------------------------------------------------- |
| UI + animations   | React / TS / CSS, rendered in WKWebView                     |
| Calendar events   | `@ebarooni/capacitor-calendar` → iOS EventKit               |
| Event creation    | Same plugin (`createEventWithPrompt`) → native iOS sheet    |
| Location          | `@capacitor/geolocation` → CoreLocation                     |
| Weather           | Open-Meteo HTTPS API (free, no key)                         |
| App chrome        | iOS native status bar + home indicator                      |

## Project layout

```
├── src/                    React + TS source
│   ├── App.tsx             root
│   ├── components/         view layers (TodayView, CalendarView, EventDetail, CreateSheet, …)
│   ├── services/           native bridges (calendar.ts, weather.ts)
│   ├── hooks/              thin stateful wrappers around services
│   ├── data/               fallback sample schedule for web preview
│   └── types.ts            palette, enums, small helpers
├── ios/                    Capacitor-generated Xcode project
├── capacitor.config.ts     app id, web dir
├── vite.config.ts
└── index.html
```

## Dev on Windows (or anywhere)

Live-reload the web UI in a desktop browser. This renders the prototype inside
a 402×874 iPhone frame exactly like the original HTML mock.

```bash
npm install
npm run dev     # http://localhost:5173
```

Calendar + weather won't work in the browser — Open-Meteo will still respond,
but without CoreLocation the Geolocation plugin falls back to the browser API
(will prompt once). The UI shows sample events from `src/data/fallbackEvents.ts`
so it still *looks* right.

To produce the bundle Capacitor copies into iOS:

```bash
npm run build   # writes to dist/
```

## Build for iOS (requires macOS)

Everything above runs on Windows. For the iOS build you need a Mac with Xcode
15+ installed once, then:

```bash
# 1. Get the code + deps on the Mac
git clone <your repo>  # or copy the folder over
cd ios-app-test
npm install

# 2. Produce the web bundle and copy it into the iOS project
npm run build
npx cap sync ios

# 3. Open in Xcode
npx cap open ios
```

In Xcode:

1. Select the **App** target → **Signing & Capabilities** → pick your Team.
   (You'll need a free Apple ID for device installs; a paid developer account
   for App Store / TestFlight distribution.)
2. Optionally change the bundle id from `com.kaleidar.app` to something unique.
3. Plug in an iPhone, select it as the run target, hit ▶︎.

### Iterating quickly

Every time you change TS/React code:

```bash
npm run cap:sync    # build + cap sync in one shot
```

Then click "Run" in Xcode again. For hot-reload against a phone on the same
Wi-Fi, add `server.url` to `capacitor.config.ts` temporarily:

```ts
server: { url: 'http://<your-mac-lan-ip>:5173', cleartext: true }
```

Then run `npm run dev` on the Mac and `cap sync` + run from Xcode.

## Permissions

The Info.plist already declares everything needed. iOS will show the native
prompt the first time each is triggered:

- `NSCalendarsUsageDescription` — EventKit read (iOS < 17)
- `NSCalendarsFullAccessUsageDescription` — EventKit read+write (iOS 17+)
- `NSCalendarsWriteOnlyAccessUsageDescription` — EventKit write-only (iOS 17+)
- `NSLocationWhenInUseUsageDescription` — CoreLocation foreground

If the user denies a permission, the app degrades gracefully:

- Denied calendar → prototype sample events still render
- Denied location → default weather state (sunny 72°), tap to cycle

## Editing the design

All visual constants live in `src/types.ts` (`PALETTE`). Animations are CSS
keyframes in `src/index.css`. The core 3D card math is in
`src/components/TodayView.tsx` inside `StackedCard`.

## Known limitations / next steps

- Event create UI uses the iOS native event sheet (`createEventWithPrompt`) —
  this shows Apple's built-in flow rather than the custom Kaleidar sheet for
  the final confirm step. If you want the full custom flow, swap
  `createEventWithPrompt` → `createEvent` in `src/components/CreateSheet.tsx`.
- Weather refreshes once per launch. Add a pull-to-refresh or periodic refetch
  in `src/hooks/useWeather.ts` if needed.
- No event editing or delete UI yet (the plugin supports both).
- People attendees are a design placeholder — EventKit attendees are read-only
  and need extra handling to render real names/initials.
