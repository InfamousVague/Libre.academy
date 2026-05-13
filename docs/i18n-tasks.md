# i18n translation work — task checklist

One task per checkbox. Each task is sized to fit comfortably inside a
single Claude session. Open this file at the start of every session,
pick the next unchecked box, do that task, check it off, commit.

**Target locales** (6 total, sharing one Settings → Language picker):
`en` (source of truth), `es`, `ru`, `fr`, `kr`, `jp`.

The locale list lives in `src/data/locales.ts` (`SUPPORTED_LOCALES`,
`LOCALE_NAMES`, `LOCALE_FLAGS`). The UI-string runtime imports a JSON
catalog per locale from `src/i18n/locales/<code>.json`. To add a
seventh locale: extend the three constants in `data/locales.ts`,
drop a new `<code>.json` next to the existing ones, add it to
`DICTS` in `src/i18n/i18n.tsx`.

**Single language setting:** the previous draft had two separate
"Interface language" and "Course language" pickers — these have
been merged into ONE Settings → Appearance → Language dropdown
that drives BOTH the UI strings and the lesson-content translation
overlays. The picker is the existing `LanguageDropdown` component.

## Quick reference

**To extract strings from a component file:**

```tsx
// 1. Add the import (path is relative to the file you're editing)
import { useT } from "../../i18n/i18n";

// 2. Add this at the top of the component function
const t = useT();

// 3. Replace each hardcoded user-facing string with t("namespace.key")
//    e.g. "Cancel" → {t("common.cancel")}
//         placeholder="Search…" → placeholder={t("library.searchPlaceholder")}
//         aria-label="Close" → aria-label={t("common.close")}
```

Then add the key to BOTH `src/i18n/locales/en.json` (English) and
`src/i18n/locales/es.json` (Spanish). Re-use existing namespaces
when the string fits (`common.cancel`, `nav.library`, etc.); add a
new namespace section when the surface doesn't have one yet.

After every change: `npx tsc --noEmit`. Should exit 0.

**To translate a book:**

1. Pick the `<book-id>` from the list below.
2. The .academy archive lives at
   `src-tauri/target/debug/resources/bundled-packs/<book-id>.academy`
   and is a zip of `course.json` + `cover.jpg`.
3. Extract `course.json`, read it.
4. Produce `course.es.json` with the SAME schema but with these
   fields translated:
   - top-level `title`, `description`
   - each `chapters[].title`
   - each `chapters[].lessons[].title`
   - each `chapters[].lessons[].body` (markdown — preserve code
     fences verbatim; translate prose only)
   - each `chapters[].lessons[].objectives[]`
   - each `chapters[].lessons[].hints[]` (when present)
5. Leave `id`, `language`, `kind`, `author`, exercise `starter` /
   `solution` / `tests` strings UNTOUCHED — those drive runtime
   behaviour.
6. Re-pack the archive so the bundled-packs file contains both
   `course.json` and `course.es.json`, or save the translated file
   alongside the unpacked course on disk if the loader has been
   wired (see the data-layer overlay punch list item below).

---

## Phase 0 — already shipped

- [x] i18n engine (`src/i18n/i18n.tsx`) — routes through the existing
      `useLocale` hook so UI + course content share one setting
- [x] `en.json` baseline
- [x] `es.json` (Spanish) — full UI translation
- [x] `ru.json` (Russian) — full UI translation
- [x] `fr.json` (French) — full UI translation
- [x] `kr.json` (Korean) — full UI translation
- [x] `jp.json` (Japanese) — full UI translation
- [x] `<I18nProvider>` mounted at React root (`main.tsx`)
- [x] Settings → Appearance → Language picker (single, unified)
- [x] NavigationRail
- [x] SandboxSidebar
- [x] SandboxFileTree
- [x] NewProjectDialog
- [x] SandboxGitPanel
- [x] SandboxView (header controls + segmented toggle + generate strip)
- [x] TopBarSearch
- [x] TipDropdown (Support button)
- [x] CommandPalette
- [x] TracksView (header + search)
- [x] EditorPane (run, hints panel, reveal-solution confirm, mode toggle, tabs)
- [x] LessonNav (prev/next)
- [x] MiniCertBanner (fully extracted)
- [x] CourseLibrary section labels (Books / Challenges + blurbs)

---

## Phase 1 — UI string extraction punch list

One file per task. Order is by user visibility — work top-down.

