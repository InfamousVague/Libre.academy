# Submission package — what's in this folder

A snapshot of every asset you need to drag into App Store Connect, plus the order to do it. Generated when the simulator screenshots were captured. Pair this with `checklist.md` (which mirrors App Store Connect's UI flow) and `README.md` (which is the "why" behind every choice).

## Status at a glance

| Stage | Status | Notes |
| --- | --- | --- |
| `PRODUCT_NAME = Libre` in `project.yml` | ✅ done | `xcodegen generate` re-run; Xcode project regenerated |
| `CFBundleDisplayName = Libre` in Info.plist | ✅ done | Home-screen label reads "Libre" |
| `ITSAppUsesNonExemptEncryption = false` in Info.plist | ✅ done | Skips the encryption prompt on every upload |
| 1024×1024 App Store icon | ✅ done | `icon/AppIcon-1024.png` — new ribbon-snake "L" |
| App Store description, promo text, keywords | ✅ done | `metadata/description.md` |
| App Store name, subtitle, categories, age rating | ✅ done | `metadata/app-listing.md` |
| App Privacy nutrition label answers | ✅ done | `metadata/privacy-labels.md` |
| Reviewer notes block | ✅ done | `metadata/review-notes.md` |
| Export-compliance answers | ✅ done | `metadata/export-compliance.md` |
| iPhone 6.9" screenshots (1320×2868) | 🟡 1/6 captured | `01-library.png` ✅; navigate + capture 02–06 |
| iPad 13" screenshots (2064×2752) | 🟡 1/6 captured | `01-library.png` ✅; same nav recipe |
| `https://libre.academy/privacy` | ✅ live | 200 OK |
| `https://libre.academy/support` | ✅ live | 200 OK |
| Apple Developer Program active | ⚠️ verify | https://developer.apple.com/account |
| App Store Connect record created | ⚠️ verify | App Store Connect → Apps → "+" |

## Screenshot capture

✅ **Already done for you:**
- Tauri iOS sim build at `src-tauri/gen/apple/build/arm64-sim/Libre.app`
- iPhone 17 Pro Max sim booted, app installed + launched
- iPad Pro 13" (M5) sim booted, app installed + launched
- `01-library.png` captured on both (open the simulator windows to see)

**You drive the rest** — the simulators are open, the app is on the Library tab; just tap your way through and run the capture command for each shot.

### Capture each screen

The shot list (from `screenshots/README.md`) is six per device, in this order:

| # | Screen | What to navigate to |
| --- | --- | --- |
| 01 | **Library shelf** | Boot view; the book grid is right there |
| 02 | **A lesson reading** | Open `the-rust-programming-language` → "Variables and Mutability" |
| 03 | **HelloTrade dock** | Open any `hellotrade` lesson; tap "Send" on a preset |
| 04 | **An exercise running** | Open any exercise lesson with a passing test row |
| 05 | **The Trees view** | Tap the Trees rail entry (mobile: bottom tab) |
| 06 | **Profile / streak** | Tap the streak chip in the top bar / mobile profile tab |

Once you're on the right screen in the simulator:

```bash
# iPhone shots:
./appstore-submission/screenshots/capture.sh iphone 01-library
./appstore-submission/screenshots/capture.sh iphone 02-lesson-reading
./appstore-submission/screenshots/capture.sh iphone 03-hellotrade-dock
./appstore-submission/screenshots/capture.sh iphone 04-exercise-passing
./appstore-submission/screenshots/capture.sh iphone 05-trees
./appstore-submission/screenshots/capture.sh iphone 06-profile-streak

# iPad shots — same recipe, swap simulator UDID under the hood:
./appstore-submission/screenshots/capture.sh ipad   01-library
./appstore-submission/screenshots/capture.sh ipad   02-lesson-reading
./appstore-submission/screenshots/capture.sh ipad   03-hellotrade-dock
./appstore-submission/screenshots/capture.sh ipad   04-exercise-passing
./appstore-submission/screenshots/capture.sh ipad   05-trees
./appstore-submission/screenshots/capture.sh ipad   06-profile-streak
```

The script writes to `screenshots/iphone-6.9/` and `screenshots/ipad-13/` at exactly the canonical sizes (1320×2868 and 2064×2752) — App Store Connect accepts both without a complaint.

## Final pre-submission run

When the screenshot folders are full:

1. `open https://appstoreconnect.apple.com` → Apps → Libre → "+ Version 0.1.15".
2. Walk through `checklist.md` top-to-bottom — each row links to the metadata file holding the copy.
3. Drag the screenshots from this folder's `iphone-6.9/` and `ipad-13/` into the matching App Store Connect slots (they accept multi-select drag-drop from Finder).
4. Drag `icon/AppIcon-1024.png` into the App Icon slot.
5. Paste reviewer notes from `metadata/review-notes.md`.
6. **Add for Review → Submit for Review**.

Apple's median review is 24–48 hours; you'll get an email when status changes.

## What to do before submission

- **TestFlight upload first.** The submission flow uploads the binary; before clicking "Add for Review", install the build on a real iPhone via TestFlight and tap through every primary surface. Apple's reviewers will reject for crashes that simulator-only testing missed. (See `make release-phone` for the device-side upload flow.)
- **App Store Connect record.** If you haven't created the app yet: App Store Connect → My Apps → "+" → New App. Name `Libre`, bundle ID `com.mattssoftware.kata`, SKU `libre-ios-001`, primary lang English (U.S.).
- **Apple Developer Program.** `developer.apple.com/account` should show "Active" + agreements current.

## File map

```
appstore-submission/
├── SUBMIT.md                      ← you're here
├── README.md                      ← end-to-end "why"
├── checklist.md                   ← App Store Connect click-through
├── icon/
│   ├── README.md
│   └── AppIcon-1024.png            ← drag into App Icon slot
├── metadata/
│   ├── app-listing.md              ← name, subtitle, category, age rating
│   ├── description.md              ← description, promo text, keywords
│   ├── privacy-labels.md           ← App Privacy nutrition label answers
│   ├── review-notes.md             ← Reviewer Notes box
│   └── export-compliance.md        ← Encryption declaration
└── screenshots/
    ├── README.md                   ← shot-list + sim commands
    ├── capture.sh                  ← one-line capture helper
    ├── iphone-6.9/                 ← 6 PNGs at 1320×2868
    ├── iphone-6.5/                 ← optional fallback at 1242×2688
    ├── ipad-13/                    ← 6 PNGs at 2064×2752
    └── ipad-12.9/                  ← optional fallback at 2048×2732
```

That's everything. Submit when the screenshots are in.
