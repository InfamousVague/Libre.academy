# Achievement Prompts

Source-of-truth design doc for Libre's achievement / sound / animation
system. Every entry below corresponds 1:1 to an `Achievement` row in
`src/data/achievements.ts` — keep them in lockstep when editing. Add a
new achievement here first, then mirror it in the TS registry, never
the other way around.

The system is modeled on Duolingo's reward loop: small wins fire often
to build momentum, big milestones pause the UI for a celebration
modal, and the streak/XP curves keep the dopamine humming between
unlocks. Tone target: encouraging-but-grown-up. We're teaching
adults; the copy can wink, never patronise.

## Tier vocabulary

Every achievement has exactly one tier. Tier drives:
- which sound effect plays (bronze→ping, silver→chime, gold→fanfare,
  platinum→arpeggio)
- whether we fire a toast (bronze/silver) vs. a fullscreen modal
  (gold/platinum)
- the celebration colour (token below)
- whether confetti fires (silver+ only)

| tier | colour token | UI on unlock | sound | confetti |
| --- | --- | --- | --- | --- |
| `bronze` | `#cd7f32` | toast (4s) | `ping` | no |
| `silver` | `#c0c0c0` | toast (5s) | `chime` | small burst |
| `gold` | `#ffc857` | modal (dismissable) | `fanfare` | medium burst |
| `platinum` | `#b9f2ff` | modal + sustained confetti | `arpeggio` | large burst |

Don't over-tier. Most achievements should be `bronze` or `silver` —
gold/platinum are reserved for events that genuinely change how
someone feels about their progress.

## Rule shape

Each achievement carries:

```
{
  id: kebab-case slug, frozen forever (used as persistence key)
  title: display name (under 32 chars, sentence case, no period)
  blurb: 1-line description for the toast / list / modal subtitle
  tier: bronze | silver | gold | platinum
  icon: lucide-react icon name (e.g. "Flame", "BookOpen")
  category: progress | streak | volume | depth | breadth | mastery | esoteric
  trigger: a Rule object — see §Trigger shape
  hidden?: true to keep it secret until unlocked (esoteric tier favourite)
  xpReward?: bonus XP awarded on first unlock (default 0)
}
```

### Trigger shape

The engine evaluates triggers against a `ProgressSnapshot` derived
from `useProgress` + `useStreakAndXp`. Each trigger is one of:

- `{ kind: "lessonsTotal", count: N }` — unlocked when `history.length >= N`
- `{ kind: "lessonsKind", lessonKind: "quiz" | "exercise" | "reading" | "mixed", count: N }`
- `{ kind: "chaptersDone", count: N }` — chapters where every lesson is complete
- `{ kind: "booksDone", count: N }` — books where every lesson is complete
- `{ kind: "streakDays", count: N }` — current streak >= N
- `{ kind: "longestStreakDays", count: N }` — best-ever streak >= N
- `{ kind: "level", count: N }`
- `{ kind: "xpTotal", count: N }`
- `{ kind: "lessonsInDay", count: N }` — N completions on the same calendar day
- `{ kind: "languagesTouched", count: N }` — distinct course languages with ≥1 completion
- `{ kind: "booksTouched", count: N }` — distinct courses with ≥1 completion
- `{ kind: "completionTime", before: "HH:MM" }` / `{ kind: "completionTime", after: "HH:MM" }`
- `{ kind: "weekendDouble" }` — at least one Sat AND one Sun completion in same week
- `{ kind: "comeback", days: N }` — completed a lesson after >N days away from that course
- `{ kind: "freezeUsed", count: N }` — N streak freezes consumed

Triggers run on every completion via `evaluateAchievements()` in
`src/lib/achievements.ts`. The engine returns the set of newly-unlocked
ids; UI consumers handle queueing toasts vs. firing modals.

## Persistence

