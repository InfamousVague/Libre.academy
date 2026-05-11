# Review Notes

Paste this block into App Store Connect → App Review Information → Notes.

The reviewer reads this once. Goal: give them everything they'd otherwise have to email you to ask. Keep it terse — they review hundreds of apps a day.

## Recommended notes block

```
Hi reviewer — thanks for taking a look. Three things that might be useful:

1. Sign-in is OPTIONAL. The app works fully offline with eighteen pre-loaded
   courses (technical books split into runnable lessons). Sign-in is a
   convenience for cross-device progress sync; you don't need credentials
   to evaluate the app. Tap "Skip" on the first-launch prompt or just close
   the sign-in dialog whenever it appears.

2. The TradeDock (the "API Tester" panel mounted above HelloTrade-course
   lessons) defaults to MOCK MODE. Every endpoint returns canned responses
   served from on-device JS, so the dock works without any network. There
   is a "Live mode" toggle in the dock header that swaps to real HTTPS
   calls against api.staging.hello.trade — a public sandbox API run by
   the HelloTrade DEX. We don't expect you to test live mode; mock works
   for evaluation.

3. Code execution in lessons is sandboxed. Browser-runnable languages
   (JS, TS, Python via Pyodide, Rust via the WASM playground proxy, Lua,
   Solidity, etc.) execute inside the WKWebView with no native fs/network
   access. There's no "run arbitrary code" surface — every executable
   surface is a course-supplied harness with starter code the lesson
   itself provides.

Build target: iOS 14.0+, iPhone + iPad universal. Tested on iPhone 16 Pro
Max and iPad Pro M4 13".

If you hit a freeze on cold launch, please tap the top-left corner five
times in quick succession — that summons a built-in dev console with the
boot timeline. Forwarding that output to mattw@mattssoftware.com would
help me reproduce.

Thanks!
— Matt
```

## When to add a demo account

If you ever ship a feature that ONLY works behind sign-in (Libre currently has none), add this section to the block above:

```
Demo account (cloud sync features):
  Email: reviewer@libre.academy
  Password: <set this in App Store Connect — don't hardcode here>
```

Set the password directly in the App Store Connect text box (it's separate from the Notes box). Apple keeps it secret from the public listing.

## Special-case nudges

Add an optional sentence or two if a recent rejection touched something specific:

- **"Why does this need camera access?"** — `The camera is opened ONLY when the user taps "Scan QR" in Settings → AI Assistant; it scans a QR code that auto-configures the local Ollama host on the user's tailnet. No background or upload-camera-feed surface exists. NSCameraUsageDescription explains this exact use.`

- **"Why fetch from external playgrounds?"** — `Lessons in languages without a browser-native runtime (Rust, Go, Haskell, Scala, Cairo, Move, Sway, Dart) post the user's code to the language's official playground (play.rust-lang.org, play.golang.org, etc.) and display the result. Submission is on user click only — no auto-runs, no network during reading.`

- **"Why does the app POST to api.mattssoftware.com?"** — `Only when the user signs in. The relay holds the user's progress timestamps for cross-device sync. Code: src/hooks/useLibreCloud.ts. The relay is operated by the same entity that publishes the app.`

## Attachments

If there's a non-obvious feature, record a 30-second screen capture and attach it. Apple's reviewers like seeing exactly how to reach a feature rather than guessing.
