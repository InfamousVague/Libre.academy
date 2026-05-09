# Libre — App Store Submission Guide

Everything you need to ship the iOS / iPadOS build of Libre to App Store Connect, organised so each step is one open file. Read this top-to-bottom the first time; later submissions only need [`checklist.md`](./checklist.md).

## What this folder contains

```
appstore-submission/
├── README.md              ← you're here. The end-to-end guide.
├── checklist.md           ← punch list for actually filling out App Store Connect.
├── metadata/
│   ├── app-listing.md         ← name, subtitle, category, age rating, support URLs.
│   ├── description.md         ← App Store description, promo text, keywords.
│   ├── privacy-labels.md      ← App Privacy "nutrition label" answers.
│   ├── review-notes.md        ← what to type into the Reviewer Notes box.
│   └── export-compliance.md   ← encryption declaration (annual itsappusesnonexemptencryption).
├── screenshots/
│   ├── README.md              ← required sizes, the 6-shot storyboard, capture commands.
│   ├── iphone-6.9/            ← drop iPhone 16 Pro Max screenshots here (1320×2868).
│   ├── iphone-6.5/            ← optional fallback for iPhone 14 Plus (1242×2688).
│   ├── ipad-13/               ← iPad Pro M4 13" screenshots (2064×2752).
│   └── ipad-12.9/             ← optional fallback (2048×2732).
└── icon/
    └── README.md              ← where the 1024×1024 master lives + how to regenerate it.
```

## App identity at a glance

| Field | Value |
| --- | --- |
| **App Store Name** | Libre |
| **Bundle ID** | `com.mattssoftware.kata` |
| **Apple Team ID** | `F6ZAL7ANAD` |
| **Version (CFBundleShortVersionString)** | `0.1.15` |
| **Build (CFBundleVersion)** | `0.1.15` (bump per upload) |
| **Min iOS** | 14.0 |
| **Devices** | iPhone + iPad (Universal) |
| **Marketing URL** | https://libre.academy |
| **Support URL** | https://libre.academy/support |
| **Privacy Policy URL** | https://libre.academy/privacy |
| **Primary Category** | Education |
| **Secondary Category** | Developer Tools |
| **Age Rating** | 4+ |
| **Price** | Free |

> ⚠️ The Xcode `PRODUCT_NAME` is still `Fishbones` from the legacy branding. Before archiving, edit `src-tauri/gen/apple/project.yml` (`settingGroups.app.base.PRODUCT_NAME`) to `Libre`, run `xcodegen generate` from `src-tauri/gen/apple/`, and confirm the home-screen label reads "Libre".

## The high-level submission flow

1. **Apple Developer Program enrolment** (one-time, $99/yr). Go to https://developer.apple.com/programs/enroll. Pay, wait 24–48 h for activation, then accept the latest agreements at https://appstoreconnect.apple.com.

2. **App Store Connect record** (one-time per app). At App Store Connect → Apps → "+" → New App. Fill out:
   - Platform: iOS
   - Name: Libre
   - Primary Language: English (U.S.)
   - Bundle ID: `com.mattssoftware.kata`
   - SKU: `libre-ios-001` (free-form, never visible publicly)
   - User Access: Full Access