Unlocked-id list lives at `localStorage["fb:achievements:unlocked"]`
on web and mirrors into the same SQLite settings table on desktop via
the existing `storage.kv.set/get` helpers. Each entry stores
`{ id, unlockedAt: epochMs }`. Retired achievements (rows we delete
from this doc) leave their entries alone — old unlocks stay celebrated.

---

## §Onboarding (gentle entry)

The first three are mandatory bronzes — they exist to give every new
learner three quick wins on day one before the difficulty curve kicks
in. Don't tier these higher; the dopamine math doesn't math.

### `first-lesson` — First step
**Tier:** bronze · **Icon:** `Footprints` · **Category:** progress · **XP bonus:** 5
**Blurb:** "One down. The streak is alive."
**Trigger:** `{ kind: "lessonsTotal", count: 1 }`
**Sound:** ping
**Animation:** none — just the toast.

### `first-chapter` — Wrapped a chapter
**Tier:** bronze · **Icon:** `BookOpen` · **Category:** progress · **XP bonus:** 15
**Blurb:** "Every chapter you finish is one fewer left."
**Trigger:** `{ kind: "chaptersDone", count: 1 }`
**Sound:** chime
**Animation:** chapter-end summary card slides in (existing summary surface).

### `first-book` — Closed the book
**Tier:** gold · **Icon:** `BookCheck` · **Category:** progress · **XP bonus:** 100
**Blurb:** "First whole book in the rear-view. The shelf is yours."
**Trigger:** `{ kind: "booksDone", count: 1 }`
**Sound:** fanfare
**Animation:** modal + confetti, autoplay 6s, dismissable. The course
cover does a little tilt-and-glow in the modal hero.

---

## §Streak (Duolingo's load-bearing pillar)

Streaks are calendar-day; the freeze system covers up to two missed
days per week without breaking. Tiers escalate fast because each
extra day is a real commitment.

### `streak-3` — Three in a row
**Tier:** bronze · **Icon:** `Flame` · **Category:** streak · **XP bonus:** 10
**Blurb:** "Three days. The fire is real."
**Trigger:** `{ kind: "streakDays", count: 3 }`

### `streak-7` — One full week
**Tier:** silver · **Icon:** `Flame` · **Category:** streak · **XP bonus:** 25
**Blurb:** "Seven days. You picked up a hobby."
**Trigger:** `{ kind: "streakDays", count: 7 }`
**Confetti:** small burst from the streak chip in the corner.

### `streak-30` — A month of fire
**Tier:** gold · **Icon:** `Flame` · **Category:** streak · **XP bonus:** 100
**Blurb:** "Thirty days. This isn't an experiment any more."
**Trigger:** `{ kind: "streakDays", count: 30 }`

### `streak-100` — Triple digits
**Tier:** platinum · **Icon:** `Flame` · **Category:** streak · **XP bonus:** 500
**Blurb:** "One hundred consecutive days. You've outlasted most New Year's resolutions."
**Trigger:** `{ kind: "streakDays", count: 100 }`

### `streak-365` — A year of fire
**Tier:** platinum · **Icon:** `Sparkles` · **Category:** streak · **XP bonus:** 2500
**Blurb:** "Three hundred and sixty-five. Hall of fame."
**Trigger:** `{ kind: "streakDays", count: 365 }`
**Hidden:** true — don't show locked. The discovery is part of it.

### `streak-saved` — Saved by the freeze
**Tier:** bronze · **Icon:** `Snowflake` · **Category:** streak · **XP bonus:** 0
**Blurb:** "Streak freeze used. Streak preserved. Sleep tonight."
**Trigger:** `{ kind: "freezeUsed", count: 1 }`

### `streak-comeback` — Re-lit the fire
**Tier:** silver · **Icon:** `Flame` · **Category:** streak · **XP bonus:** 30
**Blurb:** "You came back. That's the real win."
**Trigger:** `{ kind: "comeback", days: 14 }`

---

## §Volume (the long, dull middle)

