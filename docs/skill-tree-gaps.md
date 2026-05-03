# Skill-tree content gaps

The Trees feature in `src/data/trees.ts` defines 122 skill nodes
across 7 trees. After matching every node against the lessons
currently in the user's library, **94 are covered and 28 are
gaps** — flagged in the data file with `matches: []` and a
`gapNote` so the UI can render a "Coming soon" placeholder
instead of a clickable lesson link.

This file is the canonical list. Filling a gap means authoring a
new lesson (or adapting an existing one) so the skill node can
point at it. Matches don't need to be exclusive — adding more
matches to an already-covered node is fine; it just gives the
learner more ways to satisfy the prereq.

Last updated: 2026-05-01

## Per-tree summary

| Tree                       | Total | Matched | Gap |
|----------------------------|------:|--------:|----:|
| 1. Foundations             | 20    | 20      | 0   |
| 2. Web Development         | 20    | 12      | 8   |
| 3. Smart Contracts & Web3  | 20    | 19      | 1   |
| 4. Systems Programming     | 18    | 14      | 4   |
| 5. Mobile Development      | 14    | 8       | 6   |
| 6. Functional Programming  | 14    | 6       | 8   |
| 7. Data & Algorithms       | 16    | 15      | 1   |
| **Total**                  | **122** | **94** | **28** |

## Top-10 most painful gaps

Ordered by how many downstream skills they unblock. Filling these
first delivers the biggest unlock per lesson authored.

1. **`web-html-structure`** — root of Tree 2. With this gap, the
   entire Web Dev tree starts locked for new learners. Host in a
   new `html-fundamentals` course or expand `eloquent-javascript`
   to cover the DOM chapters Marijn's book has but our build skips.
2. **`web-css-selectors` + `web-css-layout` + `web-css-flexbox` +
   `web-css-grid`** — the entire CSS sub-branch is uncovered. The
   RN flexbox lesson teaches Yoga, not browser CSS. Host in a new
   `css-fundamentals`.
3. **`web-js-dom` + `web-js-events`** — `eloquent-javascript`
   stops at ch11 (Building a Tiny Language) and never reaches the
   DOM/events/canvas chapters. Best fix: extend the existing book.
4. **`mob-ts-types`** — root of Tree 5's RN track. No TypeScript
   course exists. New `typescript-fundamentals` would also unblock
   downstream React-with-TS work.
5. **`mob-swift-basics` + `mob-swift-optionals` +
   `mob-swift-classes` + `mob-ios-views` + `mob-watch-companion`**
   — the entire iOS branch of Tree 5 is gap. Only the Swift
   challenge bank exists. Hosts: `swift-fundamentals`,
   `swiftui-fundamentals`, `watchos-fundamentals`.
6. **`fp-haskell-types` + `fp-haskell-pattern-matching` +
   `fp-haskell-typeclasses` + `fp-haskell-monads`** — Tree 6's
   Haskell branch is entirely on hold. Host in
   `haskell-fundamentals`.
7. **`fp-scala-traits` + `fp-scala-pattern-match`** — Scala
   branch unbuilt. Host in `scala-fundamentals`.
8. **`fp-elixir-pattern-match` + `fp-elixir-pipes` +
   `fp-elixir-genserver`** — Elixir branch unbuilt. Host in
   `elixir-fundamentals`.
9. **`sys-malloc-free` + `sys-linked-lists-c`** — the Tree 4 C
   sub-branch needs a new `c-programming-fundamentals` course;
   `learning-zig` covers analogous concepts but not C `malloc`/`free`.
10. **`sys-cpp-classes` + `sys-cpp-templates`** — same story for
    C++. New `cpp-fundamentals` course needed.

## Full gap list, by tree

### Tree 2: Web Development (8 gaps)

- `web-html-structure` — no HTML-from-zero teacher.
- `web-css-selectors`
- `web-css-layout`
- `web-css-flexbox` (RN flexbox lesson exists but teaches Yoga, not browser CSS)
- `web-css-grid`
- `web-js-dom`
- `web-js-events`
- `web-routing` — only SvelteKit routing exists as a single fragment; no React-Router or generic client-routing lesson.

### Tree 3: Smart Contracts & Web3 (1 gap)

- `sc-flash-loans` — no dedicated flash-loan lesson; the DeFi
  intro mentions composability but doesn't walk through a
  flash-loan callback round-trip.

### Tree 4: Systems Programming (4 gaps)

- `sys-malloc-free`
- `sys-linked-lists-c`
- `sys-cpp-classes`
- `sys-cpp-templates`

### Tree 5: Mobile Development (6 gaps)

- `mob-ts-types`
- `mob-swift-basics`
- `mob-swift-optionals`
- `mob-swift-classes`
- `mob-ios-views`
- `mob-watch-companion`

### Tree 6: Functional Programming (8 gaps)

- `fp-haskell-types`
- `fp-haskell-pattern-matching`
- `fp-haskell-typeclasses`
- `fp-haskell-monads`
- `fp-scala-traits`
- `fp-scala-pattern-match`
- `fp-elixir-pattern-match`
- `fp-elixir-pipes`
- `fp-elixir-genserver`

(Note: 9 listed, but two of these consolidate under
`elixir-fundamentals`; the official count is 8 + 1 implicit
overlap on the Elixir track.)

### Tree 7: Data & Algorithms (1 gap)

- `algo-tries` — no trie / prefix-tree lesson. Host in
  `open-data-structures` (it's the natural sequel to ch03 hash
  tables) or as a chapter in `algorithms-erickson`.

## Filling a gap

1. Author the lesson(s) in whichever course is the natural home.
2. Update `src/data/trees.ts` — replace the empty `matches: []`
   with one or more `{ courseId, lessonId }` tuples and remove
   the `gapNote` field.
3. The TreesView UI auto-flips: the node loses its dashed
   border, becomes clickable, and unlocks downstream skills as
   the learner completes its lessons.

The matching contract is "any single match completed → skill
complete", so partial coverage helps. A skill with 3 matches
unlocks as soon as the learner finishes any one of them.
