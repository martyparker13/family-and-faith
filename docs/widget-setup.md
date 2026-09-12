# Home Screen Widget Setup

Faith & Family ships **widget-ready data** and **deep links** today. A native
home-screen widget requires a development or production build (not Expo Go).

## Deep links (ready now)

The app scheme is `faithandfamily`. Rhythm shortcuts open the guided flow:

| Shortcut | URL |
| --- | --- |
| Morning reading | `faithandfamily://rhythm/morning` |
| Dinner talk | `faithandfamily://rhythm/dinner` |
| Bedtime prayer | `faithandfamily://rhythm/bedtime` |

These are configured in `app.json` under `scheme` and handled in
`app/_layout.tsx`.

### iOS Shortcuts

1. Open the **Shortcuts** app.
2. Create a new shortcut → **Open URL**.
3. Paste `faithandfamily://rhythm/morning` (or dinner/bedtime).
4. Add to Home Screen for a one-tap launch.

### Android

Add an app shortcut in a production build, or use a launcher that supports
URL shortcuts with the same `faithandfamily://` links.

## Native widget (future / custom dev build)

Expo SDK 56 does not include a cross-platform widget API in the managed
workflow. Recommended path for iOS:

1. Use [`@bacons/apple-targets`](https://github.com/EvanBacon/expo-apple-targets)
   to add a Widget Extension target in an EAS **development** or **production**
   build.
2. Share data via **App Groups** — export today's plan day, next rhythm slot,
   and streak counts from the main app (see `lib/export-data.ts` shape).
3. Widget timeline provider reads the shared JSON and deep-links via
   `faithandfamily://rhythm/{slot}`.

### Widget data contract (suggested)

```json
{
  "planDay": 42,
  "nextSlot": "dinner",
  "morningStreak": 5,
  "readingReference": "Genesis 12–13",
  "updatedAt": "2026-06-12T08:00:00"
}
```

Write this file from the main app on launch and after each completion.

## Android widget

Document-only for v1.1 — Android App Widgets require a custom native module
or config plugin. Use deep links and Quick Settings tiles until a widget
target is added.

## Testing deep links

```bash
# iOS Simulator
xcrun simctl openurl booted "faithandfamily://rhythm/morning"

# Android emulator
adb shell am start -a android.intent.action.VIEW -d "faithandfamily://rhythm/bedtime"
```

Build with `npm run build:dev` or `eas build --profile development` — daily
reminders and deep links require a real build, not Expo Go (Android reminders).