These count completions in absolute terms. They exist mostly to give
"you grinded a lot today" some texture. Bronze for reasonable totals,
silver for "you're a regular," gold for "you should consider what
else you could be doing."

### `volume-10` — Bookworm
**Tier:** bronze · **Icon:** `Bookmark` · **Category:** volume · **XP bonus:** 25
**Blurb:** "Ten lessons. You're on the shelf."
**Trigger:** `{ kind: "lessonsTotal", count: 10 }`

### `volume-50` — Reading habit
**Tier:** bronze · **Icon:** `Bookmark` · **Category:** volume · **XP bonus:** 50
**Blurb:** "Fifty lessons. The habit's stuck."
**Trigger:** `{ kind: "lessonsTotal", count: 50 }`

### `volume-100` — Page turner
**Tier:** silver · **Icon:** `Library` · **Category:** volume · **XP bonus:** 100
**Blurb:** "Triple digits in the books column."
**Trigger:** `{ kind: "lessonsTotal", count: 100 }`

### `volume-500` — Marathon reader
**Tier:** gold · **Icon:** `Trophy` · **Category:** volume · **XP bonus:** 500
**Blurb:** "Five hundred lessons. The library's started to feel small."
**Trigger:** `{ kind: "lessonsTotal", count: 500 }`

### `volume-2000` — Possessed
**Tier:** platinum · **Icon:** `Crown` · **Category:** volume · **XP bonus:** 2000
**Blurb:** "Two thousand. Take a walk. Touch grass. Then keep going."
**Trigger:** `{ kind: "lessonsTotal", count: 2000 }`

---

## §Library (books finished)

Distinct from §volume — these care about *closing* whole books. A
chapter binge gets you volume; a finished book gets you library.

### `library-3` — Library card
**Tier:** silver · **Icon:** `BookA` · **Category:** progress · **XP bonus:** 75
**Blurb:** "Three books finished. You're a reader, officially."
**Trigger:** `{ kind: "booksDone", count: 3 }`

### `library-10` — Closing the stacks
**Tier:** gold · **Icon:** `Library` · **Category:** progress · **XP bonus:** 300
**Blurb:** "Ten finished books. A real curriculum's worth."
**Trigger:** `{ kind: "booksDone", count: 10 }`

### `library-25` — Master librarian
**Tier:** platinum · **Icon:** `LibraryBig` · **Category:** progress · **XP bonus:** 1500
**Blurb:** "Twenty-five books. The shelf is not large enough any more."
**Trigger:** `{ kind: "booksDone", count: 25 }`

---

## §Speed (one-day intensity)

How much can you do in one calendar day? These reset every midnight,
which is the point — they're for the kind of session where you get on
a roll.

### `speed-5` — Lightning round
**Tier:** bronze · **Icon:** `Zap` · **Category:** depth · **XP bonus:** 15
**Blurb:** "Five lessons today. You're on a roll."
**Trigger:** `{ kind: "lessonsInDay", count: 5 }`

### `speed-10` — Power day
**Tier:** silver · **Icon:** `Zap` · **Category:** depth · **XP bonus:** 50
**Blurb:** "Ten in one sitting. The chair owes you rent."
**Trigger:** `{ kind: "lessonsInDay", count: 10 }`

### `speed-25` — All-nighter
**Tier:** gold · **Icon:** `Sun` · **Category:** depth · **XP bonus:** 200
**Blurb:** "Twenty-five lessons in a single day. Your wrists are reporting you."
**Trigger:** `{ kind: "lessonsInDay", count: 25 }`

---

## §Breadth (variety)

Polyglot bait. Counts how many different *languages* and how many
different *books* you've at least tasted. Useful for discouraging
ruts.

### `breadth-3` — Polyglot starter
**Tier:** bronze · **Icon:** `Languages` · **Category:** breadth · **XP bonus:** 25
**Blurb:** "Three languages tried. The Tower of Babel called."
**Trigger:** `{ kind: "languagesTouched", count: 3 }`