### Tier A — high-traffic surfaces

- [x] **CourseLibrary header**
  `src/components/Library/CourseLibrary.tsx`
  Strings: page title ("Library"), subtitle ("N courses on this
  machine"), "Add course", "Export all", "Update all (N)", scope
  toggle labels ("Library" / "Discover"), category toggle
  ("Programming" / "Crypto"), language filter ("All languages"),
  empty state.

- [x] **LibraryControls**
  `src/components/Library/LibraryControls.tsx`
  Strings: search placeholder, filter label, sort options
  ("Name (A–Z)", "Recent", "Progress"), import dropdown ("Import",
  "PDF", "Bulk PDFs", "Archive"), shelf-vs-grid toggle aria.

- [x] **CourseCard**
  `src/components/Library/CourseCard.tsx`
  Strings: progress states ("NOT STARTED", "COMPLETED"), "{done}/
  {total} lessons", "{count} chapters", "by {author}", aria
  labels.

- [x] **AddCourseButton**
  `src/components/Library/AddCourseButton.tsx`
  Strings: button label, dropdown items.

- [x] **ArchiveDropOverlay**
  `src/components/Library/ArchiveDropOverlay.tsx`
  Strings: drop zone prompt, success/error toasts.

- [x] **Sidebar**
  `src/components/Sidebar/Sidebar.tsx`
  Strings: "Resume" label, course-row aria labels, expand/collapse
  affordances.

- [x] **CourseGroup**
  `src/components/Sidebar/CourseGroup.tsx`
  Strings: collapsed-row aria, active-course "you are here" dot
  aria, progress ring label.

- [x] **ChapterTree**
  `src/components/Sidebar/ChapterTree.tsx`
  Strings: chapter expand/collapse aria, lesson row aria.

- [x] **ChapterGrid**
  `src/components/Sidebar/ChapterGrid.tsx`
  Strings: chapter title aria, cell aria ("Lesson N", status),
  hover tooltip.

- [x] **CourseCarousel**
  `src/components/Sidebar/CourseCarousel.tsx`
  Strings: aria for carousel + each card.

- [x] **CertStamps**
  `src/components/Sidebar/CertStamps.tsx`
  Strings: aria, "Earned" badge.

- [x] **LessonReader**
  `src/components/Lesson/LessonReader.tsx`
  Strings: "Objectives" header, exercise prompts shell ("Try it",
  "Test results"), mark-complete CTA, error states. Note: lesson
  prose is translated via the BOOK pipeline, not here.

- [x] **LessonView**
  `src/components/Lesson/LessonView.tsx`
  Strings: layout toggle labels, container aria.

- [x] **LessonPopover**
  `src/components/Lesson/LessonPopover.tsx`
  Strings: tip surface labels.

- [x] **OutputPane**
  `src/components/Output/OutputPane.tsx`
  Strings: "CONSOLE", "TESTS", "run your code to see output here",
  empty / error / running states, "preview" / "console" tab pill
  labels, "open preview" / "copy URL" affordances.

- [x] **TopBar**
  `src/components/TopBar/TopBar.tsx`
  Strings: tab "close" aria, "rename tab" affordance, "open in
  new tab" tooltip, account dropdown items, "Sign in" /
  "Sign out" labels in the stats menu.

- [x] **StatsChip**
  `src/components/TopBar/StatsChip.tsx`
  Strings: streak / XP labels, dropdown menu items.

### Tier B — Settings dialog

These all live under `src/components/dialogs/SettingsDialog/`. Each
pane is short enough to do in one task.

- [x] **ThemePane**
  `dialogs/SettingsDialog/ThemePane.tsx`
  Strings: page description, "Theme" card title, theme names,
  variant blurbs, "Sidebar layout" labels.

- [x] **GeneralPane**
  `dialogs/SettingsDialog/GeneralPane.tsx`

- [x] **ShortcutsPane** + **ShortcutCapture**
  `dialogs/SettingsDialog/ShortcutsPane.tsx`
  `dialogs/SettingsDialog/ShortcutCapture.tsx`

- [x] **DataPane**
  `dialogs/SettingsDialog/DataPane.tsx`

- [x] **AiPane**
  `dialogs/SettingsDialog/AiPane.tsx`

- [x] **SoundPane**
  `dialogs/SettingsDialog/SoundPane.tsx`

- [x] **AccountSection**
  `dialogs/SettingsDialog/AccountSection.tsx`

- [x] **DeveloperPane**
  `dialogs/SettingsDialog/DeveloperPane.tsx`

- [x] **DiagnosticsPanel**
  `dialogs/SettingsDialog/DiagnosticsPanel.tsx`

- [ ] **SyncDebugPanel**
  `dialogs/SettingsDialog/SyncDebugPanel.tsx`

- [x] **SettingsNav** + **SettingsDialog** shell
  `dialogs/SettingsDialog/SettingsNav.tsx`
  `dialogs/SettingsDialog/SettingsDialog.tsx`

### Tier C — modals + dialogs

- [ ] **SignInDialog**
  `dialogs/SignInDialog/SignInDialog.tsx`
  Strings: tabs, form labels, OAuth button text, error states.

- [x] **FirstLaunchPrompt**
  `dialogs/SignInDialog/FirstLaunchPrompt.tsx`

- [ ] **ImportDialog**
  `dialogs/ImportDialog/ImportDialog.tsx`

- [ ] **BulkImportDialog**
  `dialogs/ImportDialog/BulkImportDialog.tsx`

- [ ] **DocsImportDialog**
  `dialogs/ImportDialog/DocsImportDialog.tsx`

- [ ] **StatsBar (import)**
  `dialogs/ImportDialog/StatsBar.tsx`

- [ ] **GeneratePackDialog**
  `dialogs/ChallengePack/GeneratePackDialog.tsx`

- [x] **ConfirmDialog**
  `dialogs/ConfirmDialog/ConfirmDialog.tsx`

- [ ] **CourseSettingsModal**
  `dialogs/CourseSettings/CourseSettingsModal.tsx`

- [ ] **FixApplierDialog**
  `dialogs/FixApplier/FixApplierDialog.tsx`

### Tier D — banners + overlays

- [x] **InstallBanner**
  `banners/InstallBanner/InstallBanner.tsx`

- [x] **UpdateBanner**
  `banners/UpdateBanner/UpdateBanner.tsx`

- [x] **MissingToolchainBanner**
  `banners/MissingToolchain/MissingToolchainBanner.tsx`

- [x] **DesktopUpsellBanner**
  `banners/DesktopUpsell/DesktopUpsellBanner.tsx`

- [x] **AchievementOverlay** + **AchievementToast** +
  **AchievementModal** + **SectionCompleteSummary**
  (AchievementBadge has no user-visible text)
  `Achievements/*.tsx`

- [x] **NotificationDrawer**
  `NavigationRail/NotificationDrawer.tsx`

### Tier E — content surfaces

- [x] **CertificatesPage** + **CertificateModal** +
  **CertificateTicket** + **InProgressTicket**
  `Certificates/*.tsx`

- [ ] **ProfileView**
  `Profile/ProfileView.tsx`

- [x] **PracticeView** (PracticeSession + PracticeBlocks pending)
  `Practice/*.tsx`

- [ ] **TrackDetail**
  `Tracks/TrackDetail.tsx`

- [ ] **QuizView**
  `Quiz/QuizView.tsx`

- [ ] **BlocksView**
  `Blocks/BlocksView.tsx`

- [ ] **ChallengeFrame**
  `ChallengeFrame/ChallengeFrame.tsx`

- [x] **Tour**
  `Tour/Tour.tsx`

### Tier F — AI surface

- [ ] **AiAssistant**
  `AiAssistant/AiAssistant.tsx`

- [x] **AiChatPanel**
  `AiAssistant/AiChatPanel.tsx`

- [x] **AiCharacter**
  `AiAssistant/AiCharacter.tsx`

- [ ] **Add locale to AI system prompts**
  Wire the user's locale through `libre:ask-ai` event detail; have
  `call_llm` in `src-tauri/src/llm.rs` accept a `target_locale`
  and append a "respond in {locale}" instruction to the system
  prompt. So the AI tutor answers in the user's language.

### Tier G — niche / specialised

- [ ] **ChainDock** + **EvmDockBanner**
  `ChainDock/*.tsx`

- [ ] **BitcoinChainDock** + **BitcoinDockBanner**
  `BitcoinChainDock/*.tsx`

- [ ] **SvmDock** + **SvmDockBanner**
  `SvmDock/*.tsx`

- [ ] **TradeDock** + **TradeDockBanner**
  `TradeDock/*.tsx`

- [ ] **Ledger UI** (DeviceAction, LedgerStatusPill)
  `Ledger/*.tsx`

- [ ] **PartnerKeyboard**
  `PartnerKeyboard/PartnerKeyboard.tsx`

- [ ] **TTSButton**
  `Lesson/TTSButton.tsx`

- [ ] **PhoneFrame** + **PhonePopoutView** + **PhoneToggleButton**
  `PhoneFrame/PhoneFrame.tsx`, `PhonePopout/PhonePopoutView.tsx`,
  `FloatingPhone/PhoneToggleButton.tsx`

- [ ] **InlineSandbox**
  `Lesson/InlineSandbox.tsx`

- [ ] **Workbench** + **PoppedWorkbench**
  `Workbench/*.tsx`

- [ ] **VerifyCourseOverlay**
  `VerifyCourse/VerifyCourseOverlay.tsx`

- [ ] **TrayPanel**
  `TrayPanel/TrayPanel.tsx`

- [ ] **FloatingIngestPanel**
  `IngestPanel/FloatingIngestPanel.tsx`

- [ ] **DownloadButton**
  `DownloadButton/DownloadButton.tsx`

- [ ] **LanguageChip** + **LanguageDropdown** (course-language,
  separate from interface-language picker)
  `LanguageChip/*.tsx`, `LanguageDropdown/*.tsx`

- [ ] **CourseContextMenu**
  `Shared/CourseContextMenu.tsx`

- [ ] **ReactNativeDevTools**
  `Output/ReactNativeDevTools.tsx`

### Tier H — mobile path

- [ ] **MobileApp**
  `src/mobile/MobileApp.tsx`

- [ ] **MobileTabBar**
  `MobileTabBar/MobileTabBar.tsx`

- [ ] **MobilePlayground / MobileQuiz / MobileLesson / etc.**
  All `src/mobile/Mobile*.tsx` files.

---

## Phase 2 — data-layer overlay for translated courses

Required before book translations have any user-visible effect.

- [ ] **Wire `course.<locale>.json` overlay in `useCourses.ts`**
  When the hook resolves a course, check for a sibling
  `course.<locale>.json` next to the original `course.json`. If
  present, merge translated fields (title, description, chapter
  titles, lesson titles + bodies + objectives + hints) over the
  English course before handing it to React. Keep `id`, `language`,
  `kind`, exercise wiring (`starter`, `solution`, `tests`) from
  the original — translation never touches runtime behaviour.

- [ ] **Wire the Rust loader to emit locale-specific files**
  In `src-tauri/src/courses.rs`, when extracting a `.academy`
  archive, copy any `course.*.json` siblings into the installed
  course folder so the frontend overlay above can find them.

- [ ] **Sandbox project starter templates** (smaller scope)
  `src/runtimes/playgroundTemplates/single-file.ts` has a few
  prose comments inside the starter content. Translate the
  comments (leave code untouched).

---

## Phase 3 — book translation

35 books, sorted small → large so quick wins land first. Use
the "To translate a book" recipe at the top of this file.

For each book, the unit of work is **the whole `course.json`**
unless the book has > 50 lessons, in which case the entry below
suggests splitting into chapter-range sub-tasks so each fits in a
session.

### Challenge packs (single-session each)

These are flat lists of short coding problems — minimal prose, fast
to translate.

- [ ] `react-native-challenges` (24KB)
- [ ] `hellotrade` (47KB)
- [ ] `the-rustonomicon` (57KB)
- [ ] `kotlin-challenges` (62KB)
- [ ] `cpp-challenges` (63KB)
- [ ] `csharp-challenges` (66KB)
- [ ] `java-challenges` (68KB)
- [ ] `python-challenges` (69KB)
- [ ] `javascript-challenges` (71KB)
- [ ] `assembly-challenges-arm64-macos` (77KB)
- [ ] `c-challenges` (81KB)
- [ ] `swift-challenges` (83KB)
- [ ] `learning-ledger` (100KB)
- [ ] `rust-challenges` (103KB)
- [ ] `typescript-challenge-pack` (115KB)
- [ ] `go-challenges` (124KB)
- [ ] `challenges-haskell-handwritten` (147KB)
- [ ] `challenges-lua-handwritten` (147KB)
- [ ] `challenges-cairo-handwritten` (150KB)
- [ ] `challenges-sql-handwritten` (151KB)
- [ ] `challenges-sway-handwritten` (156KB)
- [ ] `challenges-ruby-handwritten` (158KB)
- [ ] `challenges-scala-handwritten` (159KB)
- [ ] `challenges-zig-handwritten` (159KB)
- [ ] `challenges-move-handwritten` (161KB)
- [ ] `challenges-dart-handwritten` (167KB)
- [ ] `challenges-elixir-handwritten` (167KB)

### Books — small (single-session each, may be tight)

- [ ] `a-to-zig` (110KB, ~15 chapters)
- [ ] `a-to-ts` (114KB, 15 chapters / 105 lessons)
- [ ] `solana-programs-rust-on-the-svm` (122KB, ~12 chapters)

### Books — large (split into chapter ranges, one task per range)

For these books, do one chapter range per session to keep each
task within budget. The chapter splits below are suggestions —
adjust based on actual lesson density.

- [ ] `mastering-ethereum` (208KB, 12 chapters / 133 lessons) —
  chapters 1–4
- [ ] `mastering-ethereum` — chapters 5–8
- [ ] `mastering-ethereum` — chapters 9–12

- [ ] `the-rust-programming-language` (216KB, 10 chapters / 168
  lessons) — chapters 1–3
- [ ] `the-rust-programming-language` — chapters 4–6
- [ ] `the-rust-programming-language` — chapters 7–10

- [ ] `mastering-bitcoin` (217KB, 8 chapters / 87 lessons) —
  chapters 1–4
- [ ] `mastering-bitcoin` — chapters 5–8

- [ ] `learning-go` (377KB, 16 chapters / 258 lessons) — chapters
  1–4
- [ ] `learning-go` — chapters 5–8
- [ ] `learning-go` — chapters 9–12
- [ ] `learning-go` — chapters 13–16

### Per-book finalisation

After all chapter-range subtasks for a multi-part book are checked:

- [ ] Re-pack `mastering-ethereum.es.json` into the
  `mastering-ethereum.academy` archive (or save alongside the
  unpacked course depending on loader wiring).
- [ ] Re-pack `the-rust-programming-language` similarly.
- [ ] Re-pack `mastering-bitcoin` similarly.
- [ ] Re-pack `learning-go` similarly.

---

## Phase 4 — second target locale (optional)

The UI is already wired for all 6 supported locales (en, es, ru,
fr, kr, jp). The remaining locale-specific work is per book — for
each book in Phase 3, the same translation task has to be done
6 ways (once per non-English locale). To keep this list manageable,
Phase 3 below tracks each book only against Spanish; once Spanish
is solid for a book, clone the per-book task for ru/fr/kr/jp.

- [ ] To add a 7th locale (German, Chinese, Portuguese, …):
  extend `SUPPORTED_LOCALES` / `LOCALE_NAMES` / `LOCALE_FLAGS` in
  `src/data/locales.ts`, drop a new `<code>.json` next to the
  existing ones, add it to `DICTS` in `src/i18n/i18n.tsx`,
  translate every value.

---

## Style notes for translators

- **Casing matches the English** — if the English value is lower-case
  (`run`, `next`, `help`), the Spanish equivalent should also be
  lower-case. UI typography depends on this consistency.
- **Punctuation matches the English** — preserve `…` for in-progress
  states, em-dashes for clauses, `→` for "next" arrows.
- **Don't translate brand names** — "Libre", "Tauri", "Monaco",
  language names like "TypeScript", "Rust".
- **Code blocks in lesson bodies** — translate prose, leave code
  fences (` ``` ` blocks + inline backticks) verbatim. Variable
  names, function names, and CLI command strings are untranslatable.
- **Markdown structure** — preserve heading levels, list markers,
  blockquote markers, links.
- **`{name}` placeholders** — keep them exactly as-is in the
  translated value; the runtime fills them. e.g. English `"{count}
  files"` → Spanish `"{count} archivos"`, NOT `"{contar} archivos"`.

---

## Session workflow

1. Open `docs/i18n-tasks.md`.
2. Pick the next unchecked box in the highest-priority section that
   has work remaining (Phase 1 Tier A > B > C > D, then Phase 2,
   then Phase 3, etc.).
3. Do exactly that one task.
4. `npx tsc --noEmit`. If 0, check the box and commit.
5. Stop. Don't push to the next task — better to finish-and-ship
   one thing than start two and finish neither.