3. **Build the archive in Xcode** (every release).
   ```bash
   cd src-tauri/gen/apple
   xcodegen generate                    # regenerates the .xcodeproj from project.yml
   open fishbones.xcodeproj             # then Product → Archive in Xcode
   ```
   Steps inside Xcode:
   - Select the **Generic iOS Device** (or a real device) as the build destination.
   - **Product → Archive**. The Tauri Rust prebuild script runs first and produces `Externals/arm64/release/libapp.a`; the Swift wrapper then links against it.
   - When the Organizer window opens: **Distribute App → App Store Connect → Upload**.
   - Code signing: **Automatic**, with Team `F6ZAL7ANAD`.
   - Encryption: see [`metadata/export-compliance.md`](./metadata/export-compliance.md) — answer "no" to non-exempt encryption.
   - Wait ~10–30 minutes for App Store Connect to process the build (you'll get an email).

4. **Fill out the App Store Connect record** (every release; reuse from previous if metadata is unchanged):
   - Pull text from [`metadata/`](./metadata/).
   - Drag screenshots from [`screenshots/iphone-6.9/`](./screenshots/iphone-6.9/) and [`screenshots/ipad-13/`](./screenshots/ipad-13/) into the matching slots.
   - Drag the 1024×1024 icon (see [`icon/README.md`](./icon/README.md)).

5. **App Privacy section** — answer the data-collection questions using [`metadata/privacy-labels.md`](./metadata/privacy-labels.md). One-time per major change.

6. **Pricing & Availability** — Free, all territories. Set once.

7. **Add for Review → Submit for Review**. Apple's median review time is 24–48 hours. Approval status emails roll in.

8. **Release** — manual or automatic. For the first version, manual lets you flip the switch when the marketing site is also ready.

## Key dependencies before submitting

- [ ] `libre.academy/privacy` and `libre.academy/support` are reachable and have substantive content.
- [ ] iOS `PRODUCT_NAME` updated to "Libre" (see warning above).
- [ ] iPad layout actually loads (see the recent `[boot]` perf fixes — confirm via Settings → Developer → Show console).
- [ ] App icon's 1024×1024 master is opaque (no transparency, no rounded corners).
- [ ] Distribution certificate + App Store provisioning profile installed on the build Mac (Xcode → Settings → Accounts handles this when "Automatic signing" is checked).
- [ ] Test on a real device via TestFlight at least once before the first review submission. Apple's reviewers will reject for crashes that simulator-only testing missed.

## Common rejection reasons (and how Libre avoids each)

- **5.1.1 — Sign-In with Apple required.** If you offer a third-party sign-in (Google), you MUST also offer Sign in with Apple. Libre offers both, so this is fine. ✅
- **2.1 — App is "metadata-only" / lacks functionality.** Libre has 19+ courses bundled; the empty-library state is rare. Make sure first-launch seed runs cleanly on the test device. ✅
- **4.0 — Design / poorly tuned for iOS.** The mobile UI was redesigned for touch (single-column, bottom tab bar, no sidebar). Test on the actual reviewer-target device.
- **5.1.2 — Data collection without consent.** Libre's relay sync is opt-in (sign-in flow). The privacy labels document this. ✅
- **2.5.1 — Uses non-public APIs.** Tauri 2 doesn't, but double-check no debug commands leak (the dev console gesture is hidden by default). ✅
- **3.1.1 — In-app purchase required for digital goods.** Libre is free with no IAP. ✅

## When something goes wrong during review

Apple's rejection email points to a specific guideline number. Map it to https://developer.apple.com/app-store/review/guidelines/ and reply via the Resolution Center with either:
- A code fix + new build upload, OR
- A clarification (sometimes the reviewer misunderstood — politely explain and reference the relevant section).

Resolution-Center replies typically get a response in 24 hours.

## After approval

- The first release is manual. From the version page, click "Release this version" when ready.
- Subsequent releases (`0.1.16`, `0.1.17`, etc.) only need: bump `CFBundleShortVersionString` in `Info.plist`, bump `CFBundleVersion` (must increase per upload), archive, upload, fill in "What's New in This Version", submit.
- TestFlight builds don't need full review for the same major version — internal testers see them immediately, external testers after a quick "beta review" (often <1 hour).
- Rebuild the Xcode project after every `xcodegen generate` if you've touched `project.yml`.

## Where the source-of-truth lives

| Asset | File |
| --- | --- |
| Bundle ID, version | `src-tauri/tauri.conf.json` |
| Display name, deployment target | `src-tauri/gen/apple/project.yml` |
| Camera/etc. usage strings | `src-tauri/gen/apple/fishbones_iOS/Info.plist` |
| App Group entitlement | `src-tauri/gen/apple/fishbones_iOS/fishbones_iOS.entitlements` |
| Icon master | `cover-overrides/`-style — see [`icon/README.md`](./icon/README.md) |
| Marketing copy | [`metadata/description.md`](./metadata/description.md) |
| Privacy answers | [`metadata/privacy-labels.md`](./metadata/privacy-labels.md) |

That's the whole loop. Start with [`checklist.md`](./checklist.md) when you're actually doing the submission — this README is the "why," that's the "what to click."