### `breadth-7` — Polyglot
**Tier:** silver · **Icon:** `Languages` · **Category:** breadth · **XP bonus:** 100
**Blurb:** "Seven languages with at least one lesson under your belt."
**Trigger:** `{ kind: "languagesTouched", count: 7 }`

### `breadth-everything` — Curiosity
**Tier:** gold · **Icon:** `Compass` · **Category:** breadth · **XP bonus:** 250
**Blurb:** "At least one lesson in every language we ship. Browser tabs are crying."
**Trigger:** `{ kind: "languagesTouched", count: 16 }`

### `breadth-books-10` — Browsing the stacks
**Tier:** silver · **Icon:** `BookCopy` · **Category:** breadth · **XP bonus:** 75
**Blurb:** "Started ten different books. Reading widely."
**Trigger:** `{ kind: "booksTouched", count: 10 }`

---

## §Lesson kinds (depth across formats)

Each lesson kind earns different XP; these celebrate doing lots of
the same kind. Useful nudge for learners who avoid exercises.

### `quizzes-25` — Quizzed
**Tier:** silver · **Icon:** `BadgeCheck` · **Category:** depth · **XP bonus:** 75
**Blurb:** "Twenty-five quizzes passed. The questions don't scare you."
**Trigger:** `{ kind: "lessonsKind", lessonKind: "quiz", count: 25 }`

### `exercises-25` — Hands on
**Tier:** silver · **Icon:** `Hammer` · **Category:** depth · **XP bonus:** 150
**Blurb:** "Twenty-five exercises shipped. The tests bow to you."
**Trigger:** `{ kind: "lessonsKind", lessonKind: "exercise", count: 25 }`

### `exercises-100` — Compulsive coder
**Tier:** gold · **Icon:** `Wrench` · **Category:** depth · **XP bonus:** 500
**Blurb:** "One hundred exercises. The compiler is your friend now."
**Trigger:** `{ kind: "lessonsKind", lessonKind: "exercise", count: 100 }`

### `mixed-50` — Project person
**Tier:** silver · **Icon:** `Layers` · **Category:** depth · **XP bonus:** 200
**Blurb:** "Fifty mixed-format lessons. You like the bigger pieces."
**Trigger:** `{ kind: "lessonsKind", lessonKind: "mixed", count: 50 }`

---

## §Levels (XP curve)

Keyed off `useStreakAndXp`'s computed level (level N requires
N(N+1)/2 × 10 total XP). Catches grinders who don't fit neatly into
the volume buckets.

### `level-5` — Apprentice
**Tier:** bronze · **Icon:** `Award` · **Category:** progress · **XP bonus:** 0
**Blurb:** "Level five. The badge fits."
**Trigger:** `{ kind: "level", count: 5 }`

### `level-10` — Journeyman
**Tier:** silver · **Icon:** `Medal` · **Category:** progress · **XP bonus:** 0
**Blurb:** "Level ten. The shelf-ish levels are behind you."
**Trigger:** `{ kind: "level", count: 10 }`

### `level-25` — Adept
**Tier:** gold · **Icon:** `Crown` · **Category:** progress · **XP bonus:** 0
**Blurb:** "Level twenty-five. Most of what we have to teach, you've seen."
**Trigger:** `{ kind: "level", count: 25 }`

### `level-50` — Master
**Tier:** platinum · **Icon:** `Crown` · **Category:** progress · **XP bonus:** 0
**Blurb:** "Level fifty. We're running out of curve to climb."
**Trigger:** `{ kind: "level", count: 50 }`

### `xp-10000` — Five figures
**Tier:** gold · **Icon:** `Coins` · **Category:** progress · **XP bonus:** 0
**Blurb:** "Ten thousand XP. The grind has paid out."
**Trigger:** `{ kind: "xpTotal", count: 10000 }`

