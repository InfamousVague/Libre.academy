# Haptics

The Libre haptics system is a layered service that converts
abstract user-experience moments ("the test just passed", "the
user tapped a button", "the streak ticked up") into device
vibration. It's the primary way the app feels physical on mobile
— without it, every interaction reads as inert chrome; with it,
the app feels alive in the user's hand.

This doc covers the architecture, the contracts each layer
expects, where the haptic moments are wired today, and how to
add new ones without polluting the existing surfaces.

---

## Architecture

```
                    ┌────────────────────────────────────┐
                    │  Component (button / hook / etc.)  │
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
                    ┌────────────────────────────────────┐
                    │  fireHaptic("intent")              │   ← src/lib/haptics.ts
                    │  firePattern(pattern, category)    │
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
                    ┌────────────────────────────────────┐
                    │  Policy layer                      │   ← src/lib/haptics/context.ts
                    │  • per-category enable             │
                    │  • quiet hours                     │
                    │  • battery awareness               │
                    │  • per-screen overrides            │
                    │  • throttling                      │
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
                    ┌────────────────────────────────────┐
                    │  Telemetry counter                 │   ← in context.ts
                    └─────────────────┬──────────────────┘
                                      │
                                      ▼
                ┌────────────┬────────┴────────┬──────────┐
                ▼            ▼                 ▼          ▼
           Native iOS   Native Android    Web vibrate   No-op
           (Swift)      (Kotlin/JNI)      (browser)     (desktop)
```

Each layer is independently testable and replaceable. The
component layer never knows what backend ran the haptic; the
engine never knows which UI surface fired it.

---

## Public API

### Intents (`src/lib/haptics.ts`)

Eleven semantic intents cover the entire app:

| Intent | When |
|---|---|
| `tap` | Generic button press. Default chrome feedback. |
| `selection` | Tab switch, segmented control, theme pick. |
| `impact-light` | Modal open, popover dismiss, sheet present. |
| `impact-medium` | Lesson change, course open, navigation to detail. |
| `impact-heavy` | Destructive confirmation, achievement unlock first frame. |
| `notification-success` | Test pass, mark-complete, sync success. |
| `notification-warning` | Validation rejected, slow network. |
| `notification-error` | Test fail, run error, sync reject. |
| `streak-bump` | Streak counter increment. |
| `level-up` | Level-up modal. |
| `completion` | Course complete, certificate earned. |

### Patterns (`src/lib/haptics/patterns.ts`)

Custom multi-beat patterns can be defined and fired through
`firePattern(pattern, category)`. A pattern is a list of
`[durationMs, "buzz" | "pause"]` tuples. Nine curated presets
ship out of the box: Tap, Double tap, Escalation, Decay,
Heartbeat, Wave, Knock-knock, Stone drop, SOS-tap.

Patterns compose: `concat()`, `repeat()`, `reverse()`,
`timeScale()`, `intensityScale()` all return new pure patterns.

User-defined patterns persist in localStorage under
`libre:haptic-custom:<id>` and appear in the Settings →
Haptics → Custom patterns card.

### Hooks (`src/hooks/useHaptic.ts`)

| Hook | Use |
|---|---|
| `useHaptic(intent?)` | Stable callback for event handlers. |
| `useHapticOnChange(value, intent, options?)` | Fires when a tracked value transitions. Supports `when` predicate + `skipInitial`. |
| `useHapticOnVisible(intent, options?)` | IntersectionObserver, fires once when element enters viewport. |
| `useHapticAtAnimationEnd(intent, options?)` | Syncs with CSS `animationend`/`transitionend`. |
| `withHaptic(handler, intent?)` | Composes a haptic with any event handler. |

---

## Policy layer

`src/lib/haptics/context.ts` owns five orthogonal policies that
every fire passes through:

### 1. Per-category gates

Every intent belongs to a category: `chrome`, `completion`,
`celebration`, `error`, `focus`, or `streak`. Users can toggle
each category independently in Settings → Haptics → Categories.

### 2. Quiet hours

A time-of-day window during which haptics either dampen
(intensity × factor) or fully mute. Wraps midnight; honours
local time. Configured via Settings → Haptics → Quiet hours.

### 3. Battery awareness

When the device reports ≤ 20% battery AND isn't charging, the
engine applies a 0.55× dampen factor. Acquired lazily via the
`navigator.getBattery()` API; fails silently and dampens to
1.0 (no change) when the API isn't available.

### 4. Per-screen overrides (React)

Wrap a subtree in `<HapticProvider>` to override the engine
for that screen:

```tsx
<HapticProvider intensityScale={0.4} categoryOverrides={{ chrome: false }}>
  {/* Meditation breathing exercise — quieter, no chrome buzzes */}
</HapticProvider>
```

The provider mirrors its value into a module-scoped slot so
non-React fire paths (deep setTimeout callbacks) still respect
it.

### 5. Throttling

- Per-intent cooldown (defined on each intent's profile)
- Global 25ms floor across all intents

Both prevent chatty surfaces from melting into one continuous
buzz.

---

## Native bridges

The TypeScript engine attempts the Tauri native bridge first via
`invoke("haptic_fire", ...)`, falls back to `navigator.vibrate`
on failure.

### iOS (Swift)

Reference implementation in `src-tauri/native/ios/Haptics.swift`.
Uses `UIImpactFeedbackGenerator` (light/medium/heavy/soft/rigid),
`UISelectionFeedbackGenerator`, and `UINotificationFeedback-
Generator` (success/warning/error). All generators are prepared
once on init for low-latency dispatch.

### Android (Kotlin)

Reference implementation in `src-tauri/native/android/Haptics.kt`.
Uses `VibrationEffect.createPredefined` (API 31+) where the style
maps cleanly, `VibrationEffect.createOneShot` (API 26+) for
amplitude-controlled impacts, and the legacy `Vibrator.vibrate`
on older API levels.

### Web / desktop

`navigator.vibrate(pattern)` where supported (Android Chrome,
some web browsers). Silently no-ops on iOS Safari and on
desktop builds.

The Rust side (`src-tauri/src/haptics.rs`) is currently a stub
returning `{ fired: false, available: false }`, which routes the
TS layer to the web fallback. Wiring the Swift / Kotlin bridges
into the Tauri plugin system is the highest-value follow-up.

---

## Wired moments

| Surface | Intent / Pattern | Category | Why |
|---|---|---|---|
| `SettingsToggle` (every toggle in the app) | `selection` | chrome | Confirms toggle flip |
| `MobileTabBar` tab switches | `selection` | chrome | iOS-native tick |
| `MobileLesson` Prev/Next | `impact-light` | chrome | Navigation feedback |
| `MobileLesson` Mark Read & Next | `notification-success` | completion | Triumph moment |
| `MobileLibrary` course tap | `impact-medium` | chrome | Deliberate commitment |
| `LessonView` test pass | `completion` | completion | Long descending finale |
| `LessonView` test fail | `notification-error` | error | Heavy double-tap |
| `QuizView` correct answer | `notification-success` | completion | Per-question success |
| `QuizView` wrong answer | `notification-warning` | error | Per-question warning |
| `QuizView` all-correct completion | `completion` | completion | Quiz finale |
| `celebrate()` confetti burst | 3-beat sequence | celebration | Medium → light → success timed to coin-shower keyframes |
| `AchievementToast` unlock | Tier-scaled crescendo | celebration | Bronze=success, Silver=level-up, Gold/Platinum=completion |
| `StatsChip` streak increment | `streak-bump` | streak | Crescendo on `streakDays > prev` |
| `StatsChip` level up | `level-up` | celebration | Five-pulse on `level > prev` |
| Lesson nav Mark Read CTA | `notification-success` | completion | Holographic CTA + tactile reinforcement |

---

## Adding a new haptic moment

1. **Reach for an existing intent first.** The intent vocabulary
   is intentionally small. Most "this needs a buzz" surfaces
   land cleanly on one of the existing 11.

2. **Decide where to fire.** Options in increasing order of
   cleverness:

   - Inline call inside an `onClick`: `void haptics.tap();`
   - `useHaptic(intent)` returns a stable callback for handlers.
   - `useHapticOnChange(value, intent)` for state transitions.
   - `useHapticOnVisible(intent)` for elements entering view.
   - `useHapticAtAnimationEnd(intent)` synced with CSS keyframes.

3. **Pick the right category.** The default mapping in
   `INTENT_CATEGORY` covers existing intents; new intents need
   a row here so the per-category enable map works.

4. **Audition in Settings.** Open Settings → Haptics, find the
   intent's preview row, hit Play. Audition under both intensity
   extremes (slider at 0.2 vs 1.0) to confirm the pattern is
   distinguishable from neighbouring intents at low intensity.

5. **Document the moment in this file.** Add a row to the Wired
   moments table above.

---

## Adding a new pattern

1. Define the pattern in `src/lib/haptics/patterns.ts` as a
   `Preset` and add it to the `PRESETS` array. Patterns are
   pure data; no behaviour change required elsewhere.

2. If the pattern is for a specific feature (not a general-
   purpose preset), DON'T add it to `PRESETS`. Define it
   inline at the call site and fire via `firePattern()`.

3. Test it via Settings → Haptics → Preset library or the
   custom pattern editor.

---

## Testing

- The engine is import-pure: bringing it into a Jest / Vitest
  environment with `jsdom` is enough to test pattern
  materialisation, throttling logic, and policy evaluation.

- `navigator.vibrate` can be mocked at the module level:
  `vi.spyOn(navigator, "vibrate").mockReturnValue(true)`.

- The Tauri `invoke` mock should reject so the engine falls
  through to the web fallback in unit tests.

- Telemetry counts are observable via `readTelemetrySnapshot()`
  — assert on these after a test fires haptics to confirm the
  right intents reached the engine.

---

## Privacy

- The telemetry counter is **in-memory only**. Never persisted,
  never sent off device. The Settings → Haptics → Telemetry
  view is purely diagnostic ("how many buzzes did I trigger in
  this session?") and is wiped on every app launch.

- Custom patterns persist to localStorage. They never leave the
  device unless the user explicitly exports their settings.

- The Battery API access is read-only and used only to derive
  the dampen multiplier. We never report battery level to any
  server.

---

## Performance

- Engine hot path: ~5 µs per fire on a 2024 MacBook Air (read
  settings, evaluate policy, check throttle, record telemetry,
  invoke or vibrate). No measurable impact on interaction
  latency even at maximum chatter (100+ fires per second).

- The throttle is the safety net — without it a chatty surface
  could attempt 1000+ fires per second, and even though most
  would no-op via the per-intent cooldown, the JS work would
  burn battery. With it, 100 chatter-events collapse to ~25
  fires per second across all intents.

- Pattern materialisation is O(beats), typically < 10 beats.
  No reason to memoise.

---

## Roadmap

Eventually:

- **Wire the native iOS bridge.** The Swift file is ready;
  needs to land as a Tauri plugin and the `haptics::haptic_fire`
  in-tree command replaced with `.plugin(tauri_plugin_haptics::init())`.
- **Wire the native Android bridge.** Same story for Kotlin.
- **Per-surface telemetry** (opt-in only, anonymised) so we
  can find which intents are firing most and tune patterns
  to match.
- **Apple Watch coordination.** When the iOS app is paired
  with a Watch, certain moments could fire the haptic on
  whichever device is on the user's attention surface (Watch
  while pocketed, iPhone while in-hand).
- **Music-synced haptics.** When background music is playing,
  align celebration patterns with the beat.
- **Sync settings to Libre Cloud** so the user's haptic
  preferences travel between devices automatically.
