# Multi-language translations

Fishbones-authored courses (the in-house tutorials, HelloTrade, learning-ledger,
and every challenge pack) can be translated into five additional locales:

| Code | Language | Endonym  | Browser code |
| ---- | -------- | -------- | ------------ |
| `en` | English  | English  | en           |
| `ru` | Russian  | Русский  | ru           |
| `es` | Spanish  | Español  | es           |
| `fr` | French   | Français | fr           |
| `kr` | Korean   | 한국어     | ko           |
| `jp` | Japanese | 日本語    | ja           |

Third-party books bundled in the catalog (The Rust Programming Language,
Mastering Bitcoin, Learning Go, etc.) ship in their original language only —
their licenses cover redistribution but not translation derivatives, and
shipping AI-translated versions of those books would conflate Fishbones'
authoring voice with the original authors'.

## What gets translated

- Course `title` + `description`
- Chapter `title`
- Lesson `title`, `body` (markdown prose), `objectives[]`
- Exercise `hints[]`
- Quiz `questions[].prompt`, `options[]`, `explanation`

What does NOT get translated, by design:

- Code blocks (` ``` ` fences) and inline backticks
- Function names, variable names, file paths, URLs
- Quiz `accept[]` (short-answer accepted strings — translating risks
  silently breaking grading because matching is normalised + case-
  insensitive against the source list)
- Lesson `enrichment.glossary` / `enrichment.symbols` (inline-code
  popovers — the term itself shouldn't move between languages)
- Audio narration (currently English-only via ElevenLabs; per-locale
  audio is a future extension)

## Storage shape

Translations live INLINE on the course JSON, keyed by locale, under
optional `translations` fields on `Course`, `Chapter`, and `LessonBase`.
TypeScript types: `src/data/locales.ts`. Read-time merge helpers:
`src/data/localize.ts`.

```jsonc
{
  "id": "hellotrade",
  "title": "HelloTrade",
  "translations": { "ru": { "title": "HelloTrade" /* ... */ } },
  "chapters": [
    {
      "id": "intro",
      "title": "Introduction",
      "translations": { "ru": { "title": "Введение" } },
      "lessons": [
        {
          "id": "what-is-hellotrade",
          "title": "What is HelloTrade?",
          "body": "...",
          "translations": {
            "ru": {
              "title": "Что такое HelloTrade?",
              "body": "...",
              "objectives": ["...", "..."]
            }
          }
        }
      ]
    }
  ]
}
```

Missing keys fall back to English silently — partial translations are
first-class. Switching locale in the dropdown immediately re-renders
the lesson reader through `localizedLesson()`; React's referential
equality on the source lesson + memoisation in `LessonView` keep the
hot path cheap.

## Authoring translations by hand

Two paths are wired in. Pick whichever matches the situation:

### Hand-authored overlays + merge script (no API spend)

`scripts/apply-translations.mjs` reads `public/starter-courses/i18n/<courseId>*.json`
and merges the per-locale overlays into the course JSON. Each course can have
multiple sibling overlay files (e.g. `hellotrade.json` for the spine of titles,
`hellotrade-01-intro.json` for the intro chapter bodies, etc.) — the script
globs them in lex order so a clean naming scheme like
`<courseId>-<NN>-<chapter>.json` keeps things organised without ever needing
to hand-edit the giant course JSON directly.

Overlay shape:

```jsonc
{
  "ru": {
    "course": { "title": "...", "description": "..." },
    "chapters": {
      "intro": {
        "title": "Введение",
        "lessons": {
          "what-is-hellotrade": {
            "title": "Что такое HelloTrade?",
            "body": "...markdown...",
            "objectives": ["...", "..."],
            "hints": ["...", "..."],
            "questions": [{ "prompt": "...", "options": ["...", "..."], "explanation": "..." }]
          }
        }
      }
    }
  },
  "es": { /* mirror the ru shape */ },
  "fr": { /* ... */ },
  "kr": { /* ... */ },
  "jp": { /* ... */ }
}
```

Run after editing any overlay:

```bash
node scripts/apply-translations.mjs hellotrade
```

The script reports how many translation blocks merged. Idempotent — re-applying
the same overlay rewrites the same fields.

### API-powered translations (translate-course.mjs)

The pipeline below is the hands-off path that uses the Anthropic API
to translate everything in bulk. Idempotent — re-running only fills
in lessons / locales that don't already have a complete translation,
so a partial run can resume from any crash or cancellation.

```bash
# One-time: have ANTHROPIC_API_KEY exported in your shell.
export ANTHROPIC_API_KEY=sk-ant-…

# Translate one course into one locale (good first run):
node scripts/translate-course.mjs hellotrade --locales ru

# Or all five locales at once:
node scripts/translate-course.mjs hellotrade --locales ru,es,fr,kr,jp

# Cap the lessons translated this run (useful to inspect output before
# burning the whole budget):
node scripts/translate-course.mjs hellotrade --locales ru --limit 3

# Re-translate from scratch (ignore existing overlays):
node scripts/translate-course.mjs hellotrade --locales ru --force-relock

# Dry-run (no API calls, no writes):
node scripts/translate-course.mjs hellotrade --locales ru --dry-run
```

The course identifier resolves to `public/starter-courses/<id>.json`.
You can also pass an absolute path to translate any course JSON.

## Translating every Fishbones-authored course

```bash
for c in \
  a-to-zig a-to-ts hellotrade learning-ledger \
  challenges-ruby-handwritten challenges-lua-handwritten \
  challenges-dart-handwritten challenges-haskell-handwritten \
  challenges-scala-handwritten challenges-sql-handwritten \
  challenges-elixir-handwritten challenges-zig-handwritten \
  challenges-move-handwritten challenges-cairo-handwritten \
  challenges-sway-handwritten \
  rust-challenges go-challenges javascript-challenges python-challenges \
  react-native-challenges c-challenges cpp-challenges java-challenges \
  kotlin-challenges csharp-challenges swift-challenges \
  typescript-challenge-pack assembly-challenges-arm64-macos
do
  node scripts/translate-course.mjs "$c" --locales ru,es,fr,kr,jp
done
```

After the script completes for a course, re-pack the .fishbones
archive (`scripts/extract-starter-courses.mjs` rebuilds from the
mutated JSON) and re-run the desktop installer's `make extract-pks`
step to get the new translations bundled into the install.

## Cost estimate

Per the script's per-call instrumentation:

| Course type             | Lessons | EN→one locale | EN→all 5 locales |
| ----------------------- | ------: | ------------: | ---------------: |
| Tiny challenge pack     |     ~5  |    ~$0.20     |       ~$1.00     |
| Long challenge pack     |    ~30  |    ~$1.20     |       ~$6.00     |
| HelloTrade              |    51   |    ~$2.00     |      ~$10.00     |
| A to Zig                |    ~50  |    ~$2.00     |      ~$10.00     |
| Learning Ledger         |    69   |    ~$2.80     |      ~$14.00     |

(Sonnet 4.5 list pricing: $3/M input + $15/M output, average lesson
~700 in / ~900 out.)

Whole catalog (~28 Fishbones-authored courses, ~1500 total lessons,
5 locales) ≈ $200-300. Single-locale runs are linear in lesson count.

## How the runtime picks a locale

1. **First launch**: `detectLocale()` reads `navigator.language` and
   maps it through the supported set. `ru-RU` → `ru`, `ko-KR` → `kr`,
   `ja-JP` → `jp`. Anything else → `en`.
2. **User override**: the LanguageDropdown in Settings (desktop
   `SettingsDialog` Theme rail OR mobile `MobileSettings` Language
   section) writes the choice via `useLocale` → localStorage key
   `fishbones:locale`.
3. **Cross-device**: when signed in, the cloud-sync `settings`
   channel mirrors the choice via the existing `useFishbonesCloud`
   pipeline — flip languages on iPad, see Spanish on the Mac next
   time it boots. (The bridge from `useLocale` to the cloud hook
   uses a `CustomEvent("fishbones:setting-changed")` to avoid a
   layered import cycle; the App-level cloud bootstrap subscribes.)

## Adding a new locale (e.g. Portuguese)

1. Extend `SUPPORTED_LOCALES`, `LOCALE_NAMES`, `LOCALE_FLAGS`, and
   `LOCALE_ENGLISH_NAMES` in `src/data/locales.ts`.
2. Mirror the same entry in `LOCALE_ENGLISH_NAMES` inside
   `scripts/translate-course.mjs`.
3. Add the browser-language-code mapping inside `detectLocale()`
   (`pt-BR` / `pt-PT` → `pt`).
4. Run the pipeline once per Fishbones-authored course with
   `--locales pt`.