### `xp-100000` — Six figures
**Tier:** platinum · **Icon:** `Diamond` · **Category:** progress · **XP bonus:** 0
**Blurb:** "One hundred thousand XP. We genuinely don't know what to say."
**Trigger:** `{ kind: "xpTotal", count: 100000 }`

---

## §Esoteric (hidden flavour drops)

These are the dumb ones. They exist for the screenshot moment when a
learner sees a notification at 2 AM that says "Night Owl" and laughs.
All hidden until unlocked.

### `night-owl` — Night owl
**Tier:** bronze · **Icon:** `Moon` · **Category:** esoteric · **XP bonus:** 10 · **Hidden**
**Blurb:** "Lesson finished after midnight. We see you."
**Trigger:** `{ kind: "completionTime", after: "00:00" }` (and before 04:00 — see TS impl)

### `early-bird` — Early bird
**Tier:** bronze · **Icon:** `Sunrise` · **Category:** esoteric · **XP bonus:** 10 · **Hidden**
**Blurb:** "Lesson before sunrise. The worm is yours."
**Trigger:** `{ kind: "completionTime", before: "06:00" }`

### `weekender` — Weekender
**Tier:** bronze · **Icon:** `CalendarDays` · **Category:** esoteric · **XP bonus:** 15 · **Hidden**
**Blurb:** "Lessons on both Saturday AND Sunday. Most people don't."
**Trigger:** `{ kind: "weekendDouble" }`

### `vampire` — Vampire hours
**Tier:** silver · **Icon:** `Moon` · **Category:** esoteric · **XP bonus:** 50 · **Hidden**
**Blurb:** "Seven different days where you finished a lesson between 2 AM and 5 AM. We're concerned."
**Trigger:** `{ kind: "lessonsAfterHourCount", hour: 2, beforeHour: 5, count: 7 }`
*(Requires the `lessonsAfterHourCount` rule kind — implement alongside.)*

---

## Sound design

The sound system is **synthesized at runtime via the Web Audio API** —
no MP3s shipped, no asset bytes. `src/lib/sfx.ts` exports
`playSound(name, volume?)` and the generator builds the waveform from
oscillators + ADSR envelopes the moment it's called. This means:

- Every effect is ~0 KB on the wire.
- Volumes / pitches / accents are tweakable without re-encoding audio.
- Latency is single-frame (no decode pause).

Sound list, with the notes/timing each generator produces:

| name | structure | notes (Hz approx) | duration | use |
| --- | --- | --- | --- | --- |
| `ping` | sine + soft attack | 880 → 1320 | 220 ms | small wins, generic UI accent |
| `chime` | two-note sine, perfect-fourth interval | 660 → 880 | 480 ms | bronze tier unlocks |
| `success` | three-note major triad, ascending | 523 → 659 → 784 | 700 ms | silver tier unlocks, lesson pass |
| `fanfare` | five-note major triad arpeggio + sustained drone | 523 → 659 → 784 → 1047 → 784 | 1300 ms | gold tier unlocks |
| `arpeggio` | seven-note rising major scale + reverb tail | 523 → 587 → 659 → 698 → 784 → 880 → 1047 | 1800 ms | platinum unlocks, level milestones |
| `streak-tick` | crisp tap, square wave | 1100 (one shot) | 90 ms | streak day flip |
| `streak-flame` | filtered noise burst + low pulse | crackle 200–800 + pulse 110 | 600 ms | streak milestone unlocks |
| `xp-pop` | rising sine glissando | 660 → 990 | 180 ms | XP gain on lesson complete |
| `level-up` | five-note rising arpeggio + glide | 392 → 523 → 659 → 784 → 1047 | 1100 ms | level-up modal |
| `complete-section` | three-note descending chime, gentle | 988 → 784 → 659 | 950 ms | chapter end summary |
| `complete-book` | extended fanfare, tonic+fifth+octave layered | full chord progression | 2400 ms | book end summary |
| `freeze` | sine sweep + crystalline shimmer | 440 → 1760 sweep | 800 ms | streak freeze used |

