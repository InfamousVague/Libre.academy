# Fishbones ingest pipeline — design

How Fishbones turns a book PDF into a Codecademy-style interactive course. This doc
captures the decisions locked in for the pipeline; `PLAN.md` remains the
product-level roadmap.

---

## Pipeline overview

Specialist chain. Each stage is small, cacheable, and easy to iterate on
independently. Stage outputs write to `<app_data_dir>/ingest-cache/<book-id>/`
so an interrupted ingest resumes from the last completed stage — no wasted
API calls.

```
PDF
 │
 ▼ ── Stage 0: Extract
 │   pdftotext -layout  +  pdfimages (dump figures)
 │   → raw.txt + images/*.png
 │
 ▼ ── Stage 1: Find + clean + fence code
 │   LLM multi-pass: detect code regions, repair PDF wrap artifacts,
 │   emit markdown with ```lang fences.
 │   → chapter-N-clean.md (one per chapter)
 │
 ▼ ── Stage 2: Outline
 │   LLM: produce ordered list of lesson stubs
 │   { id, kind, title, intent } for each section.
 │   Lessons alternate reading + exercise with occasional review quizzes.
 │   → chapter-N-outline.json
 │
 ▼ ── Stage 3: Generate
 │   LLM: one call per stub → full lesson body (+ starter/solution/tests
 │   for exercises, questions for quizzes).
 │   → chapter-N-lessons/<id>.json
 │
 ▼ ── Stage 4: Validate + retry
 │   For each exercise lesson:
 │     - run `solution` against `tests`       → must pass all
 │     - run `starter`  against `tests`       → must fail at least one
 │   Fail → feed diagnostic back to Claude with "fix", retry up to 3x.
 │   After 3 strikes, convert the exercise to a reading lesson with the
 │   code sample inline (never ship broken exercises).
 │
 ▼ ── Stage 5: Preview + save
     Render the whole course in a read-only preview pane with
     per-lesson "regenerate" and a global "save" button. User approves
     → write via save_course command; rejects → cache persists so
     regenerate doesn't re-extract/re-outline.
```

Each stage writes its result into the cache dir with a stable filename so
resuming is `read if exists, else compute`.

---

## Lesson types

### reading
Rewritten-in-Fishbones-voice prose with fenced code blocks. Tight — doesn't quote
the book verbatim. Figures referenced by their extracted filename.

### exercise
Runnable code challenge with:
- `body` — prompt in Markdown
- `language`
- `starter` — partial file ending in `module.exports = { ... }`
- `solution` — hidden reference
- `tests` — hidden file using the jest-compatible harness (`test`, `expect`,
  `require('./user')`)

**Progression:** section-scoped. Exercises within a section can build on
each other (exercise 2's starter = exercise 1's solution); new section =
fresh scaffold.

### review quiz
Mixed-format checkpoint at the end of a reading-heavy section. 3–5 questions
per quiz, a mix of:
- **MCQ** — 4 options, 1 correct
- **Short answer** — user types, fuzzy match (case-insensitive,
  punctuation-stripped)

Lesson schema extension:

```ts
interface QuizLesson {
  id: string;
  kind: "quiz";
  title: string;
  body: string;           // prose intro
  questions: Question[];
}

type Question =
  | { kind: "mcq"; prompt: string; options: string[]; correctIndex: number; explanation?: string }
  | { kind: "short"; prompt: string; accept: string[]; explanation?: string };
```

### project *(V2, not V1)*
Skipped for now. Multi-step projects land after the basics are polished.

---

## Prose handling

Rewrite tight in Fishbones voice. The AI reads the book for ideas and code
examples, then authors lessons in a consistent, terse tone. Don't reproduce
long passages verbatim — avoids copyright-ish smell and keeps voice
consistent across books.

---

## Media handling

Stage 0 extracts images via `pdfimages` into the cache dir. The LLM sees a
manifest of available images (filename, page number, surrounding text) and
can reference them in lesson bodies with standard Markdown (`![alt](path)`).
The reader resolves those paths against the course folder.

Math and complex diagrams that aren't page images get dropped for V1 —
we'll layer in Mermaid / KaTeX support later.

---

## Validation

**Exercises (mandatory both-sided check):**
1. Reference `solution` must pass **every** test (catches broken tests).
2. `starter` must fail **at least one** test (catches starter that already
   solves it or tests that accept anything).

If either gate fails, retry up to **3 times** with diagnostic context in
the prompt. After the third failure, demote the exercise to a reading
lesson with the code example inline + a note in the body.

**Review quizzes:** run the correct-answer key through the same rendering
path at generation time to catch malformed questions, then spot-check the
options for obvious duplicates.

---

## Review UX

After the pipeline finishes, the user sees a **preview pane** for the
generated course before any on-disk save:

- Left: chapter/lesson tree (same shape as Sidebar)
- Right: lesson preview (same shape as the main reader)
- Per-lesson button: **Regenerate** (re-runs Stage 3 for that lesson)
- Per-chapter button: **Regenerate chapter**
- Global: **Save course** / **Discard**

Rejecting at preview doesn't nuke the cache — the user can tweak settings
and re-run without paying for re-extraction.

---

## Cache layout

```
<app_data_dir>/ingest-cache/<book-id>/
├── raw.txt                              # stage 0
├── images/
│   ├── fig-01-02.png
│   └── ...
├── clean/
│   ├── chapter-01.md                    # stage 1
│   └── ...
├── outlines/
│   ├── chapter-01.json                  # stage 2
│   └── ...
├── lessons/
│   ├── chapter-01/
│   │   ├── what-is-a-class.json         # stage 3
│   │   └── ...
│   └── ...
└── validated.json                        # which exercises passed; which retries remain
```

Cache survives across runs. Blowing it away forces a full re-ingest.
A "Clear ingest cache" action lives in Settings.

---

## Build order (from what's already there)

- [x] Stage 0 extract — `extract_pdf_text` Tauri command + deterministic
      chapter/section splitter. *(shipped)*
- [x] Naive single-pass LLM structuring (`structure_with_llm` command).
      *(shipped — placeholder for stages 1–3)*
- [ ] Split `structure_with_llm` into three commands:
      `clean_code`, `outline_chapter`, `generate_lesson`.
- [ ] Add the quiz lesson schema to `data/types.ts` + runtime.
- [ ] Cache layer: read/write intermediate JSON/MD under
      `app_data_dir/ingest-cache/<book-id>/`.
- [ ] Validate exercises: solution-passes + starter-fails via the existing
      `runCode` path. Retry-with-diagnostic loop.
- [ ] Image extraction: `pdfimages` Tauri command + assets moved into the
      course folder at save time.
- [ ] Preview pane component. Triggered after ingest finishes instead of
      saving straight to disk.
- [ ] "Regenerate lesson" button on any lesson in the main reader, re-using
      Stage 3 + validation.
- [ ] Settings: "Clear ingest cache" button; per-book cache size display.
