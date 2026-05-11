# App Listing — short metadata fields

Drop these into App Store Connect's "App Information" section. They don't change between releases unless you're rebranding.

## Name (max 30 characters)

```
Libre
```
Length: 5/30.

## Subtitle (max 30 characters)

Pick one. The first is recommended — concrete + verb-led.

```
Turn books into hands-on courses
```
Length: 32 chars — too long. Try:

```
Books into hands-on courses
```
Length: 27/30.

Alternative phrasings (each ≤ 30):
- `Learn programming from any book` (31 — over by one, drop "from")
- `Learn programming from books` (28)
- `Run code from any book offline` (30)
- `Interactive technical books` (27)

**Pick:** `Books into hands-on courses` — it's the most specific and matches the libre.academy hero copy.

## Bundle ID

```
com.mattssoftware.kata
```

## SKU

App Store Connect needs a unique SKU per app — it's never visible to users.

```
libre-ios-001
```

## Primary Category

```
Education
```

## Secondary Category

```
Developer Tools
```

## Age Rating questionnaire answers

The wizard asks ~12 yes/no questions. For Libre, every answer is **None / No** EXCEPT:

- **Unrestricted Web Access**: **No** — the in-lesson runtime hits a few hardcoded sandboxes (play.rust-lang.org, play.golang.org), not arbitrary URLs.
- **Gambling**: **No**
- **Contests**: **No**
- **Mature/Suggestive Themes**: **No**
- **Violence (Cartoon/Realistic/Prolonged)**: **None**
- **Profanity**: **None** — the bundled courses are technical books; check this carefully if you ever bundle a book that swears (e.g. some Mastering Bitcoin commentary).
- **Sexual Content**: **None**
- **Horror/Fear**: **None**
- **Medical/Treatment Info**: **No**
- **Drugs/Alcohol/Tobacco**: **None**
- **Simulated Gambling**: **No**

Result: **4+** rating.

## Content Rights

Apple asks: "Does your app contain, show, or access third-party content?"

Libre bundles excerpts and exercises derived from open-source / Creative-Commons technical books (The Rust Programming Language, Mastering Bitcoin, etc.) that explicitly permit derivative educational works. **Tick "Yes — third-party content"** and add this in the box:

```
The bundled course content is derived from open-source / Creative-Commons
licensed technical books, used under each book's permissive license
(MIT, Apache 2.0, CC BY-NC-SA, or equivalent). Attribution and license
text are surfaced in-app from each course's settings page. Originals
are reachable via the "View source" link in each lesson.
```

(Adjust this if you bundle anything that doesn't fit — for example, the `hellotrade` course is Libre-original content and doesn't need the disclaimer.)

## Routing App Coverage File

N/A — Libre isn't a navigation app.