All sounds peak at -12 dBFS (Web Audio gain ≤ 0.25) so layering an
unlock chime over speech / lesson audio doesn't clip.

The user-controlled "Sound effects" volume slider in Settings (added
in `SoundPane.tsx`) multiplies into the master output. A mute toggle
short-circuits `playSound` entirely — no AudioContext is even
instantiated when sounds are off, which avoids the (small but
documented) iOS Safari battery-drain side effect of an unused
AudioContext.

## Animation grammar

| event | element | animation |
| --- | --- | --- |
| Bronze toast | top-right slide-in card | `translateY(-12px → 0)` + opacity, 240 ms ease-out, 4 s hold, fade |
| Silver toast | same as bronze | + small confetti burst (6 particles) emitted from the toast |
| Gold modal | full-screen modal | scale 0.9 → 1.0, opacity 0 → 1, 320 ms cubic-bezier(0.2, 0.8, 0.4, 1.4) (light overshoot), confetti shower |
| Platinum modal | full-screen modal | gold modal motion + sustained confetti loop (3 s) + ambient gradient pulse on the badge |
| Level up | full-screen modal | upward "rise" — translateY(40px → 0) + scale 0.95 → 1.0, 420 ms; particle ring expands from badge |
| Streak day flip | streak chip in the topbar | flame icon does a 200 ms wiggle + a number flip (digit roll-up) |
| Chapter complete | inline summary card slides up over lesson view | translateY(20px → 0) + opacity, sound: `complete-section` |
| Book complete | full-screen takeover, dismissable | `complete-book` sound; book cover floats up + tilts; final "Read another?" CTA |

Confetti is a tiny home-brew canvas particle system in
`src/lib/confetti.ts` — no `canvas-confetti` dependency. Particles use
the same colour palette as the unlock tier.

## Implementation notes

- **Single hookpoint:** `markCompletedAndCelebrate()` in `App.tsx`
  fires `useAchievements().checkAfterCompletion(...)` after the
  storage write resolves. The hook returns the freshly-unlocked ids
  (already de-duped against past unlocks) and the UI consumer
  enqueues them on the toast/modal layer.
- **Replay safety:** completing a lesson that's already in `history`
  is a no-op — the existing idempotency on `markCompleted` keeps the
  achievement engine from double-firing.
- **Tier escalation:** if a single completion crosses two unlock
  thresholds (e.g. Volume 100 *and* Level 10 in the same beat), the
  UI queues toasts/modals in tier order — bronze toasts batch into a
  single combined toast if more than 2 fire at once, silver+ each
  get their own.
- **Settings discoverability:** the Sound pane adds a "Test sounds"
  row that previews each effect — useful for the user, useful for
  QA, useful for the screenshot for the marketing page.
- **Accessibility:** every animation respects
  `prefers-reduced-motion` (the modals collapse to a 60 ms fade,
  confetti turns into a single static glyph, the streak number flip
  becomes an instant swap). The sound system has its own mute
  separate from `prefers-reduced-motion` because the two are
  conceptually different.

## When to add a new achievement

1. Append the entry to this file in the right section.
2. Mirror it into `src/data/achievements.ts` (matching id, blurb,
   trigger).
3. If the trigger needs a new `kind` not in §Trigger shape above,
   first extend the type union in `src/lib/achievements.ts`'s
   evaluator + run the existing tests.
4. Don't trigger-spam: prefer one well-placed achievement with a
   higher count over five small ones with overlapping conditions.
5. Tier conservatively. Most users will never see your platinum-tier
   doc-clinker; that's fine, it's the long-tail prestige stuff.

## Retired

Once an achievement ships and a learner unlocks it, never delete the
row. If we want to discontinue: move it down here, mark `retired:
true` in the TS registry, and the engine will skip evaluating its
trigger but still surface old unlocks in the achievements list (with
a "retired" pill). Old unlocks belong to the user.

(none yet — keep this section honest.)
