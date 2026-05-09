# App Privacy "Nutrition Labels"

These are the answers to App Store Connect → App Privacy → Get Started. Every app on the store has to answer these. Apple shows a summary on the listing page ("Data Used to Track You" / "Data Linked to You" / "Data Not Linked to You" / "Data Not Collected").

The truth for Libre: the app is local-first and the cloud sync is opt-in via a sign-in dialog. **What follows below is what to declare assuming a user opts into cloud sync** — that's the worst-case label, since opting out collects nothing.

## Top-level questions

### "Do you or your third-party partners collect data from this app?"

**Yes** — when the user signs in for cloud sync.

### "Do you or your third-party partners use data for tracking purposes?"

**No.** Libre never shares data with third parties for advertising / cross-app analytics. The only network destination is the user's own backing relay (`api.mattssoftware.com`), which is operated by the same legal entity as the app.

## Data Types collected

For each, App Store Connect asks:
1. **Linked to identity?** (Identified by the user's account ID.)
2. **Used for tracking?** (Always No for Libre.)
3. **Purposes** (App Functionality / Analytics / Personalization / etc.)

### Contact Info

#### Email Address
- **Collected**: Yes (only when user opts into cloud sync via email/password or magic-link sign-in)
- **Linked to identity?** Yes
- **Used for tracking?** No
- **Purposes**: App Functionality (account auth, password reset)

#### Name
- **Collected**: Yes (only when user signs in with Apple/Google and the provider returns a display name; user can also enter one in their profile)
- **Linked to identity?** Yes
- **Used for tracking?** No
- **Purposes**: App Functionality (display name in the UI)

### Identifiers

#### User ID
- **Collected**: Yes (the account UUID issued by the relay; never device-tied)
- **Linked to identity?** Yes
- **Used for tracking?** No
- **Purposes**: App Functionality (so the relay knows whose progress to sync)

### Usage Data

#### Product Interaction (lesson completion timestamps, streak data)
- **Collected**: Yes (synced for cross-device progress)
- **Linked to identity?** Yes (linked to the account UUID)
- **Used for tracking?** No
- **Purposes**: App Functionality (so finishing a lesson on iPad shows the same green checkmark on iPhone)

### Diagnostics

#### Crash Data
- **Collected**: No — Libre doesn't ship a crash reporter. Apple's own crash logs go through TestFlight / App Store Connect's standard pipeline, which Apple handles separately and doesn't require a label.

#### Performance Data
- **Collected**: No

#### Other Diagnostic Data
- **Collected**: No

## Data NOT collected (explicitly)

Tick "Not Collected" for everything below — these are the categories the questionnaire walks through, and Libre genuinely doesn't gather any of them.

- **Health & Fitness** — Not collected.
- **Financial Info** — Not collected.
- **Location** (Precise / Coarse) — Not collected.
- **Sensitive Info** — Not collected.
- **Contacts** — Not collected.
- **User Content** (Emails / SMS / Photos / Videos / Audio / Gameplay / Customer Support) — **Course content the user imports stays on-device** unless they explicitly export it. The only "user content" that crosses the wire is lesson-completion timestamps (already covered under Usage Data) and the optional encrypted backup of imported courses (an opt-in setting, not the default — declare it only if you ship that feature publicly).
- **Browsing History** — Not collected.
- **Search History** — Not collected.
- **Identifiers — Device ID** — Not collected. The app installs a fresh anonymous UUID inside its sandbox to namespace local data, but never reads IDFA / IDFV / vendor IDs.
- **Purchases** — Not collected.
- **Other Data** — Not collected.

## Privacy Policy URL

```
https://libre.academy/privacy
```

The policy must explicitly cover everything you ticked above. Mirror the language: name, email, account UUID, product-interaction timestamps. Note that all of it is for app functionality, none of it is sold or shared, and that opting out (= not signing in) collects nothing.

## Sign in with Apple — special note

Because Libre offers third-party sign-in (Google + email), App Store Review Guideline **5.1.1 (iv)** requires offering Sign in with Apple too. Libre already does. If you ever drop SIWA, you'd also have to drop the other third-party sign-ins (or the app gets rejected).

## Re-using these labels

Privacy labels persist across versions. You only have to redo the questionnaire if Libre's data collection actually changes — for example, adding analytics, adding crash reporting, or piping any user content to a third party. Adding a new course (no data implications) doesn't require a re-submission.
