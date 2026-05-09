# Screenshots Guide

Apple requires screenshots for each device size you support. Drop the captures into the right subfolder; App Store Connect lets you drag them in directly from Finder.

## What's required

You need **at least one** screenshot for the **largest size of each platform you support** (Apple shows that to all smaller devices automatically if you don't supply size-specific shots). Libre is iPhone + iPad universal, so:

| Platform | Largest size needed | Required? |
| --- | --- | --- |
| iPhone 6.9" (iPhone 16 Pro Max) | **1320 × 2868** portrait | ✅ Yes |
| iPad 13" (iPad Pro M4 13") | **2064 × 2752** portrait | ✅ Yes |
| iPhone 6.5" (iPhone 14 Plus / older) | 1242 × 2688 portrait | Optional |
| iPad 12.9" (older iPad Pro) | 2048 × 2732 portrait | Optional |

Up to **10 screenshots per size**. Submit between 3 and 6 — fewer than 3 looks empty, more than 6 fatigues the eye in the App Store carousel.

If you only supply 6.9" + 13", Apple's automatic-scaling shows them on every device. Cleanest path. Skip 6.5" and 12.9" for v1 unless you want pixel-perfect on older devices.

## The 6-shot storyboard for Libre

Apple recommends the first three screenshots tell the full story even before the user taps to expand. Recommended order — same shots, identical scenes between iPhone and iPad versions:

1. **The library shelf.** Hero of the app — the actual book grid, full of real covers, on the home/Library tab. The cover artwork carries the message ("real books, hands-on courses") without copy.
2. **A lesson reading.** Open `the-rust-programming-language` → "Variables and Mutability" or similar, scrolled so prose, an inline code block, and the speaker icon are all visible. Demonstrates the "books as readable courses" angle.
3. **The HelloTrade dock.** Open any HelloTrade lesson with the API tester docked above. Hit "Send" on a preset so the response panel shows a real JSON body. This is the headline new feature.
4. **An exercise running.** Open any exercise lesson with the editor + tests panel visible — show one passing test row in green. Demonstrates the "real code execution, not quizzes" angle.
5. **The Trees view.** A skill tree with completed nodes lit up. Shows the breadth (cross-book paths through the curriculum).
6. **The Profile / streak page.** Streak ring + recent completions feed. Shows depth (the app rewards long-term use, not just first-launch).

This sequence reads as: *here's what's inside* → *here's what reading looks like* → *here's the new headliner* → *here's the active mode* → *here's the path through* → *here's the long-term hook*.

## How to capture

### iPhone (real device — recommended)

1. Connect iPhone 16 Pro Max via USB.
2. On the phone: navigate to the screen you want.
3. Press **Side button + Volume Up** simultaneously — captures a screenshot at full resolution into Photos.
4. AirDrop / Image Capture / Photos cloud-sync to your Mac.
5. Drag into `appstore-submission/screenshots/iphone-6.9/` — name them `01-library.png`, `02-lesson.png`, etc. (the leading number controls App Store carousel order).

### iPhone (Simulator — fallback)

If you don't have a 16 Pro Max:

```bash
# In Xcode: Window → Devices and Simulators → Simulators → "+" →
# choose "iPhone 16 Pro Max", iOS 18.x.
xcrun simctl boot "iPhone 16 Pro Max"
open -a Simulator
# Inside the simulator, navigate to the screen you want, then:
xcrun simctl io booted screenshot ~/Desktop/01-library.png
```

The simulator emits PNGs at exactly 1320×2868. Drop into `iphone-6.9/`.

### iPad (Simulator — recommended unless you have an iPad Pro 13" M4)

```bash
xcrun simctl boot "iPad Pro 13-inch (M4)"
open -a Simulator
# Navigate to the screen, then:
xcrun simctl io booted screenshot ~/Desktop/01-library-ipad.png
```

Simulator output is 2064×2752 — exactly what App Store Connect wants. Drop into `ipad-13/`.

### Real iPad (preferred for accuracy)

On the iPad: Top button + Volume Up captures a screenshot. AirDrop to your Mac. Same as the iPhone path.

## Sizing — quick reference

If a capture is the wrong size (e.g., from a non-Pro Max device or an older iPad), resize with sips:

```bash
# Force-resize to the iPhone 6.9" canonical size:
sips --resampleHeightWidth 2868 1320 input.png --out output.png

# Force-resize to the iPad 13" canonical size:
sips --resampleHeightWidth 2752 2064 input.png --out output.png
```

App Store Connect will reject mismatched dimensions — exact pixel size matters.

## Adding overlay copy (optional)

You CAN add captioning / device frames / marketing copy as long as the underlying app pixels remain visible. Tools that work well for this:

- **Figma** — drop the raw screenshot into a frame the right size, add a coloured background + text overlay above. Export each frame at 1× (it'll match the canonical size).
- **Screenshots.pro / AppLaunchpad** — paid tools designed for this exact workflow. Worth it if you're going to ship a v2/v3 and reuse the layout.
- **Plain captures** — fine for v1. Apple's reviewers don't penalise unstyled screenshots.

For Libre v1, plain captures are enough.

## Localization

If you ever ship a non-English locale, App Store Connect lets you upload a different screenshot set per language. For now, English-only — drop into the per-platform folders unmodified.

## File-name convention

`NN-screen-name.png` where `NN` is two-digit zero-padded order. Example:

```
screenshots/iphone-6.9/
  01-library.png
  02-lesson-reading.png
  03-hellotrade-dock.png
  04-exercise-passing.png
  05-trees.png
  06-profile-streak.png
```

App Store Connect ranks screenshots in alphabetical order of filename, so the prefix locks the carousel order.

## Promotional text vs. screenshots

The Promotional Text field on the App Store listing (170 chars, see [`metadata/description.md`](../metadata/description.md)) is editable any time without re-submitting. Use it for "what changed in this release" / current promo. The screenshots shouldn't repeat that copy — they're for showing the app, not announcing.
