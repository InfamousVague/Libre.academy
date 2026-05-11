# Submission Checklist

Punch list for actually clicking through App Store Connect. Each item links to the file with the copy or commands.

## Pre-flight (do once, then verify on every release)

- [ ] **Apple Developer Program** active (https://developer.apple.com/account, agreements current).
- [ ] **App Store Connect "Apps" record** exists for `com.mattssoftware.libre` named "Libre".
- [x] **`PRODUCT_NAME = Libre`** in `src-tauri/gen/apple/project.yml` ✅ done — `xcodegen generate` re-run, home-screen label now reads "Libre".
- [ ] **`CFBundleShortVersionString`** in `Info.plist` matches the version you want shown in the App Store.
- [ ] **`CFBundleVersion`** is strictly greater than the previous upload.
- [ ] **`libre.academy/privacy`** and **`libre.academy/support`** have substantive content.
- [ ] **First-launch flow tested** on a real iPhone (not just simulator) via TestFlight — the iPad load fix should take care of this, but verify.

## Build & upload

- [ ] `cd src-tauri/gen/apple && xcodegen generate`
- [ ] `open libre.xcodeproj`
- [ ] Select **Generic iOS Device** as the destination.
- [ ] **Product → Archive**.
- [ ] In Organizer: **Distribute App → App Store Connect → Upload**.
- [ ] **Automatic signing**, Team `F6ZAL7ANAD`.
- [ ] Encryption: **No** (see [`metadata/export-compliance.md`](./metadata/export-compliance.md)).
- [ ] Wait for "Build is ready" email (~10–30 min).

## Fill out App Store Connect (App → iOS App → "+ Version")

### App Information (set once, edit when copy changes)

- [ ] **Subtitle** (30 char): from [`metadata/app-listing.md`](./metadata/app-listing.md).
- [ ] **Category — Primary**: Education
- [ ] **Category — Secondary**: Developer Tools
- [ ] **Content Rights**: Does not contain third-party content (or check the box if it does — Libre's bundled course excerpts are derivative under fair-use; consult before checking either way).
- [ ] **Age Rating** questionnaire → 4+ (see [`metadata/app-listing.md`](./metadata/app-listing.md) for answers).

### Pricing and Availability (set once)

- [ ] **Price**: USD 0 (Free).
- [ ] **Availability**: All countries / regions.

### App Privacy (set once, refresh on data-collection changes)

- [ ] Click **Get Started** under "App Privacy".
- [ ] Answer "Yes" — the app collects data (because of optional cloud sync).
- [ ] Tick boxes per [`metadata/privacy-labels.md`](./metadata/privacy-labels.md).
- [ ] Privacy Policy URL: `https://libre.academy/privacy`

### Per-version (every release)

- [ ] **What's New in This Version** (170 char) — short release notes.
- [ ] **Promotional Text** (170 char): from [`metadata/description.md`](./metadata/description.md).
- [ ] **Description** (4000 char): from [`metadata/description.md`](./metadata/description.md).
- [ ] **Keywords** (100 char): from [`metadata/description.md`](./metadata/description.md).
- [ ] **Support URL**: `https://libre.academy/support`
- [ ] **Marketing URL**: `https://libre.academy`
- [ ] **Copyright**: `© 2026 Matts Software, LLC` (or your legal entity)

### Screenshots (drag from this folder into App Store Connect)

- [ ] **iPhone 6.9"**: drop files from [`screenshots/iphone-6.9/`](./screenshots/iphone-6.9/). REQUIRED. 6 shots recommended.
- [ ] **iPhone 6.5"**: drop files from [`screenshots/iphone-6.5/`](./screenshots/iphone-6.5/). Optional fallback.
- [ ] **iPad 13"**: drop files from [`screenshots/ipad-13/`](./screenshots/ipad-13/). REQUIRED for iPad app.
- [ ] **iPad 12.9"**: drop files from [`screenshots/ipad-12.9/`](./screenshots/ipad-12.9/). Optional fallback.

### Build

- [ ] Click **+ Build** under the version.
- [ ] Select the build that finished processing.
- [ ] **Export Compliance**: answer "No" — see [`metadata/export-compliance.md`](./metadata/export-compliance.md).

### Icon

- [ ] **App Icon (1024×1024)**: drag from [`icon/`](./icon/). REQUIRED. PNG, no alpha, no rounding.

### App Review Information (every submission)

- [ ] **Sign-in required?**: No (the app works fully offline). Cloud sync is optional.
- [ ] **Notes**: paste from [`metadata/review-notes.md`](./metadata/review-notes.md).
- [ ] **Contact Info**: First Name, Last Name, Phone, Email — your details.
- [ ] **Attachment**: optional. If a feature is non-obvious, attach a 30-second screen recording.

### Version Release

- [ ] **Manually release this version** (recommended for v1). Lets you flip the switch on launch day.

## Submit

- [ ] Click **Add for Review** at the top of the version page.
- [ ] Confirm everything on the summary screen.
- [ ] **Submit for Review**.
- [ ] You'll get an email when status changes (In Review → Pending Developer Release / Rejected).

## After approval

- [ ] If you chose manual release: click **Release This Version** on the version page.
- [ ] Verify the listing on the App Store within ~15 minutes (Apple's CDN takes a beat to propagate globally).
- [ ] Tweet / share / etc.

## If rejected

- [ ] Read the **Resolution Center** message — it cites the specific guideline.
- [ ] Cross-reference https://developer.apple.com/app-store/review/guidelines/.
- [ ] Either:
  - Fix + upload a new build → bump `CFBundleVersion` → re-archive → re-upload → tag the new build on the same version → resubmit.
  - Or reply in Resolution Center with a clarification (no rebuild needed if it's a misunderstanding).
- [ ] Apple typically replies to Resolution Center messages within 24 hours.
