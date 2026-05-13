# Challenges translation checklist

> **Source of truth.** Work through this file top-to-bottom. After
> finishing a (lesson × locale) unit, tick its checkbox and move on.
> Do NOT paste translated text into the conversation — it just
> bloats context. The checklist is the only state we need across
> sessions; the actual translations live in each pack's
> `course.json`.

## How to use

1. Open this file. Find the next unticked locale row inside the next
   pack section that still has work.
2. Open the matching course.json:
   `~/Library/Application Support/com.mattssoftware.kata/courses/<pack-id>/course.json`
3. Find the lesson by its `id`. Translate every part listed on the
   lesson's "parts:" line into the target locale.
4. Write the result into the lesson's `translations[<locale>]`
   overlay. See `src/data/locales.ts` for the overlay shape —
   `LessonTranslation` carries `title`, `body`, `objectives[]`,
   `hints[]`, `questions[]`. Omit keys that don't apply.
5. Tick the locale checkbox in this file.
6. Continue with the next row.

When the pack's course.json is finished, run
`scripts/promote-library-to-bundle.mjs` (or wait for the next seed
cycle) to roll the translations back into the bundled `.academy`
archive.

## Translatable fields per lesson

The translator writes a `LessonTranslation` object containing the
fields below. Code, identifiers, starter/test bodies, and accepted-
answer strings are NEVER translated.

| Field | Type | When present | Notes |
|---|---|---|---|
| `title` | string | always | Short — usually 3-7 words. |
| `body` | markdown | always | Preserve every code fence VERBATIM. |
| `objectives` | string[] | when source has it | 3-5 short bullets. |
| `hints` | string[] | exercise / mixed kinds | Progressive hints, length must match source. |
| `questions` | object[] | quiz kind | Per-question: `prompt`, `options[]`, `explanation`. |

## Target locales

| Locale | Endonym | English name | Flag |
|---|---|---|---|
| `ru` | Русский | Russian | 🇷🇺 |
| `es` | Español | Spanish | 🇪🇸 |
| `fr` | Français | French | 🇫🇷 |
| `kr` | 한국어 | Korean | 🇰🇷 |
| `jp` | 日本語 | Japanese | 🇯🇵 |

## Per-pack progress


---

### challenges-assembly-handwritten

- **Course title:** Assembly Challenges (arm64 macOS)
- **Language:** assembly
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-assembly-handwritten fully translated to `ru`
- [ ] challenges-assembly-handwritten fully translated to `es`
- [ ] challenges-assembly-handwritten fully translated to `fr`
- [ ] challenges-assembly-handwritten fully translated to `kr`
- [ ] challenges-assembly-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-add-two-constants` — Add Two Constants
_exercise · easy · arithmetic exit codes · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bitwise-and` — Bitwise AND
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-shift-left` — Shift Left by 3
_exercise · easy · shifts · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-subtract-1` — Subtract Two Constants
_exercise · easy · arithmetic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-multiply-by-2` — Multiply by 2 with LSL
_exercise · easy · shifts · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-divide-by-2` — Divide by 2 with LSR
_exercise · easy · shifts · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-negate` — Negate a Value
_exercise · easy · arithmetic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bitwise-or-5` — Bitwise OR
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bitwise-xor-6` — Bitwise XOR
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bitwise-not-7` — Bitwise NOT (MVN)
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bit-clear-bic` — Bit Clear with BIC
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-greater-than` — Is Greater (Signed)
_exercise · easy · comparison · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-less-than` — Is Less (Signed)
_exercise · easy · comparison · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-equal-branch` — Is Equal
_exercise · easy · comparison · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-not-equal-branch` — Is Not Equal
_exercise · easy · comparison · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-unconditional-branch` — Unconditional Branch
_exercise · easy · control flow · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-counted-loop-cbnz` — Counted Loop with CBNZ
_exercise · easy · loops · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-cbz-zero` — CBZ Branch on Zero
_exercise · easy · control flow · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-movz-movk` — Build Constant with MOVZ/MOVK
_exercise · easy · registers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-copy-register` — Copy a Register
_exercise · easy · registers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-load-byte` — Load a Byte from .data
_exercise · easy · memory · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-store-load-word` — Store and Load a Word
_exercise · easy · memory · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-array-index` — Index a Word Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-max-of-two` — Max of Two (Signed)
_exercise · easy · math · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-min-of-two` — Min of Two (Signed)
_exercise · easy · math · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-absolute-value` — Absolute Value
_exercise · easy · math · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-extract-lsb` — Extract LSB
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-set-bit` — Set Bit 3
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-clear-bit` — Clear Bit 3
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-flip-bit` — Flip Bit 3
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-computed-exit-code` — Compute a Code
_exercise · easy · syscalls · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-write-constant-byte` — Write and Read a Byte
_exercise · easy · syscalls · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-multiply-mul` — Multiply with MUL
_exercise · easy · arithmetic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-arith-shift-right` — Arithmetic Shift Right
_exercise · easy · shifts · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-test-bit` — Test a Bit
_exercise · easy · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-load-quad` — Load a 64-bit Quad
_exercise · easy · memory · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-counted-loop-cmp` — Counted Loop with CMP
_exercise · easy · loops · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-chained-arithmetic` — Chained ADD and SUB
_exercise · easy · arithmetic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-two-way-branch` — Two-Way Conditional
_exercise · easy · control flow · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-rotate-right` — Rotate Right
_exercise · easy · shifts · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-conditional-max` — Max of Three (Signed)
_exercise · medium · conditional logic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-loop-sum-1-to-10` — Sum 1..n with a Loop
_exercise · medium · loops with counters · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-count-set-bits` — Count Set Bits
_exercise · medium · bit manipulation · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-loop-sum-1-to-100` — Sum 1..100 via Loop
_exercise · medium · loops with counters · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-count-odd-numbers` — Count Odds in 1..n
_exercise · medium · loops with counters · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-find-max-array` — Max of an Array
_exercise · medium · arrays in memory · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-classify-sign` — Classify Sign
_exercise · medium · conditional logic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-abs-signed` — Absolute Value (Branch-Free)
_exercise · medium · conditional logic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-popcount-kernighan` — Popcount via Kernighan's Trick
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-reverse-nibble` — Reverse a Nibble's Bits
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-swap-nibbles` — Swap the Nibbles of a Byte
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-extract-bit-field` — Extract Bit Field 4..7
_exercise · medium · bit fields · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-sum-array` — Sum a Word Array
_exercise · medium · arrays in memory · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-find-element` — Find Element Index
_exercise · medium · arrays in memory · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-bl-subroutine` — Call a Doubler Subroutine
_exercise · medium · subroutines · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-factorial-recursive` — Recursive Factorial
_exercise · medium · subroutines · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-stp-ldp-save` — Save/Restore Regs via Stack
_exercise · medium · stack frames · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-strlen` — String Length
_exercise · medium · byte strings · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-palindrome-check` — Check Palindrome
_exercise · medium · byte strings · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-bit-set-check` — Is Bit N Set?
_exercise · medium · bit fields · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-csel-max` — Max via CSEL
_exercise · medium · conditional select · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mul-by-5` — Multiply by 5 (Shift + Add)
_exercise · medium · shift tricks · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mul-by-7` — Multiply by 7 (Shift + Sub)
_exercise · medium · shift tricks · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mod-power-of-two` — Mod by a Power of Two
_exercise · medium · modular arithmetic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-clz` — Count Leading Zeros
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-csel-min` — Min via CSEL
_exercise · medium · conditional select · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-average-two` — Average of Two Unsigned
_exercise · medium · shift tricks · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-nested-loop` — Nested-Loop Count
_exercise · medium · loops with counters · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-swap-bytes-halfword` — Swap Bytes in a Halfword
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-find-min-array` — Min of an Array
_exercise · medium · arrays in memory · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-subroutine-add` — Add Two Args Subroutine
_exercise · medium · subroutines · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-fib-iter` — Iterative Fibonacci
_exercise · medium · loops with counters · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-sum-evens` — Sum the Even Numbers
_exercise · medium · loops with counters · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-min-of-three` — Min of Three (Signed)
_exercise · medium · conditional logic · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-count-zero-bytes` — Count Zero Bytes
_exercise · medium · arrays in memory · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-rotate-word-right` — Rotate Word Right
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-power-of-two-loop` — Compute 2^n with a Shift Loop
_exercise · medium · loops with counters · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-parity-odd` — Detect Odd
_exercise · medium · bit manipulation · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-clamp-value` — Clamp to a Range
_exercise · medium · conditional select · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-fill-memory` — Fill Memory Then Sum
_exercise · medium · arrays in memory · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-fibonacci-iterative` — Iterative Fibonacci(10)
_exercise · hard · iteration, two-register state · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-multiply-by-add` — Multiply via Repeated Addition
_exercise · hard · loops, accumulation · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-reverse-bits-byte` — Reverse the Low 8 Bits
_exercise · hard · bit-by-bit reversal · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-recursion-factorial-6` — Recursive factorial 6! = 720
_exercise · hard · recursion, AAPCS64 frames · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-recursion-fib-8` — Recursive fib(8) = 21
_exercise · hard · recursion · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-recursion-gcd` — Recursive gcd(48, 36) = 12
_exercise · hard · recursion, modulus · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-recursion-power-2-8` — Recursive pow(2, 8) = 256
_exercise · hard · recursion · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-string-reverse` — Reverse a 6-char string in place
_exercise · hard · two-pointer in-place reversal · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-string-palindrome` — Check 'racecar' is a palindrome
_exercise · hard · two-pointer comparison · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-string-count-char` — Count 'l' in 'hello world' = 3
_exercise · hard · byte scanning · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-sort-bubble` — Bubble sort [4,2,3,1]
_exercise · hard · nested loops, in-place sort · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-sort-insertion` — Insertion sort [3,1,4,2]
_exercise · hard · nested loop, shift-and-insert · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-search-linear` — Linear search for 7 returns index 2
_exercise · hard · linear scan · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-search-binary` — Binary search for 9 returns index 4
_exercise · hard · bisection · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bits-popcount` — Popcount 0xF0F0F0F0 = 16
_exercise · hard · bitwise, Kernighan's trick · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bits-parity` — Parity of 0xB = 1 (odd)
_exercise · hard · xor folding · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bits-reverse-word` — Reverse bits of 0x00000001
_exercise · hard · bit reversal · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bits-swap-odd-even` — Swap odd/even bits of 0xAA -> 0x55
_exercise · hard · bitmask tricks · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-mem-sum-array` — Sum [1,2,3,4,5] = 15
_exercise · hard · array walking, accumulation · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-mem-find-max` — Find max of [3,7,2,9,5] = 9
_exercise · hard · array walking · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-mem-count-zeros` — Count zeros in [0,1,0,2,0,3] = 3
_exercise · hard · array walking · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-mem-copy-array` — Copy 4-word array and verify
_exercise · hard · array walking, store/load · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-subs-helper-main` — Main calls helper double; 2*3+2*4 = 14
_exercise · hard · multi-subroutine composition · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-subs-two-level` — Two-level call chain f->g returns 42
_exercise · hard · nested call chain · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-subs-recursive-sum` — Recursive sum 1..5 = 15
_exercise · hard · recursion · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-float-avg` — Float avg (3.0 + 4.0) / 2.0 = 3.5
_exercise · hard · floating-point arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-float-compare` — Compare floats 2.5 < 3.5
_exercise · hard · floating-point compare · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-float-abs` — Absolute value of -4.25 equals 4.25
_exercise · hard · floating-point · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-fsm-rle-decode` — Decode 'a3b2' to 'aaabb'
_exercise · hard · state machine, output buffer · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-fsm-rle-encode` — Encode 'aaabb' to 'a3b2'
_exercise · hard · state machine · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-fsm-run-sum` — Running-sum of [1,2,3,4] ends at 10
_exercise · hard · state, writes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-mod` — Modulus 123456 mod 1000 = 456
_exercise · hard · integer divmod · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-isqrt-newton` — Integer sqrt of 144 via Newton = 12
_exercise · hard · Newton iteration · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-isqrt-binsearch` — isqrt(100) via binary search = 10
_exercise · hard · binary search on answer · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-grid-count-ones` — Count 1s in 4x4 checker grid = 8
_exercise · hard · row-major traversal · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-grid-count-runs` — Count horizontal runs of 1s in grid = 3
_exercise · hard · row-major state machine · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-stack-parens` — Balanced parens '(())' check
_exercise · hard · stack-simulated counter · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-stack-parens-unbalanced` — Detect unbalanced '(()'
_exercise · hard · stack-simulated counter · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-isqrt-10000` — isqrt(10000) via Newton = 100
_exercise · hard · Newton iteration · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-mem-find-min` — Find min of [7,2,5,3,9] = 2
_exercise · hard · array walking · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-c-handwritten

- **Course title:** C Challenges
- **Language:** c
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-c-handwritten fully translated to `ru`
- [ ] challenges-c-handwritten fully translated to `es`
- [ ] challenges-c-handwritten fully translated to `fr`
- [ ] challenges-c-handwritten fully translated to `kr`
- [ ] challenges-c-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-arrays-1` — Sum an Int Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-arrays-2` — Find Maximum in an Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-arrays-3` — Count Matching Elements
_exercise · easy · arrays · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-arrays-4` — Reverse an Array In Place
_exercise · easy · arrays · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-strings-1` — Compute String Length
_exercise · easy · strings · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-strings-2` — Copy a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-strings-3` — Compare Two Strings
_exercise · easy · strings · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-strings-4` — Count a Character in a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-pointers-1` — Swap Two Ints via Pointers
_exercise · easy · pointers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-pointers-2` — Increment Through a Pointer
_exercise · easy · pointers · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-pointers-3` — Fill a Range with a Value
_exercise · easy · pointers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-pointers-4` — Return Min and Max via Out Pointers
_exercise · easy · pointers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bits-1` — Set the Nth Bit
_exercise · easy · bits · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bits-2` — Clear the Nth Bit
_exercise · easy · bits · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bits-3` — Toggle the Nth Bit
_exercise · easy · bits · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-bits-4` — Test if Nth Bit Is Set
_exercise · easy · bits · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-1` — Make a Point
_exercise · easy · structs · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-2` — Squared Distance Between Points
_exercise · easy · structs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-3` — Counter Increment
_exercise · easy · structs · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-4` — Translate a Point
_exercise · easy · structs · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-math-1` — Factorial of a Small N
_exercise · easy · math · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-math-2` — Absolute Value
_exercise · easy · math · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-math-3` — Greatest Common Divisor
_exercise · easy · math · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-math-4` — Integer Power
_exercise · easy · math · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-1` — Sign of an Integer
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-2` — Classify FizzBuzz Number
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-3` — Letter Grade
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-4` — Is Leap Year
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-loops-1` — Count Odd Numbers
_exercise · easy · loops · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-loops-2` — Accumulate Product
_exercise · easy · loops · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-loops-3` — Double Each Element
_exercise · easy · loops · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-loops-4` — Sum 1 to N
_exercise · easy · loops · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-stdio-1` — Format an Integer to Buffer
_exercise · easy · stdio · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-stdio-2` — Greeting Into a Buffer
_exercise · easy · stdio · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-stdio-3` — Format a Point
_exercise · easy · stdio · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-stdio-4` — Format a Hex Byte
_exercise · easy · stdio · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-convert-1` — Parse a Non-Negative Integer
_exercise · easy · convert · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-convert-2` — Parse a Signed Integer
_exercise · easy · convert · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-convert-3` — Hex Digit to Value
_exercise · easy · convert · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-convert-4` — Char to Lowercase
_exercise · easy · convert · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-dynmem-1` — Deep Copy a String
_exercise · medium · dynmem · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-dynmem-2` — Build an Int Array From a Source
_exercise · medium · dynmem · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-dynmem-3` — Grow a Buffer to Fit
_exercise · medium · dynmem · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-dynmem-4` — Concatenate Two Strings
_exercise · medium · dynmem · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-structs-1` — Linked List Push Front
_exercise · medium · structs · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-structs-2` — Linked List Length
_exercise · medium · structs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-structs-3` — Linked List Sum
_exercise · medium · structs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-structs-4` — Stack Push and Pop
_exercise · medium · structs · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-fnptr-1` — Apply a Callback to Each Int
_exercise · medium · fnptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-fnptr-2` — Reduce With a Callback
_exercise · medium · fnptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-fnptr-3` — Operation Dispatcher
_exercise · medium · fnptr · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-fnptr-4` — Count Matches With a Predicate
_exercise · medium · fnptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-recursion-1` — Recursive Factorial
_exercise · medium · recursion · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-recursion-2` — Recursive Fibonacci
_exercise · medium · recursion · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-recursion-3` — Recursive Binary Search
_exercise · medium · recursion · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-recursion-4` — Binary Tree Depth
_exercise · medium · recursion · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-bits-1` — Pack a Date Into uint32
_exercise · medium · bits · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-bits-2` — Unpack a Date From uint32
_exercise · medium · bits · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-bits-3` — Set, Clear, and Test a Bit
_exercise · medium · bits · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-bits-4` — Pack RGBA Into uint32
_exercise · medium · bits · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-strings-1` — Split a String by Delimiter
_exercise · medium · strings · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-strings-2` — Parse Int With Error Flag
_exercise · medium · strings · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-strings-3` — Reverse Words In Place
_exercise · medium · strings · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-strings-4` — Trim ASCII Whitespace In Place
_exercise · medium · strings · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-sort-1` — Insertion Sort In Place
_exercise · medium · sort · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-sort-2` — Sort Ints by Callback
_exercise · medium · sort · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-sort-3` — Selection Sort
_exercise · medium · sort · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-sort-4` — Check Sortedness
_exercise · medium · sort · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-aos-1` — Find Max-By-Field
_exercise · medium · aos · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-aos-2` — Sum a Field Across Structs
_exercise · medium · aos · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-aos-3` — Filter Structs Into a New Array
_exercise · medium · aos · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-aos-4` — Average a Field
_exercise · medium · aos · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-errs-1` — Safe Division With Status
_exercise · medium · errs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-errs-2` — Find Index With Status
_exercise · medium · errs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-errs-3` — Checked Add With Overflow Flag
_exercise · medium · errs · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-errs-4` — Optional Out-Pointer Average
_exercise · medium · errs · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-num-1` — GCD Via Euclid
_exercise · medium · num · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-num-2` — Primality Check
_exercise · medium · num · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-num-3` — Integer Square Root
_exercise · medium · num · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-num-4` — Power By Squaring
_exercise · medium · num · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-1` — Quicksort In Place
_exercise · hard · algo · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-2` — Mergesort With Single Scratch Buffer
_exercise · hard · algo · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-3` — Binary Search: Lower And Upper Bound
_exercise · hard · algo · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-4` — KMP Substring Search
_exercise · hard · algo · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-arrays-1` — Longest Increasing Subsequence Length
_exercise · hard · arrays · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-arrays-2` — Maximum Subarray Sum (Kadane)
_exercise · hard · arrays · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-arrays-3` — Three-Way Partition Around Pivot
_exercise · hard · arrays · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-arrays-4` — Rotate Array Left By K (Reversal Trick)
_exercise · hard · arrays · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bit-1` — Population Count Without Builtins
_exercise · hard · bit · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bit-2` — Pack 4x4 Bit Grid Into A uint16
_exercise · hard · bit · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-bit-3` — Reverse Bits Of A uint32
_exercise · hard · bit · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-bit-4` — Count Trailing Zeros (No Builtins)
_exercise · hard · bit · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ds-1` — LRU Cache With Doubly-Linked List
_exercise · hard · ds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ds-2` — Min-Heap With Sift Up And Down
_exercise · hard · ds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ds-3` — Fixed-Capacity Ring Buffer
_exercise · hard · ds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ds-4` — String→Int Hash Map With Chaining
_exercise · hard · ds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-file-1` — Unsigned Varint (LEB128) Encode and Decode
_exercise · hard · fileformat · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-file-2` — Packed Binary Records (Write + Read)
_exercise · hard · fileformat · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-file-3` — Run-Length Encode And Decode
_exercise · hard · fileformat · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-file-4` — Fletcher-16 Checksum + Verify
_exercise · hard · fileformat · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graph-1` — BFS Shortest Path On A Grid
_exercise · hard · graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graph-2` — Topological Sort (Kahn's Algorithm)
_exercise · hard · graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graph-3` — Connected Components Count (Union-Find)
_exercise · hard · graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graph-4` — Detect Cycle In A Directed Graph
_exercise · hard · graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-mem-1` — Arena Allocator With Bump+Reset
_exercise · hard · mem · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-mem-2` — Deep Copy A Person With Owned Strings
_exercise · hard · mem · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-mem-3` — Bump Allocator With Checkpoint/Restore
_exercise · hard · mem · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-mem-4` — Fixed-Slot Freelist Allocator
_exercise · hard · mem · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parse-1` — CSV Row Parser With Quoted Fields
_exercise · hard · parse · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parse-2` — Strict Integer Parser With Overflow Check
_exercise · hard · parse · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parse-3` — Tiny JSON-Lite Object Parser
_exercise · hard · parse · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parse-4` — Wildcard Match (* and ?)
_exercise · hard · parse · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sm-1` — Vending Machine State Machine
_exercise · hard · statemachine · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sm-2` — Tiny Stack Machine Interpreter
_exercise · hard · statemachine · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sm-3` — Tiny Regex (^, $, ., *)
_exercise · hard · statemachine · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sm-4` — Traffic Light State Machine
_exercise · hard · statemachine · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-1` — Binary Search Tree With Inorder Walk
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-2` — Trie With Insert, Search, And Prefix
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-3` — BST Min, Max, And Height
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-4` — Trie: Collect Words With Prefix
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-cairo-handwritten

- **Course title:** Cairo Challenges
- **Language:** cairo
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-cairo-handwritten fully translated to `ru`
- [ ] challenges-cairo-handwritten fully translated to `es`
- [ ] challenges-cairo-handwritten fully translated to `fr`
- [ ] challenges-cairo-handwritten fully translated to `kr`
- [ ] challenges-cairo-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · cairo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · cairo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · cairo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · cairo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · cairo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-13` — Sum Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u32-math-10` — Sum of Digits
_exercise · easy · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-12` — Sum Array Elements
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-7` — Sum of Array Elements
_exercise · easy · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-felt252-arithmetic-11` — Calculate Sum of Three Felt252 Values
_exercise · easy · felt252 arithmetic · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-byte-arrays-9` — Concatenate Two ByteArrays
_exercise · easy · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-6` — Safe Division with Options
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-8` — Write Basic Unit Tests
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-16` — Safe Division with Options
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-17` — Sum of Multiples
_exercise · easy · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-14` — Create and Access a Point Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-byte-arrays-19` — Count Vowels in ByteArray
_exercise · easy · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-18` — Write Unit Tests for a Counter Function
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-felt252-arithmetic-21` — Calculate Sum of Three Felt252 Numbers
_exercise · easy · felt252 arithmetic · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-15` — Implement Area Trait for Shapes
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u32-math-20` — Sum of Digits
_exercise · easy · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-22` — Sum of Array Elements
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-23` — Tuple Swap
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-26` — Extract Option Value with Default
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-27` — Sum Even Numbers in Range
_exercise · easy · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-24` — Define a Point Struct and Calculate Distance
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-25` — Implement a Comparable Trait for Points
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-felt252-arithmetic-31` — Sum of Squares
_exercise · easy · felt252 arithmetic · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-28` — Write Simple Assertions
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u32-math-30` — Sum of Digits
_exercise · easy · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-byte-arrays-29` — Count Vowels in ByteArray
_exercise · easy · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-33` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-32` — Find Maximum Element in Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-37` — Sum of Even Numbers in Range
_exercise · easy · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-byte-arrays-39` — Concatenate Two ByteArrays
_exercise · easy · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-34` — Create and Update a Point Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-35` — Implement Area Trait for Shapes
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-38` — Write Passing Unit Tests for a Sum Function
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-36` — Safe Division with Options
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u32-math-40` — Sum of Multiples
_exercise · easy · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-felt252-arithmetic-1` — Compute Modular Inverse in Field
_exercise · medium · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-4` — Implement a Point Distance Calculator with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-6` — Chain Option Transformations with Result Recovery
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-loops-7` — Sum of Fibonacci Numbers Up To N
_exercise · medium · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-8` — Test Coverage Analyzer
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-3` — Tuple Rotation and Filtering
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-2` — Find Peak Elements in Array
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-5` — Implement a Generic Stack with Display Trait
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-byte-arrays-9` — Byte Array XOR Cipher
_exercise · medium · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-felt252-arithmetic-11` — Compute Modular Inverse in Cairo
_exercise · medium · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u32-math-10` — Compute Bit Parity Sum
_exercise · medium · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-12` — Find Pairs with Target Sum
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-13` — Tuple Rotation and Filtering
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-loops-17` — Sum of Fibonacci Numbers Below Limit
_exercise · medium · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-14` — Build a Point Distance Calculator
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-16` — Unwrap Nested Options with Error Handling
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-18` — Test Helper: Array Equality Checker
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-15` — Implement a Generic Stack with Custom Display
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u32-math-20` — Count Set Bits in Range
_exercise · medium · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-byte-arrays-19` — Reverse ByteArray Chunks
_exercise · medium · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-felt252-arithmetic-21` — Modular Exponentiation with Felt252
_exercise · medium · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-22` — Find Pairs Summing to Target
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-23` — Tuple Rotation and Max Value
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-24` — Build a Point Distance Calculator with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-26` — Safe Division with Option and Result
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-25` — Implement a Comparable Shape Trait
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-loops-27` — Sum of Squares with Early Exit
_exercise · medium · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-felt252-arithmetic-31` — Balanced Ternary Digit Sum
_exercise · medium · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-28` — Test Suite Coverage Calculator
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-byte-arrays-29` — Byte Array XOR Cipher
_exercise · medium · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-34` — Implement a Simple Inventory System
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-35` — Custom Shape Area Calculator with Trait
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-loops-37` — Sum of Squares in Range
_exercise · medium · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-33` — Tuple Zipper with Conditional Swap
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-36` — Safe Division with Option and Result
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-32` — Find Pivot Index in Array
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u32-math-30` — Calculate Digit Sum with Overflow Check
_exercise · medium · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-38` — Implement a Test Assertion Library
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u32-math-40` — Find Missing Number in Sequence
_exercise · medium · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-byte-arrays-39` — Byte Array XOR Cipher
_exercise · medium · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-2` — Longest Increasing Subsequence Length
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-3` — Tuple Tree Path Validator
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-felt252-arithmetic-1` — Modular Inverse in Felt252 Prime Field
_exercise · hard · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-loops-7` — Prime Factorization with Exponents
_exercise · hard · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-6` — Fallible Option Chain Transformer
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-5` — Generic Binary Tree with Custom Ordering
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-8` — Property-Based Testing Framework
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-byte-arrays-9` — Implement UTF-8 Byte Length Calculator
_exercise · hard · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u32-math-10` — Compute Modular Multiplicative Inverse
_exercise · hard · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-4` — Implement a Generic Memory Pool with Reference Counting
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-13` — Nested Tuple Path Finder
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-felt252-arithmetic-11` — Modular Multiplicative Inverse in Prime Field
_exercise · hard · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-16` — Nested Result Unwrapping with Safe Division Chain
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-15` — Generic Stack with Trait Bounds and Drop Implementation
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-14` — Implement a Generic LRU Cache with Structs
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-loops-17` — Find All Prime Factor Decompositions
_exercise · hard · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u32-math-20` — Prime Factorization with Multiplicity
_exercise · hard · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-18` — Property-Based Test Generator for Merkle Tree
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-felt252-arithmetic-21` — Modular Exponentiation with Felt252
_exercise · hard · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-byte-arrays-19` — Byte Array Pattern Matcher with Wildcards
_exercise · hard · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-12` — Partition Array by Median with Stable Ordering
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-23` — Tuple-Based Merkle Tree Path Verifier
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-loops-27` — Collatz Sequence Peak Finder
_exercise · hard · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-22` — Merge Overlapping Intervals
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-26` — Nested Result Unwrapping with Error Aggregation
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-24` — Implement a Self-Balancing AVL Tree with Generic Structs
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u32-math-30` — Compute Integer Square Root Without Division
_exercise · hard · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-25` — Generic Binary Tree with Custom Comparison Trait
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-28` — Custom Test Framework: Assertion Engine
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-byte-arrays-29` — ByteArray Compression - Run-Length Encoding
_exercise · hard · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-felt252-arithmetic-31` — Implement Modular Exponentiation for Large Felt252 Powers
_exercise · hard · felt252 arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-32` — Longest Increasing Subsequence Length
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-33` — Tuple Tree Traversal with Path Reconstruction
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-loops-37` — Collatz Sequence Peak Finder
_exercise · hard · loops · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u32-math-40` — Implement Modular Exponentiation for u32
_exercise · hard · u32 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-38` — Property-Based Testing Framework
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-byte-arrays-39` — Implement Byte Array Compression with Run-Length Encoding
_exercise · hard · byte arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-36` — Nested Result Chain Transformer
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-35` — Generic Priority Queue with Custom Ordering
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-34` — Implement a Generic Priority Queue with Structs
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-cpp-handwritten

- **Course title:** Cpp Challenges
- **Language:** cpp
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-cpp-handwritten fully translated to `ru`
- [ ] challenges-cpp-handwritten fully translated to `es`
- [ ] challenges-cpp-handwritten fully translated to `fr`
- [ ] challenges-cpp-handwritten fully translated to `kr`
- [ ] challenges-cpp-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-string-1` — Reverse a String
_exercise · easy · string · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-string-2` — Count a Character
_exercise · easy · string · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-string-3` — Substring Contains
_exercise · easy · string · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-string-4` — Convert to Upper Case
_exercise · easy · string · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-vector-1` — Sum a Vector
_exercise · easy · vector · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-vector-2` — Find Vector Maximum
_exercise · easy · vector · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-vector-3` — Filter Even Numbers
_exercise · easy · vector · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-vector-4` — Count Positives
_exercise · easy · vector · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-map-1` — Count Word Occurrences
_exercise · easy · map · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-map-2` — Lookup with Default
_exercise · easy · map · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-map-3` — Sorted Keys From Map
_exercise · easy · map · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-map-4` — Sum All Map Values
_exercise · easy · map · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-iterators-1` — Sum With std::accumulate
_exercise · easy · iterators · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-iterators-2` — Find Index of Value
_exercise · easy · iterators · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-iterators-3` — Count Occurrences with std::count
_exercise · easy · iterators · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-iterators-4` — Product with std::accumulate
_exercise · easy · iterators · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-lambdas-1` — Sort Descending With Lambda
_exercise · easy · lambdas · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-lambdas-2` — All Positive With std::all_of
_exercise · easy · lambdas · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-lambdas-3` — Any Even With std::any_of
_exercise · easy · lambdas · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-lambdas-4` — Square Each Element
_exercise · easy · lambdas · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-references-1` — Swap Two Ints
_exercise · easy · references · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-references-2` — Increment In Place
_exercise · easy · references · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-references-3` — Double Each Vector Entry
_exercise · easy · references · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-references-4` — Set To Maximum
_exercise · easy · references · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-1` — Point Distance From Origin
_exercise · easy · structs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-2` — Counter Struct
_exercise · easy · structs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-3` — Rectangle Area
_exercise · easy · structs · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-structs-4` — Person Greeting
_exercise · easy · structs · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-numbers-1` — Compute Factorial
_exercise · easy · numbers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-numbers-2` — Absolute Value
_exercise · easy · numbers · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-numbers-3` — Sign of an Integer
_exercise · easy · numbers · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-numbers-4` — Is Small Prime
_exercise · easy · numbers · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-1` — Classify Number Sign
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-2` — Fizz Buzz String
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-3` — Classify Triangle
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-conditionals-4` — Letter Grade From Score
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-ranges-1` — Count Above Threshold
_exercise · easy · ranges · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-ranges-2` — Average of Vector
_exercise · easy · ranges · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-ranges-3` — Build Range Vector
_exercise · easy · ranges · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `easy-ranges-4` — Increment Vector by N
_exercise · easy · ranges · parts: title, body, hints (1)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-templates-1` — Generic min_of Function Template
_exercise · medium · templates · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-templates-2` — Generic Pair Template
_exercise · medium · templates · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-templates-3` — Generic Stack<T> Class Template
_exercise · medium · templates · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-templates-4` — Template max_in_range over Iterators
_exercise · medium · templates · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-stl-1` — Transform Then Sort
_exercise · medium · stl · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-stl-2` — Sum of Squares with accumulate
_exercise · medium · stl · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-stl-3` — Count Elements Above Threshold
_exercise · medium · stl · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-stl-4` — Partition Evens to the Front
_exercise · medium · stl · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-classes-1` — RAII Counter Wrapper
_exercise · medium · classes · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-classes-2` — Counter with Increment Operators
_exercise · medium · classes · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-classes-3` — Greeting Builder
_exercise · medium · classes · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-classes-4` — Inclusive Range with Contains
_exercise · medium · classes · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-inherit-1` — Shape Hierarchy with Virtual area
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-inherit-2` — Polymorphic speak() Method
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-inherit-3` — Salaried vs Hourly Employee
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-inherit-4` — Vehicle Wheel Count via Virtual
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-smartptr-1` — Vector of unique_ptr<int>
_exercise · medium · smartptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-smartptr-2` — Shared Ownership Use Count
_exercise · medium · smartptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-smartptr-3` — Build a unique_ptr Owning a Struct
_exercise · medium · smartptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-smartptr-4` — Cache Returning Shared Pointers
_exercise · medium · smartptr · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-refs-1` — Swap Two Integers via Reference
_exercise · medium · refs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-refs-2` — Read-only Length, Mutating Append
_exercise · medium · refs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-refs-3` — Const Accessor on a Box
_exercise · medium · refs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-refs-4` — Average via Const Reference Vector
_exercise · medium · refs · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mapset-1` — Group Words by First Letter
_exercise · medium · mapset · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mapset-2` — Set Intersection
_exercise · medium · mapset · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mapset-3` — Frequency Map of Ints
_exercise · medium · mapset · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-mapset-4` — Unique Sorted via std::set
_exercise · medium · mapset · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-optional-1` — First Even or Nothing
_exercise · medium · optional · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-optional-2` — Lookup with Default via value_or
_exercise · medium · optional · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-optional-3` — Safe Divide Returns Optional
_exercise · medium · optional · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-optional-4` — Map Over an Optional<int>
_exercise · medium · optional · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-rangefor-1` — Multiply All Elements by Two In Place
_exercise · medium · rangefor · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-rangefor-2` — Sum Map Values via Structured Bindings
_exercise · medium · rangefor · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-rangefor-3` — Collect Keys in Iteration Order
_exercise · medium · rangefor · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-rangefor-4` — Sum a C Array via Range-For
_exercise · medium · rangefor · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-operator-1` — Vec2 with +, -, ==
_exercise · medium · operator · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-operator-2` — Vec2 Stream Insertion
_exercise · medium · operator · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-operator-3` — Money with += and ==
_exercise · medium · operator · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `medium-operator-4` — Fraction with + and ==
_exercise · medium · operator · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-ds-1` — LRU Cache (unordered_map + list)
_exercise · hard · ds · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-ds-2` — MinHeap From Scratch
_exercise · hard · ds · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-ds-3` — Trie with insert / search / startsWith
_exercise · hard · ds · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-ds-4` — Fixed-Capacity RingBuffer<T, N> Template
_exercise · hard · ds · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-trees-1` — BST with insert / erase / inorder
_exercise · hard · trees · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-trees-2` — Height-Balanced Insert (AVL light)
_exercise · hard · trees · parts: title, body, hints (3)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-trees-3` — Iterative Inorder Traversal of Binary Tree
_exercise · hard · trees · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-trees-4` — Generic Tree<T> with addChild + dfs
_exercise · hard · trees · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-1` — Templated In-Place Quicksort
_exercise · hard · algo · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-2` — Templated Mergesort (vector)
_exercise · hard · algo · parts: title, body, hints (2)_
- [x] `ru`
- [x] `es`
- [x] `fr`
- [x] `kr`
- [x] `jp`

#### `hard-algo-3` — lower_bound and upper_bound by Hand
_exercise · hard · algo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algo-4` — KMP Substring Search
_exercise · hard · algo · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — LIS Length via Patience (lower_bound)
_exercise · hard · dp · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Edit Distance (Levenshtein)
_exercise · hard · dp · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Coin Change — Minimum Coins
_exercise · hard · dp · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Longest Palindromic Substring
_exercise · hard · dp · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-stl-1` — Group Consecutive Equal Runs
_exercise · hard · stl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-stl-2` — Multi-Key Sort of Records
_exercise · hard · stl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-stl-3` — Partition Then Transform
_exercise · hard · stl · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-stl-4` — Sorted Set Difference
_exercise · hard · stl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tmpl-1` — Variadic sum_all (parameter pack)
_exercise · hard · tmpl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tmpl-2` — Compile-Time Tuple-Like Access
_exercise · hard · tmpl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tmpl-3` — Integral-Only abs_val with enable_if
_exercise · hard · tmpl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tmpl-4` — Variadic count_if_integral via Traits
_exercise · hard · tmpl · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-raii-1` — Custom UniquePtr<T> (move-only)
_exercise · hard · raii · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-raii-2` — ScopeGuard with dismiss()
_exercise · hard · raii · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-raii-3` — RefCounted Intrusive Smart Pointer
_exercise · hard · raii · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-raii-4` — RAII Counter Handle (resource open/close)
_exercise · hard · raii · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-move-1` — Movable Buffer (heap int array)
_exercise · hard · move · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-move-2` — Move-Only Resource Handle
_exercise · hard · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-move-3` — Move-Constructed Vector Wrapper
_exercise · hard · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-move-4` — Copy-and-Swap Assignment
_exercise · hard · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-1` — Run-Length Encode and Decode
_exercise · hard · string · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-2` — Group Anagrams
_exercise · hard · string · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-3` — Longest Common Substring (DP)
_exercise · hard · string · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-4` — Count Substring Occurrences (overlapping)
_exercise · hard · string · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-1` — Turnstile Finite State Machine
_exercise · hard · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-2` — EventEmitter (string -> callbacks)
_exercise · hard · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-3` — Subject / Observer Notification
_exercise · hard · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-4` — Counter with Undo Stack
_exercise · hard · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-csharp-handwritten

- **Course title:** Csharp Challenges
- **Language:** csharp
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-csharp-handwritten fully translated to `ru`
- [ ] challenges-csharp-handwritten fully translated to `es`
- [ ] challenges-csharp-handwritten fully translated to `fr`
- [ ] challenges-csharp-handwritten fully translated to `kr`
- [ ] challenges-csharp-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-arrays-1` — Sum an Int Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-2` — Find Maximum in an Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-3` — Array Contains a Value
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-4` — Reverse an Int Array In Place
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-1` — Compute String Length
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Check Palindrome
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Count a Character
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-1` — Add to a List
_exercise · easy · list · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-2` — Remove First Occurrence from List
_exercise · easy · list · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-3` — Check List Contains
_exercise · easy · list · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-4` — Sum a List
_exercise · easy · list · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dict-1` — Add to a Dictionary
_exercise · easy · dict · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dict-2` — Lookup With Default
_exercise · easy · dict · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dict-3` — Count Character Occurrences
_exercise · easy · dict · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dict-4` — Dictionary Size
_exercise · easy · dict · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-linq-1` — LINQ Sum
_exercise · easy · linq · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-linq-2` — LINQ Max
_exercise · easy · linq · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-linq-3` — Filter Even Numbers
_exercise · easy · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-linq-4` — Square Each Number
_exercise · easy · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-cond-1` — Sign of a Number
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-cond-2` — FizzBuzz Returning a String
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-cond-3` — Classify a Temperature
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-cond-4` — Is a Year a Leap Year
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-1` — Count Numbers Above Threshold
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-2` — Accumulate 1..N
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-3` — Double Every Element
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-4` — Count Vowels
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-1` — Factorial
_exercise · easy · math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-2` — Absolute Value
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-3` — Is Even
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-4` — Integer Power
_exercise · easy · math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-1` — Overload Area
_exercise · easy · methods · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-2` — Recursive Countdown String
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-3` — Recursive Sum 1..N
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-4` — Overload Greet
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exc-1` — Throw on Negative
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exc-2` — Validate Non-Empty String
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exc-3` — Safe Divide
_exercise · easy · exceptions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exc-4` — Validate Age Range
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-linq-1` — Group Words by Length
_exercise · medium · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-linq-2` — Aggregate a Sentence
_exercise · medium · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-linq-3` — Zip Names with Scores
_exercise · medium · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-linq-4` — Paginate with Skip/Take
_exercise · medium · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-1` — Generic Pair Record
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-2` — Generic Stack
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-3` — Generic MinBy
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-4` — Generic Cache
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-1` — Immutable Update with with
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-2` — Deconstruct a Record
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-3` — Record Value Equality
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-4` — Record Derivation Chain
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-1` — Switch Expression on Value
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-2` — Type Pattern Dispatch
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-3` — Property Pattern Match
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-4` — Tuple Pattern FizzBuzz
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inherit-1` — Shape Hierarchy Area
_exercise · medium · inherit · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inherit-2` — Virtual Speak with Override
_exercise · medium · inherit · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inherit-3` — Base Call in Override
_exercise · medium · inherit · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inherit-4` — Protected Field Usage
_exercise · medium · inherit · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegate-1` — Compose Two Functions
_exercise · medium · delegate · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegate-2` — Retry Helper
_exercise · medium · delegate · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegate-3` — Combine Predicates with And
_exercise · medium · delegate · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegate-4` — Apply Action N Times
_exercise · medium · delegate · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuple-1` — Named Tuple Min/Max
_exercise · medium · tuple · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuple-2` — Deconstruct Division
_exercise · medium · tuple · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuple-3` — Swap via Tuple Assignment
_exercise · medium · tuple · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuple-4` — Tuple Key Dictionary
_exercise · medium · tuple · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-1` — Static Helper: IsBlank
_exercise · medium · staticclass · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-2` — Static Helper: Chunk
_exercise · medium · staticclass · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-3` — Static Helper: Repeat String
_exercise · medium · staticclass · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-4` — Static Helper: Sum of Squares
_exercise · medium · staticclass · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-1` — Custom Exception Type
_exercise · medium · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-2` — Multi-Catch Fallback
_exercise · medium · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-3` — Rethrow Preserving Stack
_exercise · medium · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-4` — Try/Finally Cleanup
_exercise · medium · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterator-1` — Count Up with yield
_exercise · medium · iterator · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterator-2` — Lazy Take While
_exercise · medium · iterator · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterator-3` — Interleave Two Sequences
_exercise · medium · iterator · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterator-4` — Running Sum Generator
_exercise · medium · iterator · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-1` — Implement an LRU Cache
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-2` — Build a Binary MinHeap<T>
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-3` — Build a Trie with Prefix Search
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-4` — Fixed-Size Ring Buffer<T>
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-1` — BST Insert, Search, and Inorder Traversal
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-2` — AVL Insert with Rotations
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-3` — Iterative Inorder Traversal
_exercise · hard · trees · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-4` — Generic N-ary Tree<T> with DFS/BFS
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-1` — Quicksort with Lomuto Partition
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-2` — Stable Mergesort on int[]
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-3` — Lower and Upper Bound Binary Search
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-4` — KMP Substring Search
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — Longest Increasing Subsequence Length
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Edit (Levenshtein) Distance
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Coin Change: Fewest Coins for Amount
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Longest Palindromic Substring
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-linq-1` — Group Orders: Total, Count, Avg per Customer
_exercise · hard · linq · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-linq-2` — Top-N Word Frequencies from Sentences
_exercise · hard · linq · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-linq-3` — Running Balance via Aggregate
_exercise · hard · linq · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-linq-4` — Distinct Case-Insensitive Email Comparer
_exercise · hard · linq · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-1` — Generic PriorityQueue<TItem, TPriority>
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-2` — Generic Memoize<K,V>
_exercise · hard · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-3` — Generic Cache<K,V> with TTL
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-4` — Generic Directed Graph with BFS Shortest Path
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-1` — Aggregate Exceptions from Parallel Tasks
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-2` — Retry with Exponential Backoff
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-3` — Write a Task.WhenAll<T> Polyfill
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-4` — Bounded Parallel Runner with SemaphoreSlim
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-1` — Record-Based Expression AST Evaluator
_exercise · hard · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-2` — Result<T,E> Sealed Union with Map and Bind
_exercise · hard · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-3` — Shipping Cost via Property Patterns
_exercise · hard · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-4` — Record Equality and Non-Destructive Update
_exercise · hard · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-1` — Observable<T> with Subscribe and Push
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-2` — Topic-Keyed EventBus
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-3` — Finite State Machine with Transition Guards
_exercise · hard · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-4` — Mediator: Send and Handle
_exercise · hard · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-1` — Mini JSON Parser (numbers, strings, arrays, objects, bool, null)
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-2` — Arithmetic Calculator with Parentheses
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-3` — Parse Query String with Array Keys
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-4` — RFC 4180 CSV Parser
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-dart-handwritten

- **Course title:** Dart Challenges
- **Language:** dart
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-dart-handwritten fully translated to `ru`
- [ ] challenges-dart-handwritten fully translated to `es`
- [ ] challenges-dart-handwritten fully translated to `fr`
- [ ] challenges-dart-handwritten fully translated to `kr`
- [ ] challenges-dart-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · dart · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · dart · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · dart · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · dart · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · dart · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-11` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-12` — Find the Largest Element in a List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extension-methods-8` — String Extension: Capitalize Words
_exercise · easy · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-records-9` — Swap Record Fields
_exercise · easy · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-13` — Count Character Frequency
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterables-and-generators-6` — Generate Even Numbers Up To N
_exercise · easy · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-futures-and-async-await-7` — Fetch User Name from Simulated API
_exercise · easy · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sealed-classes-10` — Pattern Match Shape Areas
_exercise · easy · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-null-safety-15` — Safe List Access
_exercise · easy · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-14` — Create a Simple Counter Class
_exercise · easy · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterables-and-generators-16` — Generate Fibonacci Sequence
_exercise · easy · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-futures-and-async-await-17` — Fetch User Data with Timeout
_exercise · easy · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-21` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extension-methods-18` — Create a String Case Converter Extension
_exercise · easy · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-records-19` — Parse Student Records
_exercise · easy · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sealed-classes-20` — Shape Area Calculator with Sealed Classes
_exercise · easy · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-22` — Find the Largest Number in a List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-null-safety-25` — Safe String Length Calculator
_exercise · easy · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-23` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-24` — Create a Simple Counter Class
_exercise · easy · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-futures-and-async-await-27` — Fetch User Data with Async/Await
_exercise · easy · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterables-and-generators-26` — Generate Fibonacci Sequence
_exercise · easy · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extension-methods-28` — String Extension: Capitalize Words
_exercise · easy · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-records-29` — Parse User Records
_exercise · easy · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-31` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-32` — Find Maximum Value in List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sealed-classes-30` — Pattern Match Shape Areas
_exercise · easy · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-null-safety-35` — Safe String Length Calculator
_exercise · easy · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-33` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-34` — Create a Simple Counter Class
_exercise · easy · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-futures-and-async-await-37` — Chain Async Delays
_exercise · easy · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-records-39` — Swap Record Fields
_exercise · easy · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterables-and-generators-36` — Generate Fibonacci Sequence
_exercise · easy · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extension-methods-38` — String Repetition with Extension Methods
_exercise · easy · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sealed-classes-40` — Pattern Match on Sealed Shape Hierarchy
_exercise · easy · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Balanced Bracket Subsequence
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-null-safety-5` — Safe List Operations with Nullable Elements
_exercise · medium · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-2` — Rotate List Elements
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-3` — Merge and Sum Overlapping Keys
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterables-and-generators-6` — Lazy Fibonacci Generator
_exercise · medium · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-4` — Implement a Generic Stack with Size Limit
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-methods-8` — Custom Collection Extensions
_exercise · medium · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-11` — Balanced Bracket Subsequence
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-classes-10` — Pattern Match Shape Area Calculator
_exercise · medium · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-9` — Parse Contact Records
_exercise · medium · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-futures-and-async-await-7` — Parallel API Fetcher with Timeout
_exercise · medium · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-12` — Sliding Window Maximum
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-13` — Merge and Count Conflicts in Maps
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-null-safety-15` — Safe Chain Navigator
_exercise · medium · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterables-and-generators-16` — Lazy Fibonacci Iterator
_exercise · medium · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-14` — Implement a Simple Stack with Size Limit
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-19` — Merge Overlapping Time Ranges
_exercise · medium · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-classes-20` — Pattern Match Payment Methods
_exercise · medium · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-futures-and-async-await-17` — Parallel API Fetcher with Timeout
_exercise · medium · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-methods-18` — Implement String and List Extension Methods
_exercise · medium · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-21` — Balanced Bracket Subsequence
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-22` — Find Missing Numbers in Sequence
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-23` — Merge Maps with Custom Collision Strategy
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-24` — Implement a Generic Stack with Capacity Limit
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-null-safety-25` — Safe List Element Access with Null Coalescing
_exercise · medium · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterables-and-generators-26` — Build a Circular Buffer Iterator
_exercise · medium · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-futures-and-async-await-27` — Parallel API Fetcher with Timeout
_exercise · medium · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-classes-30` — Pattern Match Shape Areas
_exercise · medium · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-methods-28` — Chain-able String Extensions
_exercise · medium · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-29` — Parse and Transform User Records
_exercise · medium · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-31` — Run-Length Decode with Validation
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-32` — Rotate List Elements by K Positions
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-null-safety-35` — Safe List Operations with Null Safety
_exercise · medium · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-33` — Merge and Count Overlapping Keys
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterables-and-generators-36` — Lazy Fibonacci Iterator
_exercise · medium · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-futures-and-async-await-37` — Parallel Task Executor with Timeout
_exercise · medium · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-34` — Implement a Simple Bank Account with Transaction History
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extension-methods-38` — String Extension Toolkit
_exercise · medium · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-39` — Parse and Transform CSV Records
_exercise · medium · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-classes-40` — Pattern Match Payment Methods
_exercise · medium · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Longest Palindromic Subsequence Length
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-2` — Merge K Sorted Lists
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-null-safety-5` — Safe Chain Navigator with Fallback Transforms
_exercise · hard · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterables-and-generators-6` — Lazy Prime Factorization Stream
_exercise · hard · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-3` — Nested Map Path Resolver with Wildcards
_exercise · hard · maps · parts: title, body_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-4` — Implement a Type-Safe Expression Builder with Validation
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-extension-methods-8` — Type-Safe Builder Chain via Extension Methods
_exercise · hard · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-futures-and-async-await-7` — Implement a Retry Mechanism with Exponential Backoff
_exercise · hard · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-11` — Longest Common Substring with K Mismatches
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-classes-10` — Build a Type-Safe Expression Evaluator with Sealed Classes
_exercise · hard · sealed classes · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-12` — Merge K Sorted Lists with O(N log K) Complexity
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-9` — Record Pattern Matching Cache
_exercise · hard · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-13` — Nested Map Path Merger with Conflict Resolution
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterables-and-generators-16` — Lazy Infinite Prime Sieve with Skip-Ahead
_exercise · hard · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-null-safety-15` — Safe Chain Navigator with Fallback Logic
_exercise · hard · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-14` — Implement a Thread-Safe LRU Cache with TTL
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-21` — Longest Palindromic Substring with Efficient Expansion
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-extension-methods-18` — Polymorphic Chain Builder with Extension Methods
_exercise · hard · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-19` — Immutable Binary Tree Zipper with Records
_exercise · hard · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-futures-and-async-await-17` — Implement Parallel Task Executor with Retry Logic
_exercise · hard · futures and async/await · parts: title, body_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-classes-20` — Expression Evaluator with Sealed Class Pattern Matching
_exercise · hard · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-23` — Nested Map Path Resolver with Wildcards
_exercise · hard · maps · parts: title, body_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-22` — Longest Increasing Subsequence with Reconstruction
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterables-and-generators-26` — Lazy Infinite Fibonacci Sieve
_exercise · hard · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-null-safety-25` — Safe Chain Navigator with Default Recovery
_exercise · hard · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-24` — Implement a Generic LRU Cache with Expiration
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-futures-and-async-await-27` — Implement Parallel Task Limiter with Retry Logic
_exercise · hard · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-31` — Longest Palindromic Subsequence Length
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-records-29` — Nested Record Path Traversal and Transformation
_exercise · hard · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-classes-30` — Implement a Type-Safe Expression Evaluator with Sealed Classes
_exercise · hard · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-extension-methods-28` — Generic Collection Extension with Type Constraints
_exercise · hard · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-32` — Longest Increasing Subsequence with K Reversals
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-33` — Nested Map Path Resolver with Wildcards
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterables-and-generators-36` — Lazy Fibonacci Sequence with Memoization
_exercise · hard · iterables and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-null-safety-35` — Null-Safe Deep Map Merger
_exercise · hard · null safety · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-34` — Implement a Generic LRU Cache with Expiration
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-futures-and-async-await-37` — Implement Parallel Rate-Limited Batch Processor
_exercise · hard · futures and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-classes-40` — Expression Evaluator with Sealed Class AST
_exercise · hard · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-extension-methods-38` — Build a Fluent Query Builder with Extension Methods
_exercise · hard · extension methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-classes-40-2` — Expression Evaluator with Sealed AST
_exercise · hard · sealed classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-elixir-handwritten

- **Course title:** Elixir Challenges
- **Language:** elixir
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-elixir-handwritten fully translated to `ru`
- [ ] challenges-elixir-handwritten fully translated to `es`
- [ ] challenges-elixir-handwritten fully translated to `fr`
- [ ] challenges-elixir-handwritten fully translated to `kr`
- [ ] challenges-elixir-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · elixir · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · elixir · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · elixir · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · elixir · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · elixir · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-12` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enum-6` — Count Even Numbers in a List
_exercise · easy · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-8` — Tuple First and Last
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-11` — Find the Maximum Element in a List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-13` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-guards-7` — Temperature Classifier with Guards
_exercise · easy · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-9` — Build a User Profile Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-binaries-10` — Extract First N Bytes from Binary
_exercise · easy · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enum-16` — Count Occurrences in a List
_exercise · easy · Enum · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pipe-operator-15` — Chain String Transformations with Pipe Operator
_exercise · easy · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-18` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-guards-17` — Valid Age Guard
_exercise · easy · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-14` — Extract User Information with Pattern Matching
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-binaries-20` — Extract Prefix Bytes
_exercise · easy · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-21` — Find Maximum Element in List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-19` — Create and Update a User Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-22` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-23` — Count Letter Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-24` — Extract User Info with Pattern Matching
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enum-26` — Count Even Numbers in a List
_exercise · easy · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pipe-operator-25` — Chain String Transformations with Pipes
_exercise · easy · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-28` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-guards-27` — Filter Numbers with Guards
_exercise · easy · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-29` — Create and Update a User Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-31` — Find Maximum in List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-32` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-33` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enum-36` — Count Vowels in a String
_exercise · easy · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-34` — Extract User Info with Pattern Matching
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pipe-operator-35` — Chain Data Transformations with the Pipe Operator
_exercise · easy · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-38` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-binaries-30` — Extract PNG Width and Height
_exercise · easy · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-39` — Create and Access a Point Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-guards-37` — Validate Positive Numbers with Guards
_exercise · easy · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-binaries-40` — Extract Binary Header Magic Number
_exercise · easy · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-2` — Count Character Frequencies
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-1` — Chunk List by Predicate Changes
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-3` — Merge Nested Maps with Custom Rules
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-4` — Extract and Transform Nested API Response
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-6` — Group and Transform with Enum
_exercise · medium · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pipe-operator-5` — Chain Data Transformations with the Pipe Operator
_exercise · medium · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-8` — Tuple Coordinate Distance Calculator
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-binaries-10` — Extract Variable-Length Fields from Binary Protocol
_exercise · medium · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-guards-7` — Custom Guard Clauses for Number Classification
_exercise · medium · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-11` — Partition List by Predicate
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-9` — Implement a Priority Task Queue with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-13` — Deep Merge Nested Maps
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-12` — Balanced Bracket Validator
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pipe-operator-15` — Pipeline Data Transformer
_exercise · medium · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-14` — Pattern Match HTTP Response Codes
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-18` — Tuple Key-Value Pair Merger
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-19` — Implement a Point Distance Calculator with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-guards-17` — Custom Number Validator with Guards
_exercise · medium · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-16` — Group and Transform with Custom Aggregation
_exercise · medium · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-21` — Rotate List K Positions
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-binaries-20` — Binary Protocol Parser
_exercise · medium · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-23` — Merge Nested Maps with Conflict Resolution
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-22` — Parse and Validate Email Addresses
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pipe-operator-25` — Pipeline Data Transformation
_exercise · medium · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-26` — Group and Transform with Enum
_exercise · medium · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-28` — Nested Tuple Path Traversal
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-guards-27` — Guard Clause Validator
_exercise · medium · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-24` — Decode Network Packets with Pattern Matching
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-29` — Build a Point Distance Calculator with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-31` — Rotate List by K Positions
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-binaries-30` — Extract PNG Dimensions from Binary Header
_exercise · medium · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-32` — Run-Length Encode a String
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-36` — Group Anagrams
_exercise · medium · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-34` — Decode Nested Message Tuples
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-33` — Deep Merge Nested Maps
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pipe-operator-35` — Build a Data Pipeline with the Pipe Operator
_exercise · medium · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-guards-37` — Custom Guard Validator
_exercise · medium · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-binaries-40` — Extract Binary Protocol Message
_exercise · medium · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-38` — Tuple-Based Key-Value Store
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-39` — Implement a Point Distance Calculator with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-1` — Reconstruct Permutation from Inversions
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-2` — Decompress Run-Length Encoded String with Nested Brackets
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-3` — Deep Merge Nested Maps with Conflict Resolution
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-8` — Nested Tuple Path Extraction
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pipe-operator-5` — Build a Custom Pipeline Macro with Error Handling
_exercise · hard · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enum-6` — Multi-Level Group-By with Aggregation
_exercise · hard · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-4` — Recursive Pattern Matcher with Guards
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-11` — Implement Persistent List with Efficient Prepend and Concat
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-binaries-10` — Implement a Binary Diff Engine
_exercise · hard · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-9` — Implement a Persistent Vector with Structural Sharing
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-13` — Deep Merge Nested Maps with Conflict Resolution
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-guards-7` — Multi-Clause Guard Validator with Complex Conditions
_exercise · hard · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-12` — Balanced Bracket Subsequence
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-14` — Deep Pattern Matcher with Guards and Transformations
_exercise · hard · pattern matching · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pipe-operator-15` — Build a Custom Pipe Operator with Error Handling
_exercise · hard · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enum-16` — Implement Custom Enum.chunk_while/4
_exercise · hard · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-21` — Flatten Nested List with Depth Tracking
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-18` — Tuple-Based Expression Evaluator with Variables
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-binaries-20` — Binary Protocol Parser with Checksums
_exercise · hard · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-19` — Implement a Self-Balancing Binary Search Tree with Structs
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-guards-17` — Build a Type-Safe Pattern Matcher with Custom Guards
_exercise · hard · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-23` — Deep Merge Nested Maps with Custom Conflict Resolution
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-22` — Implement Run-Length Encoding with Escape Sequences
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pipe-operator-25` — Build a Custom Pipe Macro with Error Handling
_exercise · hard · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enum-26` — Implement Custom Lazy Chunk Iterator
_exercise · hard · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-24` — Recursive Pattern Matcher with Wildcards and Captures
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-28` — Nested Tuple Path Navigator
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-31` — Partition List into K Equal-Sum Subsets
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-guards-27` — Custom Guard Clause Composer
_exercise · hard · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-29` — Implement a Protocol-Based State Machine with Struct Transitions
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-33` — Deep Merge Nested Maps with Custom Conflict Resolution
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-32` — Balanced Bracket Subsequence
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-binaries-30` — Binary Pattern Matcher with Wildcards
_exercise · hard · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pipe-operator-35` — Build a Custom Pipe Operator with Error Handling
_exercise · hard · pipe operator · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-34` — Multi-Pattern Message Router with Guard Clauses
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enum-36` — Build a Custom Lazy Stream Transformer
_exercise · hard · Enum · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-38` — Nested Tuple Path Navigator
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-guards-37` — Multi-Clause Guard Validator for Typed Config Parser
_exercise · hard · guards · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-39` — Implement a Persistent Vector with Structural Sharing
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-binaries-40` — Build a Custom Binary Protocol Parser
_exercise · hard · binaries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-go-handwritten

- **Course title:** Go Challenges
- **Language:** go
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-go-handwritten fully translated to `ru`
- [ ] challenges-go-handwritten fully translated to `es`
- [ ] challenges-go-handwritten fully translated to `fr`
- [ ] challenges-go-handwritten fully translated to `kr`
- [ ] challenges-go-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-strings-1` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Check if a String is a Palindrome
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Count Occurrences of a Character
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Check if a String Contains a Substring
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-1` — Sum a Slice of Ints
_exercise · easy · slices · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-2` — Find the Maximum in a Slice
_exercise · easy · slices · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-3` — Filter Even Numbers
_exercise · easy · slices · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-4` — Reverse a Slice of Ints
_exercise · easy · slices · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-1` — Count Word Occurrences
_exercise · easy · maps · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-2` — Lookup with Default
_exercise · easy · maps · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-3` — Group Numbers by Parity
_exercise · easy · maps · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-4` — Check if a Key Exists
_exercise · easy · maps · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-1` — Check if a Number is Even
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-2` — Compute an Integer Power
_exercise · easy · numbers · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-3` — Compute Factorial
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-4` — Determine the Sign of an Integer
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-1` — Classify a Temperature
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-2` — Convert a Score to a Letter Grade
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-3` — FizzBuzz for One Number
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-4` — Return the Absolute Value
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-1` — Count Items Above a Threshold
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-2` — Sum Numbers from 1 to N
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-3` — Build a Repeated String
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-4` — Add One to Every Element
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-1` — Point Distance from Origin
_exercise · easy · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-2` — Person Greeting
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-3` — Counter with Increment
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-4` — Book IsLong Method
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-1` — Swap Two Ints via Pointers
_exercise · easy · pointers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-2` — Increment via Pointer
_exercise · easy · pointers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-3` — Set Through Pointer
_exercise · easy · pointers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-4` — Double Through Pointer
_exercise · easy · pointers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-errors-1` — Safe Integer Division
_exercise · easy · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-errors-2` — Parse a Positive Integer
_exercise · easy · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-errors-3` — First Element or Error
_exercise · easy · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-errors-4` — Square Root with Domain Check
_exercise · easy · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-range-1` — Sum a Map's Values
_exercise · easy · range · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-range-2` — Collect Map Keys
_exercise · easy · range · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-range-3` — Sum a 2D Slice
_exercise · easy · range · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-range-4` — Index of First Match
_exercise · easy · range · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-1` — Implement Stringer for Money
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-2` — Build a Custom NotFoundError
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-3` — Total Area of Mixed Shapes
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-4` — Implement sort.Interface for ByName
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-1` — Counter with Pointer Receiver Increment
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-2` — BankAccount Deposit and Withdraw
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-3` — Generic-less Int Stack
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-4` — Vector Add (value) and Scale (pointer)
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapsslices-1` — Group Strings by Length
_exercise · medium · mapsslices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapsslices-2` — Top-N Most Frequent Words
_exercise · medium · mapsslices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapsslices-3` — Build a Reverse Index
_exercise · medium · mapsslices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapsslices-4` — Slice Intersection (Set Style)
_exercise · medium · mapsslices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-1` — Parallel Sum with WaitGroup
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-2` — Concurrent Map over Slice
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-3` — Safe Concurrent Counter
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-4` — Channel-Backed ID Generator
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-channels-1` — Fan-In Two Channels
_exercise · medium · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-channels-2` — Worker Pool with Fan-Out
_exercise · medium · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-channels-3` — Build a Channel Pipeline
_exercise · medium · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-channels-4` — Read with Timeout
_exercise · medium · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-1` — Wrap a Sentinel and Detect with errors.Is
_exercise · medium · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-2` — Extract Custom Error with errors.As
_exercise · medium · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-3` — Wrap Errors at Each Layer
_exercise · medium · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-4` — Distinguish Two Custom Error Types
_exercise · medium · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sort-1` — Sort by Age then Name
_exercise · medium · sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sort-2` — Sort Strings by Length
_exercise · medium · sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sort-3` — Sort with Custom Comparator (Score Desc, Name Asc)
_exercise · medium · sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sort-4` — Stable Sort by Category
_exercise · medium · sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Title-Case Each Word
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-2` — Repeat with Separator using Builder
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-3` — Parse Comma List with Trim
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-4` — Replace from a Mapping
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-1` — Generic Map Function
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-2` — Generic Filter Function
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-3` — Generic Reduce (Fold)
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-4` — Generic Contains with comparable
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-time-1` — Reformat a Date String
_exercise · medium · time · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-time-2` — Humanize Duration as Hh Mm Ss
_exercise · medium · time · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-time-3` — Day-of-Week from Date String
_exercise · medium · time · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-time-4` — Days Between Two Dates
_exercise · medium · time · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-1` — Build LRU Cache
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-2` — Implement Min-Heap with container/heap
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-3` — Build a Trie
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-4` — Implement Ring Buffer
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-graph-1` — BFS Shortest Path
_exercise · hard · tree-graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-graph-2` — Topological Sort (Kahn's)
_exercise · hard · tree-graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-graph-3` — Iterative DFS Preorder
_exercise · hard · tree-graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-graph-4` — In-Order Tree Iterator
_exercise · hard · tree-graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-1` — Build a Worker Pool
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-2` — Fan-Out Fan-In with Timeout
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-3` — Concurrent Blocking Ring Buffer
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-4` — Counting Semaphore
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-channels-1` — Token Bucket Rate Limiter
_exercise · hard · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-channels-2` — Cancellable Pipeline with Context
_exercise · hard · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-channels-3` — Bounded Queue with Timeouts
_exercise · hard · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-channels-4` — Select First Ready Channel
_exercise · hard · channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-1` — Generic Priority Queue
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-2` — Generic Reachable-Set BFS
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-3` — Generic Memoize with Concurrency Safety
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-4` — Generic Stable MergeSort
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-1` — Tiny JSON-Like Parser
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-2` — Parse Query String with Arrays
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-3` — Parse INI Files
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-4` — CSV with Quoted Fields
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-algorithms-1` — Longest Increasing Subsequence
_exercise · hard · dp-algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-algorithms-2` — Levenshtein Edit Distance
_exercise · hard · dp-algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-algorithms-3` — Coin Change Min Coins
_exercise · hard · dp-algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-algorithms-4` — Longest Palindromic Substring
_exercise · hard · dp-algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-reflection-1` — Type-Switch Describe
_exercise · hard · reflection · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-reflection-2` — Walk Struct by JSON Tag
_exercise · hard · reflection · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-1` — Collect & Join Errors
_exercise · hard · error-handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-2` — Custom Error with Unwrap & Is
_exercise · hard · error-handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-3` — Validation Errors with Multiple Causes
_exercise · hard · error-handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-time-duration-1` — Mini Cron Scheduler
_exercise · hard · time-duration · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-time-duration-2` — Bucketize Timestamps
_exercise · hard · time-duration · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-time-duration-3` — Expiring TTL Cache
_exercise · hard · time-duration · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-reflection-3` — Generic Reflect-Based DeepEqual
_exercise · hard · reflection · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-reflection-4` — Set Struct Field by Path
_exercise · hard · reflection · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-4` — Retry With Permanent Error Marker
_exercise · hard · error-handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-time-duration-4` — Sliding Window Event Counter
_exercise · hard · time-duration · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-go-mo9kijkd

- **Course title:** Go — Challenge Pack
- **Language:** go
- **Chapters / lessons:** 3 / 100
- **Translation units:** 500 (100 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-go-mo9kijkd fully translated to `ru`
- [ ] challenges-go-mo9kijkd fully translated to `es`
- [ ] challenges-go-mo9kijkd fully translated to `fr`
- [ ] challenges-go-mo9kijkd fully translated to `kr`
- [ ] challenges-go-mo9kijkd fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-strings-0` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-1` — Sum All Elements in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-2` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-methods-3` — Create a Rectangle with Area and Perimeter Methods
_exercise · easy · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-interfaces-4` — Implement a Shape Interface
_exercise · easy · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-generics-5` — Generic Min Function
_exercise · easy · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-6` — Validate User Age
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-concurrency-and-channels-7` — Sum Numbers Concurrently with Channels
_exercise · easy · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-goroutines-8` — Parallel Sum with Goroutines
_exercise · easy · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-9` — Swap Two Integers Using Pointers
_exercise · easy · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-io-and-strings-10` — Count Lines and Words in Text
_exercise · easy · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-11` — Create a Counter Factory Using Closures
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-12` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-13` — Sum All Elements in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-14` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-methods-15` — Build a Counter with Increment and Reset
_exercise · easy · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-interfaces-16` — Implement a Shape Interface
_exercise · easy · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-generics-17` — Generic Min Function
_exercise · easy · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-18` — Validate Positive Number
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-concurrency-and-channels-19` — Sum Numbers Concurrently with Channels
_exercise · easy · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-goroutines-20` — Parallel Sum with Goroutines
_exercise · easy · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-21` — Swap Two Integers Using Pointers
_exercise · easy · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-io-and-strings-22` — Count Lines in a Text Block
_exercise · easy · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-23` — Create a Counter Closure
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-24` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-25` — Sum All Elements in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-26` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-methods-27` — Create a Counter with Increment and Reset Methods
_exercise · easy · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-interfaces-28` — Shape Area Calculator with Interfaces
_exercise · easy · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-generics-29` — Generic Min Function
_exercise · easy · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-30` — Validate Positive Number
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-concurrency-and-channels-31` — Sum Numbers Concurrently with Channels
_exercise · easy · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-goroutines-32` — Launch Concurrent Greeters
_exercise · easy · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pointers-33` — Swap Two Integers Using Pointers
_exercise · easy · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-io-and-strings-34` — Count Lines in Text
_exercise · easy · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-35` — Create a Counter Factory with Closures
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-36` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-37` — Sum All Elements in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-38` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-methods-39` — Create a Rectangle with Area and Perimeter Methods
_exercise · easy · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-40` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-41` — Merge Overlapping Intervals
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-42` — Word Frequency Counter with Top N Results
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-methods-43` — Implement a Bank Account with Transaction History
_exercise · medium · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-44` — Shape Calculator with Interfaces
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-45` — Generic Stack with Min Tracking
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-46` — Graceful Error Chain with Context
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-concurrency-and-channels-47` — Fan-In: Merge Multiple Channels
_exercise · medium · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-48` — Parallel Sum of Slices
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pointers-49` — Swap Values Using Pointers
_exercise · medium · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-io-and-strings-50` — Build a Simple Log Parser
_exercise · medium · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-51` — Build a Counter Factory with Step Control
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-52` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-53` — Sliding Window Maximum
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-54` — Word Frequency Counter with Case Normalization
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-methods-55` — Build a Bank Account with Transaction History
_exercise · medium · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-56` — Implement a Shape Calculator with Interfaces
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-57` — Generic Stack with Min Tracking
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-58` — Validate User Registration with Detailed Errors
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-concurrency-and-channels-59` — Fan-In: Merge Multiple Channels into One
_exercise · medium · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-60` — Parallel Sum with Goroutines
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pointers-61` — Swap Values Using Pointers
_exercise · medium · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-io-and-strings-62` — Parse Key-Value Configuration from Reader
_exercise · medium · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-63` — Build a Counter Factory with Step Control
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-64` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-65` — Merge Sorted Slices In Place
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-66` — Group Anagrams Together
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-methods-67` — Implement a Bank Account with Transaction History
_exercise · medium · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-68` — Shape Calculator with Interfaces
_exercise · medium · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-69` — Generic Stack with Min Tracking
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-70` — Retry with Exponential Backoff
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-concurrency-and-channels-71` — Fan-In: Merge Multiple Channels
_exercise · medium · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-goroutines-72` — Parallel Sum with Goroutines
_exercise · medium · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pointers-73` — Swap Values Using Pointers
_exercise · medium · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-io-and-strings-74` — Parse Key-Value Configuration from Reader
_exercise · medium · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-75` — Build a Counter Factory with Closures
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-76` — Implement a Simple Word Frequency Counter
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-77` — Rotate Slice In-Place
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-78` — Group Anagrams Together
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-methods-79` — Build a Bank Account with Transaction History
_exercise · medium · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-80` — Implement a Glob Pattern Matcher
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-slices-81` — Implement a Memory-Efficient Sliding Window Maximum
_exercise · hard · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-82` — Implement a Time-Based Key-Value Store
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-and-methods-83` — Implement a Thread-Safe LRU Cache with TTL
_exercise · hard · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-interfaces-84` — Build a Polymorphic Event System with Type Assertions
_exercise · hard · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-85` — Implement a Generic LRU Cache with Expiration
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-86` — Build a Retry Mechanism with Exponential Backoff
_exercise · hard · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-and-channels-87` — Build a Rate-Limited Worker Pool with Backpressure
_exercise · hard · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-goroutines-88` — Parallel Map with Bounded Concurrency
_exercise · hard · goroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pointers-89` — Implement a Doubly Linked List with Pointer Manipulation
_exercise · hard · pointers · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-io-and-strings-90` — Parse and Transform a Log File Format
_exercise · hard · io and strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-closures-91` — Build a Middleware Pipeline with Closures
_exercise · hard · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-92` — Implement a Regex-Like Wildcard Matcher
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-slices-93` — Implement a Memory-Efficient Sliding Window Maximum
_exercise · hard · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-94` — Implement a Thread-Safe LRU Cache with TTL
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-and-methods-95` — Implement a Thread-Safe LRU Cache with TTL
_exercise · hard · structs and methods · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-interfaces-96` — Build a Plugin System with Dynamic Dispatch
_exercise · hard · interfaces · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-97` — Build a Generic LRU Cache with Expiration
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-98` — Build a Retry Executor with Exponential Backoff
_exercise · hard · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-and-channels-99` — Build a Rate-Limited Worker Pool with Backpressure
_exercise · hard · concurrency and channels · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-haskell-handwritten

- **Course title:** Haskell Challenges
- **Language:** haskell
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-haskell-handwritten fully translated to `ru`
- [ ] challenges-haskell-handwritten fully translated to `es`
- [ ] challenges-haskell-handwritten fully translated to `fr`
- [ ] challenges-haskell-handwritten fully translated to `kr`
- [ ] challenges-haskell-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · haskell · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · haskell · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · haskell · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · haskell · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · haskell · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-11` — Sum of Positive Numbers
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-12` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-comprehensions-10` — Filter and Square Evens
_exercise · easy · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-folds-8` — Sum of Squares Using Folds
_exercise · easy · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-13` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maybe-and-either-7` — Safe Division with Maybe
_exercise · easy · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-let-and-where-9` — Calculate Circle Area with Local Bindings
_exercise · easy · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-classes-6` — Implement Eq for a Point Type
_exercise · easy · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-higher-order-functions-15` — Apply Function Twice
_exercise · easy · higher-order functions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-14` — Count Vowels with Pattern Matching
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maybe-and-either-17` — Safe Division with Maybe
_exercise · easy · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-21` — Find Maximum in List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-comprehensions-20` — Filter and Square Even Numbers
_exercise · easy · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-folds-18` — Sum of Squares Using Fold
_exercise · easy · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-let-and-where-19` — Calculate Triangle Area with Local Bindings
_exercise · easy · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-classes-16` — Implement a Custom Equality Type Class
_exercise · easy · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-23` — Extract Pair Components
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-22` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-classes-26` — Implement Equality for a Custom Type
_exercise · easy · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-folds-28` — Sum of Squares Using Fold
_exercise · easy · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maybe-and-either-27` — Safe Division with Maybe
_exercise · easy · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-24` — Count Vowels with Pattern Matching
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-higher-order-functions-25` — Apply Function N Times
_exercise · easy · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-let-and-where-29` — Calculate Tax with Let and Where
_exercise · easy · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-comprehensions-30` — Filter and Square Even Numbers
_exercise · easy · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-31` — Sum of Evens in List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-32` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-33` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-higher-order-functions-35` — Apply Function Twice
_exercise · easy · higher-order functions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-34` — Classify Shapes by Pattern Matching
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maybe-and-either-37` — Safe Division with Maybe
_exercise · easy · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-folds-38` — Sum of Squares Using Fold
_exercise · easy · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-list-comprehensions-40` — Filter and Square Even Numbers
_exercise · easy · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-classes-36` — Implement a Simple Equality Type Class
_exercise · easy · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-let-and-where-39` — Calculate Circle Properties with Local Bindings
_exercise · easy · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-1` — Partition List by Predicate
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-2` — Balanced Bracket Subsequences
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-3` — Tuple Zipper with Custom Combine
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-5` — Function Composer with Argument Transformation
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maybe-and-either-7` — Chain Optional Parsers with Either Error
_exercise · medium · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-classes-6` — Implement a Printable Type Class with Instances
_exercise · medium · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-4` — Parse and Evaluate Simple Arithmetic Expressions
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-let-and-where-9` — Nested Scopes: Calculate Complex Interest
_exercise · medium · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-folds-8` — Implement scanl Using foldr
_exercise · medium · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-list-comprehensions-10` — Pythagorean Triples via List Comprehension
_exercise · medium · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-12` — Run-Length Encoding
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-11` — Interleave Two Lists with Custom Merge Function
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-13` — Tuple Rotation and Element Extraction
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-14` — Pattern Match Binary Tree Paths
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maybe-and-either-17` — Safe Division with Error Context
_exercise · medium · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-15` — Implement Custom Fold with Early Exit
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-classes-16` — Implement a Numeric Ring Type Class
_exercise · medium · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-let-and-where-19` — Refactor Expression Using Let and Where
_exercise · medium · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-folds-18` — Implement scanl Using foldr
_exercise · medium · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-22` — Run-Length Encoding with Compression
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-list-comprehensions-20` — Pythagorean Triples in Range
_exercise · medium · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-24` — Flatten Nested List Structure
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-21` — Longest Increasing Subsequence Length
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-23` — Tuple Zipper with Custom Combiner
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-25` — Custom Filter with Predicate Combinator
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-list-comprehensions-30` — Pythagorean Triples in Range
_exercise · medium · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maybe-and-either-27` — Parse Configuration with Maybe and Either
_exercise · medium · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-31` — Group Consecutive Duplicates
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-let-and-where-29` — Calculate Tax Brackets with Local Bindings
_exercise · medium · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-folds-28` — Implement scanl Using foldr
_exercise · medium · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-classes-26` — Implement a Monoid for RLE Compression
_exercise · medium · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-32` — Run-Length Encode a String
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-classes-36` — Implement a Monoid for Custom Point Type
_exercise · medium · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-35` — Custom Filter with Predicate Builder
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-34` — Binary Tree Path Sum Validator
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-33` — Tuple Rotation and Aggregation
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-list-comprehensions-40` — Pythagorean Triples in Range
_exercise · medium · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-let-and-where-39` — Nested Scope Calculator
_exercise · medium · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maybe-and-either-37` — Parse Configuration with Validation
_exercise · medium · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-folds-38` — Implement scanl Using foldr
_exercise · medium · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-1` — Implement Merge Sort with Custom Comparator
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-4` — Pattern-Match a Mini Expression Language
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-classes-6` — Custom Numeric Type with Show and Num Instances
_exercise · hard · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-2` — Longest Common Subsequence with Reconstruction
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-3` — N-Tuple Zipper with Custom Combining Function
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-folds-8` — Implement scanl and scanr Using Only foldr
_exercise · hard · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-functions-5` — Build a Custom Monad Transformer Stack
_exercise · hard · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maybe-and-either-7` — Compose Validations with Either and Maybe
_exercise · hard · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-let-and-where-9` — Refactor Nested Expression Tree with Local Bindings
_exercise · hard · let and where · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-12` — Smallest Rotation with Lexicographic Order
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-list-comprehensions-10` — Prime Factorization Decomposition with List Comprehensions
_exercise · hard · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-11` — Merge K Sorted Lists
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-13` — Nested Tuple Path Extractor
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-functions-15` — Build a Memoization Combinator with Expiring Cache
_exercise · hard · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-classes-16` — Implement a Monoidal Fold for Binary Trees
_exercise · hard · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-14` — Implement a Pattern Matcher for Algebraic Types
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-folds-18` — Implement scanl via foldr
_exercise · hard · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-list-comprehensions-20` — Generate Pythagorean Triples with Custom Predicate
_exercise · hard · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maybe-and-either-17` — Compose Safe Parsers with Either and Maybe
_exercise · hard · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-let-and-where-19` — Nested Scope Expression Evaluator
_exercise · hard · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-21` — Merge K Sorted Lists
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-23` — Nested Tuple Path Extraction
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-24` — Structural Pattern Matcher for Algebraic Expressions
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-22` — Longest Common Subsequence of Multiple Strings
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-functions-25` — Build a Memoization Combinator with Cache Expiry
_exercise · hard · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maybe-and-either-27` — Safe Pipeline with Either and Maybe
_exercise · hard · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-folds-28` — Implement scanl Using foldr
_exercise · hard · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-let-and-where-29` — Refactor Nested Let Expressions
_exercise · hard · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-31` — Longest Increasing Subsequence Length
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-classes-26` — Implement a Generic Serializer with Type Classes
_exercise · hard · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-list-comprehensions-30` — Partitioned Pythagorean Triples with Constraints
_exercise · hard · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-32` — Longest Common Subsequence with Reconstruction
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-34` — Parse and Evaluate Arithmetic Expression Trees
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-33` — Nested Tuple Path Finder
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-functions-35` — Build a Lazy Stream Transformer Pipeline
_exercise · hard · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-classes-36` — Implement a Generic Binary Search Tree with Ord
_exercise · hard · type classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-folds-38` — Implement scanl Using foldr
_exercise · hard · folds · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maybe-and-either-37` — Chained Validation Pipeline with Maybe and Either
_exercise · hard · Maybe and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-list-comprehensions-40` — Matrix Spiral Traversal via List Comprehensions
_exercise · hard · list comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-let-and-where-39` — Refactor Nested Lets into Where Clauses
_exercise · hard · let and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-java-handwritten

- **Course title:** Java Challenges
- **Language:** java
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-java-handwritten fully translated to `ru`
- [ ] challenges-java-handwritten fully translated to `es`
- [ ] challenges-java-handwritten fully translated to `fr`
- [ ] challenges-java-handwritten fully translated to `kr`
- [ ] challenges-java-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-arrays-1` — Sum an Int Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-2` — Find Maximum in an Array
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-3` — Array Contains a Value
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-4` — Reverse an Int Array In Place
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-1` — Compute String Length
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Detect a Palindrome
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Count a Character in a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arraylist-1` — Build a List from Varargs
_exercise · easy · arraylist · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arraylist-2` — Remove All Occurrences of a Value
_exercise · easy · arraylist · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arraylist-3` — Sum an ArrayList of Integers
_exercise · easy · arraylist · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arraylist-4` — Filter Positive Numbers
_exercise · easy · arraylist · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashmap-1` — Count Word Occurrences
_exercise · easy · hashmap · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashmap-2` — Get With Default
_exercise · easy · hashmap · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashmap-3` — Check if Map Has a Key
_exercise · easy · hashmap · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashmap-4` — Invert a HashMap
_exercise · easy · hashmap · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-1` — Sign of an Integer
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-2` — FizzBuzz Returning a String
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-3` — Classify a Triangle
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-4` — Leap Year Check
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-1` — Count Down Numbers
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-2` — Sum 1 to N
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-3` — Double Every Element
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-4` — Count Vowels
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-1` — Compute Factorial
_exercise · easy · math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-2` — Absolute Value Without Math.abs
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-3` — Detect Even Numbers
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-4` — Integer Power Without Math.pow
_exercise · easy · math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-1` — Overload Add for Int and Double
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-2` — Recursive Sum to N
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-3` — Overload Greet
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-methods-4` — Recursive GCD
_exercise · easy · methods · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-1` — Define a Point Class
_exercise · easy · objects · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-2` — Counter Object
_exercise · easy · objects · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-3` — Rectangle Area
_exercise · easy · objects · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-4` — Person With Name and Age
_exercise · easy · objects · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exceptions-1` — Reject Negative Inputs
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exceptions-2` — Safe Parse Int With Default
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exceptions-3` — Safe Array Access
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-exceptions-4` — Divide With Guard
_exercise · easy · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-1` — Generic Pair Container
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-2` — Generic Max with Comparable Bound
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-3` — Generic Stack
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-4` — Bounded Sum of Numbers
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-streams-1` — Stream Filter Map Collect
_exercise · medium · streams · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-streams-2` — Reduce to Product
_exercise · medium · streams · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-streams-3` — Group Strings by Length
_exercise · medium · streams · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-streams-4` — Count Matching with Stream
_exercise · medium · streams · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-1` — Group Words by First Letter
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-2` — Sort People by Age
_exercise · medium · collections · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-3` — Partition by Predicate
_exercise · medium · collections · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-4` — Word Frequency Map
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functional-1` — Apply Predicate to Filter
_exercise · medium · functional · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functional-2` — Apply Function to Each
_exercise · medium · functional · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functional-3` — Zip with BiFunction
_exercise · medium · functional · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functional-4` — Compose Two Functions
_exercise · medium · functional · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inheritance-1` — Shape Hierarchy with area()
_exercise · medium · inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inheritance-2` — Animal Speak Hierarchy
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inheritance-3` — Employee Salary Override
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-inheritance-4` — Vehicle Interface + Impls
_exercise · medium · inheritance · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-1` — Custom Checked Exception
_exercise · medium · exceptions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-2` — Custom Unchecked Validation
_exercise · medium · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-3` — Try-with-resources AutoCloseable
_exercise · medium · exceptions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-exceptions-4` — Catch and Translate Exception
_exercise · medium · exceptions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-1` — Rock Paper Scissors Enum
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-2` — Days Weekend Check
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-3` — Enum with Constructor Field
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-4` — TrafficLight Next State
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comparators-1` — Sort by Length then Alpha
_exercise · medium · comparators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comparators-2` — Reverse Numeric Sort
_exercise · medium · comparators · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comparators-3` — Sort Products by Price Then Name
_exercise · medium · comparators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comparators-4` — Sort Points by Distance from Origin
_exercise · medium · comparators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nested-1` — Builder Pattern for User
_exercise · medium · nested · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nested-2` — Nested Node Data Holder
_exercise · medium · nested · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nested-3` — URL Builder
_exercise · medium · nested · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nested-4` — Result Holder Class
_exercise · medium · nested · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-1` — Point Record + Distance
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-2` — KeyValue Record List
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-3` — Range Record with Compact Validator
_exercise · medium · records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-records-4` — Record Pattern Area
_exercise · medium · records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-1` — LRU Cache with HashMap + Doubly Linked List
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-2` — Integer Min-Heap on an ArrayList
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-3` — Prefix Trie with insert / search / startsWith
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-4` — Fixed-Capacity Ring Buffer
_exercise · hard · datastructures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-1` — Binary Search Tree: insert, contains, inorder
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-2` — Iterative Inorder Traversal with a Stack
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-3` — Generic N-ary Tree with Depth-First Collect
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-4` — AVL Balance-Factor Checker
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-1` — In-Place Quicksort on int[]
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-2` — Top-Down Mergesort
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-3` — Binary Search lowerBound / upperBound
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-4` — KMP Substring Search
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — Longest Increasing Subsequence Length
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Levenshtein Edit Distance
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Coin Change Minimum Coins
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Longest Palindromic Substring
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-streams-1` — Top-N Values per Group via Stream Pipeline
_exercise · hard · streams · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-streams-2` — Partition Then Aggregate Each Side
_exercise · hard · streams · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-streams-3` — Reduce to Min, Max, and Sum in One Pass
_exercise · hard · streams · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-streams-4` — Average of Values per Group, Sorted Keys
_exercise · hard · streams · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-1` — Generic Priority Queue Bounded by Comparable
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-2` — Generic Fixed-Size Cache<K,V>
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-3` — Generic Directed Graph with BFS
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-4` — Generic Pair with equals, hashCode, and Swap
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-1` — Compose Arbitrary List of Unary Functions
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-2` — Curry a BiFunction into Function<A, Function<B, R>>
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-3` — Retry a Supplier with Attempt Limit
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-4` — Memoize a Unary Function
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-1` — Sequential CompletableFuture Pipeline
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-2` — Parallel Sum via ExecutorService
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-3` — Thread-Safe Counter with AtomicInteger
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-4` — Combine Two CompletableFutures
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-exceptions-1` — Custom Exception Hierarchy with Dispatch
_exercise · hard · exceptions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-exceptions-2` — Aggregate Multiple Failures into One Exception
_exercise · hard · exceptions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-exceptions-3` — Retry a Callable Raising Checked Exceptions
_exercise · hard · exceptions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-exceptions-4` — Find Root Cause of a Throwable
_exercise · hard · exceptions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-1` — Observer / Subject Pub-Sub
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-2` — Turnstile Finite State Machine
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-3` — Type-Keyed EventBus
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-4` — Command Queue with Undo
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-javascript-handwritten

- **Course title:** Javascript Challenges
- **Language:** javascript
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-javascript-handwritten fully translated to `ru`
- [ ] challenges-javascript-handwritten fully translated to `es`
- [ ] challenges-javascript-handwritten fully translated to `fr`
- [ ] challenges-javascript-handwritten fully translated to `kr`
- [ ] challenges-javascript-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-arrays-1` — Sum an Array of Numbers
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-2` — Filter Even Numbers
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-3` — Find the Largest Number
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-4` — Check Array Includes Value
_exercise · easy · arrays · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-1` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Detect a Palindrome
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Repeat a String N Times
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-1` — Get Object Keys
_exercise · easy · objects · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-2` — Sum Object Values
_exercise · easy · objects · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-3` — Lookup with Default
_exercise · easy · objects · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-4` — Count Word Occurrences
_exercise · easy · objects · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-1` — Check Even or Odd
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-2` — FizzBuzz Single Number
_exercise · easy · numbers · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-3` — Square a Number
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-4` — Absolute Value
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-1` — Sign of a Number
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-2` — Classify a Grade
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-3` — Min of Two with Ternary
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-4` — Leap Year Check
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-1` — Count Down to Zero
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-2` — Sum 1 to N with a Loop
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-3` — Count Truthy Items
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-4` — Uppercase Each String
_exercise · easy · loops · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-destructuring-1` — Swap Two Values
_exercise · easy · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-destructuring-2` — Get First and Last
_exercise · easy · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-destructuring-3` — Extract Object Fields
_exercise · easy · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-destructuring-4` — Default via Destructuring
_exercise · easy · destructuring · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-spread-1` — Concatenate Two Arrays
_exercise · easy · spread · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-spread-2` — Shallow Copy an Array
_exercise · easy · spread · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-spread-3` — Sum via Rest Parameters
_exercise · easy · spread · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-spread-4` — Merge Two Objects
_exercise · easy · spread · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-truthy-1` — Filter Out Falsy Values
_exercise · easy · truthy-falsy · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-truthy-2` — Provide a Default with ??
_exercise · easy · truthy-falsy · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-truthy-3` — Logical OR Default
_exercise · easy · truthy-falsy · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-truthy-4` — To Boolean
_exercise · easy · truthy-falsy · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-typecheck-1` — Detect a String
_exercise · easy · typecheck · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-typecheck-2` — Detect an Array
_exercise · easy · typecheck · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-typecheck-3` — Detect a Number (not NaN)
_exercise · easy · typecheck · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-typecheck-4` — Safe Length of String or Array
_exercise · easy · typecheck · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-1` — Build a Counter Factory
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-2` — Build a Memoizer
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-3` — Implement Partial Application
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-4` — Once-Only Function Wrapper
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hof-1` — Compose Functions Right-to-Left
_exercise · medium · higher-order · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hof-2` — Pipe Functions Left-to-Right
_exercise · medium · higher-order · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hof-3` — Synchronous Throttle Counter
_exercise · medium · higher-order · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hof-4` — Apply N Times
_exercise · medium · higher-order · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-1` — Group Words by Length
_exercise · medium · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-2` — Top-N by Property
_exercise · medium · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-3` — FlatMap Words from Sentences
_exercise · medium · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-4` — Running Average
_exercise · medium · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-1` — Promise Chain with Catch
_exercise · medium · promises · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-2` — Promise.all Sum
_exercise · medium · promises · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-3` — AllSettled Partition
_exercise · medium · promises · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-4` — Resolve to Default on Reject
_exercise · medium · promises · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-async-1` — Sequential vs Parallel Sum
_exercise · medium · async · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-async-2` — Retry on Failure
_exercise · medium · async · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-async-3` — Map Async with Concurrency
_exercise · medium · async · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-async-4` — Timeout an Async Call
_exercise · medium · async · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-1` — Fibonacci Generator
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-2` — Range Iterable
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-3` — Lazy Map Generator
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-4` — Take First N from Iterable
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapset-1` — Frequency Counter with Map
_exercise · medium · map-set · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapset-2` — Set Intersection
_exercise · medium · map-set · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapset-3` — Ordered Unique Keys
_exercise · medium · map-set · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-mapset-4` — Find Duplicates
_exercise · medium · map-set · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-destructure-1` — Pick Properties
_exercise · medium · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-destructure-2` — Deep Update Without Mutation
_exercise · medium · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-destructure-3` — Merge with Defaults
_exercise · medium · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-destructure-4` — Swap and Rest
_exercise · medium · destructuring · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-1` — Extract All Hashtags
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-2` — Replace with Callback
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-3` — Validate ISO Date
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-4` — Parse Key=Value Pairs
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-1` — Rectangle with Getters
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-2` — Static Math Helpers
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-3` — Dog Inherits from Animal
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-4` — Stack Class
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-1` — Build an LRU Cache
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-2` — Build a Trie with Prefix Search
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-3` — Build a Min-Heap
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-4` — Build a Doubly Linked List
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graph-1` — BFS Shortest Path in Unweighted Graph
_exercise · hard · graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graph-2` — DFS Topological Sort
_exercise · hard · graph · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-1` — Iterative In-Order Traversal
_exercise · hard · tree · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-2` — Flatten N-ary Tree to Array
_exercise · hard · tree · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — Longest Common Substring
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Edit Distance (Levenshtein)
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Minimum Coins for Amount
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Climb Stairs with Variable Step Sizes
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Longest Palindromic Substring
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-2` — Group Anagrams
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-3` — Wildcard Pattern Match
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-4` — Run-Length Encode and Decode
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-1` — Curry an N-Arity Function
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-2` — Deep Clone Plain Values
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-3` — Deep Equality Check
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-4` — Deep Freeze an Object
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-1` — Implement Promise.all
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-2` — Implement Promise.allSettled
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-3` — Sequential Run with Early Exit
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-async-4` — Retry With Exponential Backoff
_exercise · hard · async · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generators-1` — Range Generator with Step
_exercise · hard · generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generators-2` — Zip Generator
_exercise · hard · generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generators-3` — Take and Drop Generators
_exercise · hard · generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generators-4` — Infinite Fibonacci Generator
_exercise · hard · generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-1` — Build an Observable Subject
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-2` — Build an EventEmitter
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-3` — Build a Finite State Machine
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-4` — Min Priority Queue
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-1` — Mini JSON Parser (ints, strings, arrays)
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-2` — Calculator with Parentheses
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-3` — Parse Query String with Arrays
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-parsing-4` — Parse CSV With Quoted Fields
_exercise · hard · parsing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-state-1` — Build a Redux-Style Store
_exercise · hard · state · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-state-2` — Build an Undo/Redo Stack
_exercise · hard · state · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-state-3` — Memoized Selector
_exercise · hard · state · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-state-4` — Build a Ring Buffer
_exercise · hard · state · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-kotlin-handwritten

- **Course title:** Kotlin Challenges
- **Language:** kotlin
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-kotlin-handwritten fully translated to `ru`
- [ ] challenges-kotlin-handwritten fully translated to `es`
- [ ] challenges-kotlin-handwritten fully translated to `fr`
- [ ] challenges-kotlin-handwritten fully translated to `kr`
- [ ] challenges-kotlin-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-collections-1` — Sum a List of Ints
_exercise · easy · collections · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-collections-2` — Find Max in a List
_exercise · easy · collections · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-collections-3` — Filter Even Numbers
_exercise · easy · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-collections-4` — Check List Contains Value
_exercise · easy · collections · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-1` — String Length
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Detect a Palindrome
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Count a Character
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-1` — Count Word Occurrences
_exercise · easy · maps · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-2` — Look Up With Default
_exercise · easy · maps · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-3` — Map Contains Key
_exercise · easy · maps · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-4` — Invert a Map
_exercise · easy · maps · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-nullables-1` — Default With Elvis
_exercise · easy · nullables · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-nullables-2` — Safe Uppercase
_exercise · easy · nullables · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-nullables-3` — Force-Unwrap First Element
_exercise · easy · nullables · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-nullables-4` — Coalesce to Zero
_exercise · easy · nullables · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-data-classes-1` — Define a Point Data Class
_exercise · easy · data-classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-data-classes-2` — Person Full Name
_exercise · easy · data-classes · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-data-classes-3` — Copy With Modified Field
_exercise · easy · data-classes · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-data-classes-4` — Destructure a Pair Field
_exercise · easy · data-classes · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-when-1` — Classify a Number's Sign
_exercise · easy · when · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-when-2` — FizzBuzz Single Value
_exercise · easy · when · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-when-3` — Day Name From Number
_exercise · easy · when · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-when-4` — Classify a Char
_exercise · easy · when · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-1` — Sum of 1..n
_exercise · easy · ranges · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-2` — In Inclusive Range
_exercise · easy · ranges · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-3` — Count Down to List
_exercise · easy · ranges · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-4` — Step Through Evens
_exercise · easy · ranges · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lambdas-1` — Sort Strings by Length
_exercise · easy · lambdas · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lambdas-2` — Square Filtered Positives
_exercise · easy · lambdas · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lambdas-3` — Apply a Function Twice
_exercise · easy · lambdas · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lambdas-4` — Sum of List by Selector
_exercise · easy · lambdas · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extensions-1` — Int.isEven Extension
_exercise · easy · extensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extensions-2` — String.shout Extension
_exercise · easy · extensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extensions-3` — Int.squared Extension
_exercise · easy · extensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-extensions-4` — List<Int>.average Extension
_exercise · easy · extensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-1` — Factorial
_exercise · easy · math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-2` — Absolute Value
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-3` — Integer Power
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-4` — Is Even
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-1` — Generic Stack of T
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-2` — Generic Min With Comparable Bound
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-3` — Generic Pair Swap
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-4` — Generic Box With Number Bound
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-1` — Result Sealed Class With when
_exercise · medium · sealed · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-2` — Shape Area With when
_exercise · medium · sealed · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-3` — Tree Sum With Recursion
_exercise · medium · sealed · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sealed-4` — Expression Evaluator
_exercise · medium · sealed · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extensions-1` — Extension With also Side-effect Log
_exercise · medium · extensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extensions-2` — String squeeze via run + buildString
_exercise · medium · extensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extensions-3` — List<Int>.statsApply
_exercise · medium · extensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-extensions-4` — withDefault: Map<String,Int> orZero
_exercise · medium · extensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-1` — Group Then Sum by Key
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-2` — Partition Evens vs Odds
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-3` — Fold Into Running Max List
_exercise · medium · collections · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-4` — Group Words by Length, Sorted
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sequences-1` — Sequence of Squares With yield
_exercise · medium · sequences · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sequences-2` — Lazy Fibonacci Take
_exercise · medium · sequences · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sequences-3` — Lazy Filter Then Map
_exercise · medium · sequences · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-sequences-4` — Sequence Sum Until Threshold
_exercise · medium · sequences · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-data-1` — Immutable Update via copy
_exercise · medium · data · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-data-2` — Destructure Into Tuple
_exercise · medium · data · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-data-3` — Bulk Increment Ages
_exercise · medium · data · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-data-4` — Find And Replace by Id
_exercise · medium · data · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nullables-1` — Safe Length Or Default
_exercise · medium · nullables · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nullables-2` — First Non-Null Among Three
_exercise · medium · nullables · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nullables-3` — Deep Field Lookup
_exercise · medium · nullables · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-nullables-4` — Parse Or Null Sum
_exercise · medium · nullables · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-reified-1` — Reified filterIsInstance Helper
_exercise · medium · reified · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-reified-2` — Reified Type Name
_exercise · medium · reified · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-reified-3` — Reified isInstance Check
_exercise · medium · reified · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-reified-4` — Reified Map Cast
_exercise · medium · reified · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegated-1` — Lazy Expensive Init
_exercise · medium · delegated · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegated-2` — Observable-Style Setter
_exercise · medium · delegated · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegated-3` — Vetoable Even Setter
_exercise · medium · delegated · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-delegated-4` — Map-Backed Properties
_exercise · medium · delegated · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-1` — Color Hex Codes via Enum
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-2` — Day-of-Week isWeekend
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-3` — Priority With Numeric Order
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-4` — Status From Code
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-1` — Implement an LRU Cache
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-2` — Min-Heap Priority Queue
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-3` — Build a Trie with Prefix Search
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-4` — Fixed-Capacity Ring Buffer
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-1` — BFS Shortest Path in Unweighted Graph
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-2` — Topological Sort via DFS
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-3` — Iterative Binary-Tree Inorder Traversal
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-4` — Flatten an N-ary Tree (Pre-order)
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-1` — Generic Quicksort
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-2` — Bottom-Up Mergesort
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-3` — Binary Search: First >= Target
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algorithms-4` — KMP Substring Search
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — Longest Increasing Subsequence Length
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Levenshtein Edit Distance
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Coin Change — Minimum Coins
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Longest Palindromic Substring
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-1` — Tiny Regex: Literal, Dot, Star
_exercise · hard · sealed · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-2` — Arithmetic Expression Evaluator (AST)
_exercise · hard · sealed · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-3` — Vending Machine State Machine
_exercise · hard · sealed · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sealed-4` — Turnstile FSM with History
_exercise · hard · sealed · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-1` — Generic Priority Queue
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-2` — Memoize with Generic Key/Value
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-3` — Generic Graph with Covariant Read
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-4` — Type-Safe Heterogeneous Container
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sequences-1` — Lazy Fibonacci Sequence
_exercise · hard · sequences · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sequences-2` — Lazy Chain: filter + map + take
_exercise · hard · sequences · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sequences-3` — Custom Sequence: Chunked Windowing
_exercise · hard · sequences · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-sequences-4` — Primes: Lazy Trial Division
_exercise · hard · sequences · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-coroutines-1` — Bounded Channel via ArrayDeque
_exercise · hard · coroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-coroutines-2` — Priority Scheduler
_exercise · hard · coroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-coroutines-3` — Event Log Replay with Deterministic Order
_exercise · hard · coroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-coroutines-4` — Round-Robin Task Queue
_exercise · hard · coroutines · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-1` — Observable with Unsubscribe
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-2` — Type-Safe Event Bus
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-3` — Mediator: Chat Room
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-patterns-4` — Coordinator: Multi-Step Transaction
_exercise · hard · patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-1` — Compose + Pipe
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-2` — Deep Equality over Nested Maps
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-3` — Deep Clone of Nested Structures
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-4` — Curry a 3-Argument Function
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-lua-handwritten

- **Course title:** Lua Challenges
- **Language:** lua
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-lua-handwritten fully translated to `ru`
- [ ] challenges-lua-handwritten fully translated to `es`
- [ ] challenges-lua-handwritten fully translated to `fr`
- [ ] challenges-lua-handwritten fully translated to `kr`
- [ ] challenges-lua-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · lua · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · lua · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · lua · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · lua · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · lua · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tables-array-part-12` — Sum of Array Elements
_exercise · easy · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-8` — Calculate Circle Area
_exercise · easy · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-table-sort-10` — Sort Numbers in Descending Order
_exercise · easy · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-11` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-patterns-6` — Count Vowels in a String
_exercise · easy · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-7` — Sum Even Numbers in Range
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tables-hash-part-13` — Count Character Frequencies
_exercise · easy · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-coercion-9` — Normalize Mixed Input to Number
_exercise · easy · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-17` — Count Even Numbers in a Table
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-18` — Calculate Triangle Area
_exercise · easy · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-functions-and-closures-15` — Create a Counter Closure
_exercise · easy · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-patterns-16` — Count Vowels in String
_exercise · easy · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-metatables-14` — Implement a Read-Only Table with Metatables
_exercise · easy · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-table-sort-20` — Sort Numbers in Descending Order
_exercise · easy · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-coercion-19` — Type Coercion: Number to String Concatenation
_exercise · easy · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-21` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tables-array-part-22` — Sum of Positive Numbers
_exercise · easy · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-patterns-26` — Count Vowels in a String
_exercise · easy · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-functions-and-closures-25` — Build a Counter with Closures
_exercise · easy · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tables-hash-part-23` — Count Character Frequencies
_exercise · easy · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-28` — Calculate Circle Area
_exercise · easy · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-27` — Sum Elements Using an Iterator
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-metatables-24` — Implement a Read-Only Table
_exercise · easy · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-coercion-29` — Coerce to Number Safely
_exercise · easy · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-31` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tables-array-part-32` — Sum Array Elements
_exercise · easy · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-functions-and-closures-35` — Build a Counter Factory
_exercise · easy · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-table-sort-30` — Sort Table by Age
_exercise · easy · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tables-hash-part-33` — Count Character Frequencies
_exercise · easy · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-metatables-34` — Create a Read-Only Table
_exercise · easy · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-patterns-36` — Extract Words Starting With Uppercase
_exercise · easy · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-38` — Calculate Circle Area
_exercise · easy · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-table-sort-40` — Sort Numbers in a Table
_exercise · easy · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-type-coercion-39` — Stringify Numbers
_exercise · easy · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-37` — Sum Even Numbers from Iterator
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-array-part-2` — Rotate Array Elements Right by K Positions
_exercise · medium · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-hash-part-3` — Count Character Frequency
_exercise · medium · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functions-and-closures-5` — Build a Counter Factory with Custom Step
_exercise · medium · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-metatables-4` — Implement a Read-Only Table with Metatables
_exercise · medium · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-math-8` — Prime Factorization with Exponents
_exercise · medium · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-patterns-6` — Extract Quoted Strings with Escapes
_exercise · medium · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-7` — Custom Range Iterator with Step
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-table-sort-10` — Sort Table by Custom Comparator
_exercise · medium · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-array-part-12` — Rotate Array Right by K Steps
_exercise · medium · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-11` — Balanced Bracket Validator
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-hash-part-13` — Count Word Frequency in Text
_exercise · medium · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-coercion-9` — Build a Type-Safe Coercion Function
_exercise · medium · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-metatables-14` — Implement a Read-Only Table with Metatables
_exercise · medium · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functions-and-closures-15` — Counter Factory with Memory
_exercise · medium · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-patterns-16` — Extract Balanced Parentheses Groups
_exercise · medium · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-21` — Balanced Bracket Validator
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-17` — Custom Range Iterator with Step
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-math-18` — Prime Factorization with Exponents
_exercise · medium · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-table-sort-20` — Sort Table by Multiple Criteria
_exercise · medium · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-coercion-19` — Flexible Sum Calculator
_exercise · medium · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-array-part-22` — Rotate Array Elements
_exercise · medium · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-metatables-24` — Implement a Read-Only Table with Metatables
_exercise · medium · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functions-and-closures-25` — Build a Counter Factory with Reset
_exercise · medium · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-hash-part-23` — Merge Nested Tables with Conflict Resolution
_exercise · medium · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-patterns-26` — Extract Quoted Substrings
_exercise · medium · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-27` — Implement a Sliding Window Iterator
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-math-28` — Prime Factorization with Powers
_exercise · medium · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-coercion-29` — Flexible Number Parser
_exercise · medium · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-table-sort-30` — Sort Table by Multiple Keys
_exercise · medium · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-hash-part-33` — Frequency Counter with Threshold Filter
_exercise · medium · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functions-and-closures-35` — Build a Counter Factory with Step Control
_exercise · medium · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tables-array-part-32` — Rotate Array Elements
_exercise · medium · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-31` — Find the Longest Palindromic Substring
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-metatables-34` — Lazy Evaluation Table with Memoization
_exercise · medium · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-patterns-36` — Extract Version Numbers from Text
_exercise · medium · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-37` — Custom Range Iterator with Step
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-math-38` — Calculate Digital Root
_exercise · medium · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-type-coercion-39` — Type-Safe Addition
_exercise · medium · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-table-sort-40` — Sort Table by Multiple Criteria
_exercise · medium · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-array-part-2` — Efficient In-Place Array Rotation
_exercise · hard · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Minimal Edit Distance with Operations
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-hash-part-3` — Implement a Frequency-Based LRU Cache
_exercise · hard · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functions-and-closures-5` — Build a Memoizing Factory with Cache Eviction
_exercise · hard · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-patterns-6` — Balanced Bracket Matcher with Wildcards
_exercise · hard · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-7` — Lazy Fibonacci Stream with Skip and Take
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-8` — Compute Modular Exponentiation with Primality Check
_exercise · hard · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-metatables-4` — Implement a Lazy-Evaluated Spreadsheet with Metatables
_exercise · hard · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-coercion-9` — Custom Type Coercion System
_exercise · hard · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-11` — Longest Common Subsequence with Reconstruction
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-array-part-12` — Implement In-Place Quicksort on Array Part
_exercise · hard · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-table-sort-10` — Custom Multi-Key Table Sort with Stable Ordering
_exercise · hard · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-patterns-16` — Build a Mini Regex Engine
_exercise · hard · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-hash-part-13` — Implement a Least Recently Used (LRU) Cache
_exercise · hard · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-metatables-14` — Lazy Infinite Sequence with Memoization
_exercise · hard · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functions-and-closures-15` — Build a Memoization Decorator with Cache Control
_exercise · hard · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-18` — Prime Factorization with Multiplicities
_exercise · hard · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-21` — Minimal String Edit Distance with Operations
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-coercion-19` — Implement Lua-Style Type Coercion Evaluator
_exercise · hard · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-17` — Lazy Cartesian Product Iterator
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-array-part-22` — Sparse Array Compactor with Gap Detection
_exercise · hard · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-table-sort-20` — Stable Multi-Key Table Sort with Custom Comparators
_exercise · hard · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-metatables-24` — Implement a Lazy-Evaluation Table with Metatable Chaining
_exercise · hard · metatables · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functions-and-closures-25` — Build a Memoization Factory with Cache Expiry
_exercise · hard · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-hash-part-23` — Implement a Frequency-Based LRU Cache
_exercise · hard · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-patterns-26` — Build a Regex-Style Pattern Matcher
_exercise · hard · string patterns · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-27` — Custom Iterator with Stateful Filtering
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-28` — Fast Modular Exponentiation with Matrix Powers
_exercise · hard · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-array-part-32` — Implement In-Place Array Rotation by K Positions
_exercise · hard · tables (array part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-31` — Parse and Evaluate Nested Template Strings
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-table-sort-30` — Multi-Key Stable Sort with Custom Comparators
_exercise · hard · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-coercion-29` — Type Coercion State Machine
_exercise · hard · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functions-and-closures-35` — Build a Memoization Factory with Cache Eviction
_exercise · hard · functions and closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-37` — Custom Iterator with Stateful Filtering
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tables-hash-part-33` — Implement a Frequency-Based LRU Cache
_exercise · hard · tables (hash part) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-metatables-34` — Implement a Lazy-Evaluated Expression Tree with Metatables
_exercise · hard · metatables · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-table-sort-40` — Topological Sort with Cycle Detection
_exercise · hard · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-type-coercion-39` — Implement Lua-Style Coercion Evaluator
_exercise · hard · type coercion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-math-38` — Prime Factorization with Pollard's Rho
_exercise · hard · math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-table-sort-40-2` — Stable Multi-Key Table Sort
_exercise · hard · table sort · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-move-handwritten

- **Course title:** Move Challenges
- **Language:** move
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-move-handwritten fully translated to `ru`
- [ ] challenges-move-handwritten fully translated to `es`
- [ ] challenges-move-handwritten fully translated to `fr`
- [ ] challenges-move-handwritten fully translated to `kr`
- [ ] challenges-move-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · move · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-8` — Write Basic Unit Tests
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-primitives-and-arithmetic-11` — Calculate Circle Area
_exercise · easy · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-6` — Create a Simple Counter Module
_exercise · easy · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-13` — Create and Access a Point Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-9` — Count UTF-8 Characters in a String
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-12` — Sum Elements in a Vector
_exercise · easy · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-events-7` — Emit a Transfer Event
_exercise · easy · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-10` — Calculate Safe Average of Two Numbers
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-18` — Write Basic Assertion Tests
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-events-17` — Emit a Transfer Event
_exercise · easy · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-primitives-and-arithmetic-21` — Calculate Triangle Area
_exercise · easy · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-20` — Sum of First N Natural Numbers
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-resources-14` — Transfer Coins Between Accounts
_exercise · easy · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-abilities-key-store-copy-drop-15` — Store and Retrieve a User Profile
_exercise · easy · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-16` — Create a Simple Counter Module
_exercise · easy · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-19` — Count Emoji in UTF-8 String
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-22` — Sum Vector Elements
_exercise · easy · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-23` — Create and Access a Point Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-28` — Write Basic Tests for a Counter Module
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-26` — Define a Simple Counter Module
_exercise · easy · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-abilities-key-store-copy-drop-25` — Store and Retrieve a Counter with Key Ability
_exercise · easy · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-events-27` — Emit Transfer Event
_exercise · easy · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-30` — Calculate Average of Three Numbers
_exercise · easy · u64 math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-resources-24` — Create and Destroy a Coin Resource
_exercise · easy · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-29` — Count Vowels in UTF-8 String
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-primitives-and-arithmetic-31` — Calculate Circle Area
_exercise · easy · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-32` — Sum of Vector Elements
_exercise · easy · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-33` — Create a Point Struct with Distance Method
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-resources-34` — Store and Retrieve a Counter Resource
_exercise · easy · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-abilities-key-store-copy-drop-35` — Create a Storable Asset with Key Ability
_exercise · easy · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-36` — Create a Simple Counter Module
_exercise · easy · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-events-37` — Emit a Simple Counter Event
_exercise · easy · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-40` — Calculate Sum of Squares
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-39` — Count UTF-8 Characters in a String
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-38` — Write Tests for a Simple Addition Function
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-and-arithmetic-1` — Fixed-Point Decimal Division
_exercise · medium · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-2` — Rotate Vector Elements by K Positions
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-8` — Test Double Validation
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-6` — Implement a Token Vault with Access Control
_exercise · medium · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-resources-4` — Implement a Simple Token Vault with Deposit and Withdraw
_exercise · medium · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abilities-key-store-copy-drop-5` — Resource Registry with Abilities
_exercise · medium · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-events-7` — Event-Driven Token Transfer Log
_exercise · medium · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-3` — Build a Generic Priority Queue with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-10` — Compute Factorial Modulo Prime
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-9` — UTF-8 Byte Length Calculator
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-and-arithmetic-11` — Compute Fixed-Point Multiplication
_exercise · medium · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-12` — Sliding Window Maximum
_exercise · medium · vectors · parts: title, body_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abilities-key-store-copy-drop-15` — Implement a Capability-Based Registry
_exercise · medium · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-13` — Implement a Generic Stack with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-16` — Create a Simple Access Control Module
_exercise · medium · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-events-17` — Event-Driven Transfer Logger
_exercise · medium · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-resources-14` — Implement a Simple Token Vault with Deposit and Withdraw
_exercise · medium · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-18` — Implement a Simple Test Framework
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-20` — Compute Fibonacci Number Modulo a Prime
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-and-arithmetic-21` — Compute Overflow-Safe Average of Two Numbers
_exercise · medium · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-22` — Find All Duplicate Elements in Vector
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-23` — Implement a Generic Stack with Struct Methods
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-resources-24` — Token Transfer with Balance Tracking
_exercise · medium · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-events-27` — Event-Driven Token Transfer Registry
_exercise · medium · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abilities-key-store-copy-drop-25` — Resource Badge Manager with Abilities
_exercise · medium · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-28` — Unit Test Coverage Analyzer
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-26` — Build a Simple Token Module with Transfer Logic
_exercise · medium · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-19` — Count Unicode Grapheme Clusters in UTF-8 String
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-and-arithmetic-31` — Bitwise Population Count
_exercise · medium · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-32` — Rotate Vector Elements
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-30` — Compute Integer Square Root
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-resources-34` — Transfer Coins with Balance Tracking
_exercise · medium · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abilities-key-store-copy-drop-35` — Implement a Simple Capability-Based Resource Manager
_exercise · medium · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-33` — Build a Weighted Vote System
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-events-37` — Event Emission Tracker
_exercise · medium · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-29` — UTF-8 Character Counter
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-36` — Implement a Transferable Token Module
_exercise · medium · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-40` — Compute Collatz Sequence Length
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-38` — Test Helper: Assert Collection Equality
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-39` — UTF-8 Byte Length Calculator
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-and-arithmetic-1` — Compute Modular Multiplicative Inverse
_exercise · hard · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-2` — Implement a Sliding Window Maximum
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abilities-key-store-copy-drop-5` — Capability-Based Access Control with Abilities
_exercise · hard · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-3` — Implement a Type-Safe Generic Heap with Custom Comparator
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-resources-4` — Implement a Token Vault with Withdrawal Limits
_exercise · hard · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-6` — Module-Based Access Control System
_exercise · hard · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-8` — Build a Test Framework with Assertion Tracking
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-events-7` — Event Queue with Priority and Filtering
_exercise · hard · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-10` — Fibonacci Matrix Exponentiation
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-9` — UTF-8 Byte Sequence Validator
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-and-arithmetic-11` — Bitwise Prime Factorization Detector
_exercise · hard · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-resources-14` — Build a Token Vesting Contract with Cliff and Linear Release
_exercise · hard · resources · parts: title, body_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-16` — Cross-Module Capability Gateway with Witness Pattern
_exercise · hard · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-13` — Implement a Generic Binary Heap with Custom Ordering
_exercise · hard · structs · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-18` — Build a Test Framework with Assertion Tracking
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-12` — Sparse Vector Compression with Range Queries
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abilities-key-store-copy-drop-15` — Dynamic Resource Registry with Capability Control
_exercise · hard · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-19` — UTF-8 Byte Sequence Validator
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-20` — Implement Integer Square Root Without Division
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-events-17` — Event-Driven Multi-Step Workflow Tracker
_exercise · hard · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-and-arithmetic-21` — Bitwise Primality Sieve with Packed Storage
_exercise · hard · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-22` — Spiral Matrix Traversal
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-23` — Generic Binary Tree with In-Order Traversal
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abilities-key-store-copy-drop-25` — Generic Storage with Custom Abilities
_exercise · hard · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-resources-24` — Implement a Lockable Resource with Transfer Guards
_exercise · hard · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-26` — Multi-Module Resource Management with Access Control
_exercise · hard · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-events-27` — Event-Driven Auction House with Bidding History
_exercise · hard · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-28` — Smart Contract Testing Framework with Type-Safe Assertions
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-32` — Implement a Stable Partition with Minimal Allocations
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-29` — UTF-8 Byte Length Calculator with Validation
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-30` — Count Set Bit Pairs in Range
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-and-arithmetic-31` — Implement Fixed-Point Decimal Arithmetic
_exercise · hard · primitives and arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abilities-key-store-copy-drop-35` — Generic Resource Vault with Capability Keys
_exercise · hard · abilities (key, store, copy, drop) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-33` — Implement a Generic Binary Search Tree with Structural Comparison
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-resources-34` — Implement a Token Vault with Withdrawal Limits
_exercise · hard · resources · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-38` — Implement a Testing Framework with Assertion Tracking
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-36` — Cross-Module Token Registry with Witness Pattern
_exercise · hard · modules · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-40` — Implement U64 Square Root (Newton-Raphson)
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-39` — UTF-8 Byte Sequence Validator
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-events-37` — Event-Driven Order Book with Priority Matching
_exercise · hard · events · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-python-handwritten

- **Course title:** Python Challenges
- **Language:** python
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-python-handwritten fully translated to `ru`
- [ ] challenges-python-handwritten fully translated to `es`
- [ ] challenges-python-handwritten fully translated to `fr`
- [ ] challenges-python-handwritten fully translated to `kr`
- [ ] challenges-python-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-lists-1` — Sum a List of Numbers
_exercise · easy · lists · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-2` — Filter Even Numbers
_exercise · easy · lists · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-3` — Find the Maximum
_exercise · easy · lists · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-4` — Double Every Element
_exercise · easy · lists · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-1` — Count Letter Frequency
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-2` — Lookup with Default
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-3` — Invert a Dictionary
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-4` — Group Words by Length
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-1` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Check Palindrome
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Count Vowels
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Capitalize Each Word
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-1` — Swap Two Values
_exercise · easy · tuples · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-2` — Unpack a Coordinate
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-3` — Min and Max as a Pair
_exercise · easy · tuples · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-4` — Triple from Args
_exercise · easy · tuples · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sets-1` — Deduplicate a List
_exercise · easy · sets · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sets-2` — Set Intersection
_exercise · easy · sets · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sets-3` — Set Union
_exercise · easy · sets · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-sets-4` — Set Difference
_exercise · easy · sets · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iteration-1` — Zip Two Lists
_exercise · easy · iteration · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iteration-2` — Index Each Item
_exercise · easy · iteration · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iteration-3` — Range Sum
_exercise · easy · iteration · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iteration-4` — Count Occurrences
_exercise · easy · iteration · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comprehensions-1` — Squares List
_exercise · easy · comprehensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comprehensions-2` — Lengths Dict
_exercise · easy · comprehensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comprehensions-3` — Unique Lengths Set
_exercise · easy · comprehensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comprehensions-4` — Filter and Map
_exercise · easy · comprehensions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-1` — Factorial
_exercise · easy · math · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-2` — Greatest Common Divisor
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-3` — Even or Odd
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-math-4` — Absolute Value
_exercise · easy · math · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-1` — FizzBuzz Word
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-2` — Sign of a Number
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-3` — Grade Letter
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-4` — Leap Year
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conversions-1` — Parse Integer
_exercise · easy · conversions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conversions-2` — Stringify a Number
_exercise · easy · conversions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conversions-3` — Truthy Check
_exercise · easy · conversions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conversions-4` — Float to Rounded Int
_exercise · easy · conversions · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-recursion-1` — Tail-Recursive Factorial
_exercise · medium · recursion · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-recursion-2` — Sum a Nested List
_exercise · medium · recursion · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-recursion-3` — Count Tree Nodes
_exercise · medium · recursion · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-recursion-4` — Fibonacci with Memoization
_exercise · medium · recursion · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-decorators-1` — Call-Counting Decorator
_exercise · medium · decorators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-decorators-2` — Memoize Decorator
_exercise · medium · decorators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-decorators-3` — Reject Negative Arguments
_exercise · medium · decorators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-decorators-4` — Decorator Factory: Tag
_exercise · medium · decorators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generators-1` — Take N from an Infinite Generator
_exercise · medium · generators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generators-2` — Fibonacci Generator
_exercise · medium · generators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generators-3` — Chunk a List with a Generator
_exercise · medium · generators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generators-4` — Running Average Generator
_exercise · medium · generators · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-1` — Extract Integers from Text
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-2` — Validate Simple Email
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-3` — Collapse Whitespace
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regex-4` — Extract Hashtags
_exercise · medium · regex · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-1` — Hashable Point
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-2` — Iterable Frequency Counter
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-3` — Stack with len and bool
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-4` — StepRange Iterator
_exercise · medium · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-fileparsing-1` — Parse a CSV String
_exercise · medium · file-parsing · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-fileparsing-2` — Lowercase All Dict Keys (Nested)
_exercise · medium · file-parsing · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-fileparsing-3` — Parse key=value Config
_exercise · medium · file-parsing · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-fileparsing-4` — Sum a CSV Column
_exercise · medium · file-parsing · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comprehensions-1` — Squares of Odd Numbers
_exercise · medium · comprehensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comprehensions-2` — Flatten and Filter Positives
_exercise · medium · comprehensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comprehensions-3` — Long Word Lengths
_exercise · medium · comprehensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comprehensions-4` — Classify Numbers
_exercise · medium · comprehensions · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functools-1` — Product via reduce
_exercise · medium · functools · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functools-2` — Adder Factory with partial
_exercise · medium · functools · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functools-3` — Cached Fibonacci with lru_cache
_exercise · medium · functools · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-functools-4` — Flatten with reduce
_exercise · medium · functools · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-itertools-1` — Merge Lists with chain
_exercise · medium · itertools · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-itertools-2` — Consecutive Runs with groupby
_exercise · medium · itertools · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-itertools-3` — Running Totals with accumulate
_exercise · medium · itertools · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-itertools-4` — Pairs Summing to Target
_exercise · medium · itertools · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Anagram Check
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-2` — Longest Common Prefix
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-3` — Run-Length Encode
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-4` — Caesar Cipher
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-1` — Build an LRU Cache
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-2` — Build a Trie with Prefix Search
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-3` — Build a Min-Heap
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-data-structures-4` — Build a Fixed-Size Ring Buffer
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graphs-1` — BFS Shortest Path Length on a Graph
_exercise · hard · graphs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graphs-2` — Topological Sort (Kahn's Algorithm)
_exercise · hard · graphs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graphs-3` — Iterative DFS Order on a Graph
_exercise · hard · graphs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-graphs-4` — Iterative In-Order BST Traversal
_exercise · hard · graphs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dynamic-programming-1` — Longest Increasing Subsequence Length
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dynamic-programming-2` — Edit Distance (Levenshtein)
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dynamic-programming-3` — Coin Change Minimum Coins
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dynamic-programming-4` — 0/1 Knapsack Maximum Value
_exercise · hard · dynamic-programming · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — First Index of Pattern (KMP-style)
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-2` — Longest Palindromic Substring
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-3` — Group Anagrams
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-4` — Wildcard Pattern Match
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-number-theory-1` — Sieve of Eratosthenes
_exercise · hard · number-theory · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-number-theory-2` — Modular Exponentiation
_exercise · hard · number-theory · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-number-theory-3` — GCD and LCM of an Array
_exercise · hard · number-theory · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-number-theory-4` — Prime Factorisation Multiset
_exercise · hard · number-theory · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-1` — Custom Range Iterator Class
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-2` — Generator Pipeline: chunks() + windows()
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-3` — Lazy Take from an Infinite Counter
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-4` — Peekable Iterator Wrapper
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-decorators-1` — Cache with TTL Semantics
_exercise · hard · decorators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-decorators-2` — Retry with Linear Backoff
_exercise · hard · decorators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-decorators-3` — Rate Limiter Decorator (deque-based)
_exercise · hard · decorators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-decorators-4` — Memoize Pure Functions
_exercise · hard · decorators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-1` — Immutable Point with Hashing
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-2` — Fraction with Arithmetic
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-3` — Polynomial with Add and Evaluate
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-4` — Bank Account with Transaction Log
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-1` — Compose Right-to-Left
_exercise · hard · higher-order · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-2` — Pipe Left-to-Right
_exercise · hard · higher-order · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-3` — Curry a Fixed-Arity Function
_exercise · hard · higher-order · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-4` — flat_map (Bind for Lists)
_exercise · hard · higher-order · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-1` — Event Scheduler
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-2` — Producer / Consumer with deque
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-3` — Cron-Tick Simulator
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-4` — Replay Event Log into State
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-reactnative-handwritten

- **Course title:** React Native Challenges
- **Language:** reactnative
- **Chapters / lessons:** 3 / 12
- **Translation units:** 60 (12 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-reactnative-handwritten fully translated to `ru`
- [ ] challenges-reactnative-handwritten fully translated to `es`
- [ ] challenges-reactnative-handwritten fully translated to `fr`
- [ ] challenges-reactnative-handwritten fully translated to `kr`
- [ ] challenges-reactnative-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-formatting-1` — Format a Phone Number
_exercise · easy · formatting · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-validation-2` — Validate an Email Shape
_exercise · easy · validation · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-formatting-3` — Truncate with an Ellipsis
_exercise · easy · formatting · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-4` — Group by Key
_exercise · easy · lists · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-1` — Toggle Item in Array
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-formatting-2` — Relative Time
_exercise · medium · formatting · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-3` — Chunk an Array
_exercise · medium · lists · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-validation-4` — Strong-Password Score
_exercise · medium · validation · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-search-1` — Fuzzy Search Filter
_exercise · hard · search · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-2` — Sort by Multiple Keys
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-state-3` — Set a Path on an Object
_exercise · hard · state · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-4` — FlatList Section Builder
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-ruby-handwritten

- **Course title:** Ruby Challenges
- **Language:** ruby
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-ruby-handwritten fully translated to `ru`
- [ ] challenges-ruby-handwritten fully translated to `es`
- [ ] challenges-ruby-handwritten fully translated to `fr`
- [ ] challenges-ruby-handwritten fully translated to `kr`
- [ ] challenges-ruby-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · ruby · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · ruby · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · ruby · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · ruby · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · ruby · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-12` — Find Maximum Element in Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-11` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enumerable-8` — Find First Even Number
_exercise · easy · enumerable · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashes-13` — Count Character Occurrences
_exercise · easy · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-symbols-9` — Symbol Frequency Counter
_exercise · easy · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-10` — Count Numbers in Range
_exercise · easy · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-regular-expressions-7` — Extract Email Username
_exercise · easy · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-and-inheritance-6` — Create a Simple Bank Account Hierarchy
_exercise · easy · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-blocks-and-iterators-14` — Filter Even Numbers with a Block
_exercise · easy · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enumerable-18` — Sum of Even Numbers
_exercise · easy · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-regular-expressions-17` — Extract Email Usernames
_exercise · easy · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-symbols-19` — Symbol Frequency Counter
_exercise · easy · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-20` — Count Numbers in Range
_exercise · easy · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-and-mixins-15` — Create a Loggable Mixin for Timestamped Messages
_exercise · easy · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-and-inheritance-16` — Create a Simple Animal Hierarchy
_exercise · easy · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-21` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-22` — Find the Longest Word
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashes-23` — Count Character Occurrences
_exercise · easy · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-blocks-and-iterators-24` — Count Elements Matching a Condition
_exercise · easy · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-regular-expressions-27` — Extract Email Username
_exercise · easy · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-and-mixins-25` — Create a Loggable Mixin
_exercise · easy · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enumerable-28` — Find Maximum Element in Array
_exercise · easy · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-and-inheritance-26` — Create a Simple Vehicle Hierarchy
_exercise · easy · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-symbols-29` — Symbol Frequency Counter
_exercise · easy · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-31` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-30` — Count Numbers in Range
_exercise · easy · ranges · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-32` — Find the Maximum Number in an Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-blocks-and-iterators-34` — Count Elements Matching a Condition
_exercise · easy · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-hashes-33` — Count Character Frequencies
_exercise · easy · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enumerable-38` — Find All Even Numbers
_exercise · easy · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-and-inheritance-36` — Create a Simple Animal Hierarchy
_exercise · easy · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-modules-and-mixins-35` — Create a Printable Mixin
_exercise · easy · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-regular-expressions-37` — Extract Email Domains
_exercise · easy · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-symbols-39` — Symbol Frequency Counter
_exercise · easy · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ranges-40` — Check if Number is in Range
_exercise · easy · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Find Longest Palindromic Substring
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-2` — Find Peak Elements in Array
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashes-3` — Group Anagrams by Sorted Key
_exercise · medium · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-blocks-and-iterators-4` — Custom Each With Index
_exercise · medium · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enumerable-8` — Custom Group By with Value Transformation
_exercise · medium · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-and-inheritance-6` — Build a Shape Hierarchy with Area Calculation
_exercise · medium · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ranges-10` — Merge Overlapping Ranges
_exercise · medium · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-and-mixins-5` — Build a Cacheable Module with Parametric Mixin
_exercise · medium · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regular-expressions-7` — Extract Nested Capture Groups from Log Lines
_exercise · medium · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-11` — Count Palindromic Substrings
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-symbols-9` — Symbol Table Merger
_exercise · medium · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-12` — Find Missing Numbers in Sequence
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-blocks-and-iterators-14` — Custom Each With Index
_exercise · medium · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regular-expressions-17` — Extract Nested Brackets Content
_exercise · medium · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-symbols-19` — Symbol Frequency Counter with Normalization
_exercise · medium · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-and-mixins-15` — Build a Comparable Version Number
_exercise · medium · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-and-inheritance-16` — Build a Shape Hierarchy with Area Calculations
_exercise · medium · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ranges-20` — Merge Overlapping Ranges
_exercise · medium · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashes-13` — Merge Nested Hashes with Conflict Resolution
_exercise · medium · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enumerable-18` — Group Consecutive Elements by Property
_exercise · medium · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-22` — Find All Pairs with Target Sum
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-blocks-and-iterators-24` — Custom Each With Index Iterator
_exercise · medium · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-21` — Balanced Bracket Subsequence
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enumerable-28` — Group and Transform with Enumerable Methods
_exercise · medium · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regular-expressions-27` — Extract Nested Brackets Content
_exercise · medium · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-and-inheritance-26` — Build a Polymorphic Shape Hierarchy
_exercise · medium · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashes-23` — Merge Nested Hashes with Conflict Resolution
_exercise · medium · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-and-mixins-25` — Implement a Chainable Logger Mixin
_exercise · medium · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-symbols-29` — Symbol Frequency Counter with Threshold Filter
_exercise · medium · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ranges-30` — Merge Overlapping Ranges
_exercise · medium · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-31` — Count Overlapping Substring Occurrences
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashes-33` — Merge Nested Hashes with Custom Rules
_exercise · medium · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-32` — Find Peak Element in Array
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-blocks-and-iterators-34` — Custom Each With Index Iterator
_exercise · medium · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-and-inheritance-36` — Implement a Shape Hierarchy with Area Calculation
_exercise · medium · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-modules-and-mixins-35` — Build a Plugin System with Dynamic Mixins
_exercise · medium · modules and mixins · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-regular-expressions-37` — Extract Quoted Strings with Escape Sequences
_exercise · medium · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enumerable-38` — Group and Transform with Custom Criteria
_exercise · medium · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-symbols-39` — Symbol Frequency Counter with Normalization
_exercise · medium · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ranges-40` — Merge Overlapping Ranges
_exercise · medium · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Build a Minimal String Compressor with Run-Length Encoding
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-2` — Longest Increasing Subsequence Length
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-hashes-3` — Deep Hash Merge with Custom Conflict Resolution
_exercise · hard · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-blocks-and-iterators-4` — Custom Iterator with Memoization and Chaining
_exercise · hard · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enumerable-8` — Lazy Infinite Stream Combinator
_exercise · hard · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ranges-10` — Range Compression: Merge Overlapping Intervals
_exercise · hard · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-symbols-9` — Symbol Table Garbage Collector
_exercise · hard · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-regular-expressions-7` — Build a Regex Validator with Backreference Support
_exercise · hard · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-and-mixins-5` — Dynamic Module Mixer with Method Conflict Resolution
_exercise · hard · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-and-inheritance-6` — Build a Virtual File System with Permissions
_exercise · hard · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-11` — Longest Palindromic Subsequence
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-12` — Longest Increasing Subsequence (LIS)
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-hashes-13` — Deep Merge Nested Hashes with Custom Conflict Resolution
_exercise · hard · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-blocks-and-iterators-14` — Build a Lazy Sequence Iterator with Memoization
_exercise · hard · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-and-mixins-15` — Build a Flexible Plugin System with Dynamic Mixins
_exercise · hard · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-and-inheritance-16` — Build a Plugin System with Dynamic Method Routing
_exercise · hard · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enumerable-18` — Build a Custom Lazy Enumerator Chain
_exercise · hard · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-regular-expressions-17` — Build a Regex Validator with Custom Quantifiers
_exercise · hard · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-symbols-19` — Symbol Interning and Memory Analysis
_exercise · hard · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ranges-20` — Range Intersection and Union Calculator
_exercise · hard · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-21` — Decode Run-Length Encoded Nested Brackets
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-22` — Longest Increasing Subsequence Indices
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-hashes-23` — Deep Merge Nested Hashes with Custom Conflict Resolution
_exercise · hard · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-blocks-and-iterators-24` — Lazy Sequence Generator with Custom Iterator
_exercise · hard · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-and-mixins-25` — Build a Dynamic Module Composer with Method Conflicts
_exercise · hard · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-symbols-29` — Symbol Table Compression with Frequency Encoding
_exercise · hard · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-and-inheritance-26` — Build a Type-Safe Query Builder with Method Chaining
_exercise · hard · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ranges-30` — Range Set Merger with Gap Analysis
_exercise · hard · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enumerable-28` — Build a Lazy Enumerable Pipeline with Memoization
_exercise · hard · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-32` — Longest Increasing Subsequence
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-31` — Longest Palindromic Substring with Minimal Cuts
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-regular-expressions-27` — Build a Regex Token Validator
_exercise · hard · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-hashes-33` — Deep Merge Nested Hashes with Custom Conflict Resolution
_exercise · hard · hashes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-blocks-and-iterators-34` — Build a Lazy Enumerator with Memoization
_exercise · hard · blocks and iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ranges-40` — Merge Overlapping Integer Ranges
_exercise · hard · ranges · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enumerable-38` — Lazy Infinite Stream Transformer
_exercise · hard · enumerable · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-regular-expressions-37` — Build a Minimal Regex Engine
_exercise · hard · regular expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-and-inheritance-36` — Multi-Level Cache with TTL and Inheritance
_exercise · hard · classes and inheritance · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-modules-and-mixins-35` — Build a Plugin System with Dynamic Mixin Composition
_exercise · hard · modules and mixins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-symbols-39` — Symbol Interning and Memory Optimization
_exercise · hard · symbols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-rust-handwritten

- **Course title:** Rust Challenges
- **Language:** rust
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-rust-handwritten fully translated to `ru`
- [ ] challenges-rust-handwritten fully translated to `es`
- [ ] challenges-rust-handwritten fully translated to `fr`
- [ ] challenges-rust-handwritten fully translated to `kr`
- [ ] challenges-rust-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-strings-1` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Check if a String is a Palindrome
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Repeat a String N Times
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-1` — Sum a Vector of i32
_exercise · easy · vectors · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-2` — Find Maximum in a Vector
_exercise · easy · vectors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-3` — Filter Even Numbers
_exercise · easy · vectors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-4` — Check if a Vector Contains a Value
_exercise · easy · vectors · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-1` — Sum an Inclusive Range
_exercise · easy · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-2` — Count Elements Matching a Predicate
_exercise · easy · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-3` — Square Each Element
_exercise · easy · iterators · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-4` — Product Using fold
_exercise · easy · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-1` — Default Value with unwrap_or
_exercise · easy · options · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-2` — Double an Optional Number
_exercise · easy · options · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-3` — Halve Even Numbers Only
_exercise · easy · options · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-4` — First Element of a Slice
_exercise · easy · options · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-matching-1` — Match a Color Enum
_exercise · easy · matching · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-matching-2` — Destructure a Tuple
_exercise · easy · matching · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-matching-3` — Match a Shape Enum's Area
_exercise · easy · matching · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-matching-4` — Sign Using Match
_exercise · easy · matching · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-1` — Point with Distance Method
_exercise · easy · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-2` — Counter with Increment
_exercise · easy · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-3` — Rectangle Area
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-4` — Person Greeting
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-1` — Apply a Closure
_exercise · easy · closures · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-2` — Sum By Closure
_exercise · easy · closures · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-3` — Make Adder Closure
_exercise · easy · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-4` — Filter With Predicate
_exercise · easy · closures · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-1` — Factorial of a Small Number
_exercise · easy · numbers · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-2` — Check if Even
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-3` — Sign of an Integer
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-4` — Absolute Value
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-1` — Classify Temperature
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-2` — FizzBuzz Word
_exercise · easy · conditionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-3` — Letter Grade
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-4` — Leap Year
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-1` — Display for Point
_exercise · easy · traits · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-2` — Display for Money
_exercise · easy · traits · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-3` — Display for Direction
_exercise · easy · traits · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-4` — Display for Fraction
_exercise · easy · traits · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-1` — Generic Min and Max
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-2` — Generic Stack<T>
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-3` — Generic Counter<T>
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-4` — Pair Implementing Display
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-1` — Custom CountDown Iterator
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-2` — Running Sum with scan
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-3` — Zip and Chain Pairs
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-4` — Average via fold
_exercise · medium · iterators · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-result-1` — Custom Error from Parsing
_exercise · medium · result · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-result-2` — Sum of Parsed Numbers
_exercise · medium · result · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-result-3` — Divide With Error Enum
_exercise · medium · result · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-result-4` — Chain Two Parses With ?
_exercise · medium · result · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashmap-1` — Group Strings By Length
_exercise · medium · hashmap · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashmap-2` — Word Frequencies
_exercise · medium · hashmap · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashmap-3` — Multi-Map of Pairs
_exercise · medium · hashmap · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-hashmap-4` — Top Frequency Word
_exercise · medium · hashmap · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-1` — Parse and Double via and_then
_exercise · medium · option · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-2` — First Even Squared
_exercise · medium · option · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-3` — Lookup or Default
_exercise · medium · option · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-4` — Option to Result
_exercise · medium · option · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-struct-1` — Builder for HttpRequest
_exercise · medium · struct · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-struct-2` — Counter Struct With Tick
_exercise · medium · struct · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-struct-3` — Rectangle Area and Contains
_exercise · medium · struct · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-struct-4` — Bank Account Deposit/Withdraw
_exercise · medium · struct · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-1` — Traffic Light Next State
_exercise · medium · enum · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-2` — Tiny Expression Eval
_exercise · medium · enum · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-3` — Vending Machine State
_exercise · medium · enum · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enum-4` — Shape Area
_exercise · medium · enum · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closure-1` — Make Adder Closure
_exercise · medium · closure · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closure-2` — Sort by Closure
_exercise · medium · closure · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closure-3` — Longest Of Two Strings
_exercise · medium · closure · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closure-4` — Apply N Times
_exercise · medium · closure · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-parse-1` — Sum CSV Numbers
_exercise · medium · parse · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-parse-2` — Validate Hex Color
_exercise · medium · parse · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-parse-3` — Split On Multiple Delimiters
_exercise · medium · parse · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-parse-4` — Parse Key=Value Pairs
_exercise · medium · parse · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-1` — Top K with BinaryHeap
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-2` — Sorted Iter With BTreeMap
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-3` — Unique Preserving Order
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-4` — Set Intersection (Sorted)
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastruct-1` — LRU Cache with HashMap and VecDeque
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-1` — BST Insert, Search, and Inorder Traversal
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algos-1` — In-Place Quicksort
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — Length of Longest Increasing Subsequence
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Group Anagrams
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-1` — Generic PriorityQueue with binary heap
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iter-1` — Chunks Iterator over a Slice
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lifetimes-1` — WordSplitter Borrowing the Source
_exercise · hard · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-errors-1` — Parse Key=Value Config with Custom Error
_exercise · hard · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-1` — Single-Threaded Event Scheduler
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastruct-2` — MinHeap of i32 from Scratch
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-2` — Inorder Iterator without Recursion
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algos-2` — Mergesort with Auxiliary Buffer
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Levenshtein Edit Distance
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-2` — RLE Encode and Decode
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-2` — Memoize a Pure Function over Hashable Keys
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iter-2` — Custom Peekable Wrapper
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lifetimes-2` — Token Cursor over a Borrowed Slice
_exercise · hard · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-errors-2` — CSV Row Parsing with Multi-Step Errors
_exercise · hard · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-2` — Single-Threaded Channel via VecDeque
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastruct-3` — Trie with Insert, Contains, Prefix Search
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-3` — BST Height and Balance Check
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algos-3` — Binary Search Leftmost and Rightmost Insertion
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Coin Change Minimum Coins
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-3` — Wildcard String Match (? and *)
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-3` — Generic BFS over Adjacency Map
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iter-3` — Enumerated Iterator over a Borrowed Slice
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lifetimes-3` — Borrow-Friendly KV Parser
_exercise · hard · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-errors-3` — Pipeline Error: Parse Then Validate
_exercise · hard · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-3` — Turnstile State Machine
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastruct-4` — Fixed-Capacity Ring Buffer
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-trees-4` — Trie Word Iterator (DFS)
_exercise · hard · trees · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-algos-4` — KMP Substring Search
_exercise · hard · algorithms · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Longest Palindromic Substring
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-4` — Longest Common Prefix of Strings
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-4` — Generic Singly Linked List with Iterator
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iter-4` — Sliding Windows Iterator over a Slice
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lifetimes-4` — Return Longest Word Reference into Source
_exercise · hard · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-errors-4` — Sum Parsed Lines, Propagating Errors
_exercise · hard · errors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-4` — Topic-Based In-Memory Message Broker
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-rust-mo9bapm1

- **Course title:** Rust — Challenge Pack
- **Language:** rust
- **Chapters / lessons:** 3 / 100
- **Translation units:** 500 (100 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-rust-mo9bapm1 fully translated to `ru`
- [ ] challenges-rust-mo9bapm1 fully translated to `es`
- [ ] challenges-rust-mo9bapm1 fully translated to `fr`
- [ ] challenges-rust-mo9bapm1 fully translated to `kr`
- [ ] challenges-rust-mo9bapm1 fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-strings-0` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-and-slices-1` — Find the Maximum Element in a Slice
_exercise · easy · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-2` — Sum of Squares Using Iterators
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ownership-and-borrowing-3` — Borrow Checker Buddy: Longest String Reference
_exercise · easy · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-enums-4` — Traffic Light State Machine
_exercise · easy · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-and-generics-5` — Generic Container with Display Trait
_exercise · easy · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-6` — Parse a Positive Integer with Error Handling
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-7` — Match the Shape
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-collections-vec-hashmap-8` — Count Character Frequencies
_exercise · easy · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lifetimes-9` — Longest of Two String Slices
_exercise · easy · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-10` — Transform with a Closure
_exercise · easy · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-concurrency-11` — Spawn and Sum with Threads
_exercise · easy · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-12` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-and-slices-13` — Find the Maximum Element in a Slice
_exercise · easy · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-14` — Sum of Squares Using Iterators
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ownership-and-borrowing-15` — Borrow Checker Basics: Longest of Two Strings
_exercise · easy · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-enums-16` — Model a Traffic Light with Enums and Structs
_exercise · easy · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-and-generics-17` — Generic Maximum Finder
_exercise · easy · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-18` — Parse a Temperature String
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-19` — Match the Shape
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-collections-vec-hashmap-20` — Count Character Frequencies
_exercise · easy · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lifetimes-21` — Longest of Two String Slices
_exercise · easy · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-22` — Transform Numbers with a Custom Closure
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-concurrency-23` — Spawn and Sum: Basic Thread Spawning
_exercise · easy · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-24` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-and-slices-25` — Find the Maximum Element in a Slice
_exercise · easy · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-26` — Sum of Squares Using Iterators
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ownership-and-borrowing-27` — Borrow Checker Basics: Longest of Two Strings
_exercise · easy · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-and-enums-28` — Model a Traffic Light with Enums and Structs
_exercise · easy · structs and enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-and-generics-29` — Implement a Generic Maximum Finder
_exercise · easy · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-30` — Parse a Temperature String
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-31` — Match the Shape
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-collections-vec-hashmap-32` — Count Character Frequencies
_exercise · easy · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lifetimes-33` — Longest of Two String Slices
_exercise · easy · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-34` — Transform with a Closure
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-concurrency-35` — Spawn and Sum with Threads
_exercise · easy · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-36` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-and-slices-37` — Sum of Even Numbers in a Slice
_exercise · easy · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-38` — Sum of Squares Using Iterators
_exercise · easy · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ownership-and-borrowing-39` — Borrow and Modify a Greeting
_exercise · easy · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-40` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-and-slices-41` — Find the Longest Increasing Subslice
_exercise · medium · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-42` — Sliding Window Maximum
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ownership-and-borrowing-43` — Split and Reconstruct a Borrowed Slice
_exercise · medium · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-enums-44` — Model a Traffic Light State Machine
_exercise · medium · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-and-generics-45` — Build a Generic Statistics Calculator
_exercise · medium · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-46` — Parse and Validate User Config
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-47` — Parse Simple Arithmetic Expressions
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-vec-hashmap-48` — Group Anagrams Together
_exercise · medium · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lifetimes-49` — Longest Common Prefix with Lifetime Bounds
_exercise · medium · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-50` — Build a Closure-Based Event Counter
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-concurrency-51` — Parallel Sum with Threads
_exercise · medium · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-52` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-and-slices-53` — Find the Longest Increasing Subslice
_exercise · medium · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-54` — Sliding Window Maximum
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ownership-and-borrowing-55` — Split and Keep: Ownership-Safe String Partitioning
_exercise · medium · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-enums-56` — Build a Task Manager with Priority Levels
_exercise · medium · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-and-generics-57` — Build a Generic Stack with Display Trait
_exercise · medium · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-58` — Parse and Validate User Configuration
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-59` — Parse and Evaluate Simple Arithmetic Expressions
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-vec-hashmap-60` — Group Anagrams Together
_exercise · medium · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lifetimes-61` — Longest Word Finder with Lifetimes
_exercise · medium · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-62` — Build a Closure Factory for Math Operations
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-concurrency-63` — Parallel Sum with Threads
_exercise · medium · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-64` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-and-slices-65` — Find the Longest Plateau in an Array
_exercise · medium · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-66` — Sliding Window Maximum
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ownership-and-borrowing-67` — Split and Keep: Borrowing References from Owned Data
_exercise · medium · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-and-enums-68` — Build a Task Priority Queue with Enums
_exercise · medium · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-and-generics-69` — Build a Generic Stack with Display Trait
_exercise · medium · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-70` — Parse and Validate User Configuration
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-71` — Parse and Evaluate Simple Arithmetic Expressions
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-vec-hashmap-72` — Word Frequency Counter with Top K Results
_exercise · medium · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lifetimes-73` — Longest Common Prefix with Lifetime Annotations
_exercise · medium · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-74` — Build a Composable Function Pipeline
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-concurrency-75` — Parallel Word Frequency Counter
_exercise · medium · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-76` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-and-slices-77` — Find the Longest Plateau in an Array
_exercise · medium · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-78` — Sliding Window Maximum
_exercise · medium · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ownership-and-borrowing-79` — Split and Keep: Borrowing Both Halves
_exercise · medium · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-80` — Implement a Glob Pattern Matcher
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-and-slices-81` — Implement a Sliding Window Maximum
_exercise · hard · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-82` — Implement a Lazy Fibonacci Iterator with Transformations
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ownership-and-borrowing-83` — Implement a Borrowing String Interner
_exercise · hard · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-and-enums-84` — Build a Task Scheduler with Priority Queues
_exercise · hard · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-and-generics-85` — Build a Generic Cache with Expiring Entries
_exercise · hard · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-86` — Build a Retry Executor with Exponential Backoff
_exercise · hard · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-87` — Parse and Evaluate a Simple Expression Tree
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-collections-vec-hashmap-88` — Build a Time-Based Key-Value Store
_exercise · hard · collections (Vec, HashMap) · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lifetimes-89` — Implement a Streaming Text Parser with Borrowed Slices
_exercise · hard · lifetimes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-closures-90` — Build a Composable Function Pipeline
_exercise · hard · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-91` — Build a Thread-Safe Bounded Channel
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-92` — Implement a Regex-Like Pattern Matcher
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-and-slices-93` — Implement a Sliding Window Maximum
_exercise · hard · arrays and slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-94` — Implement a Peekable Iterator with Multi-Peek Support
_exercise · hard · iterators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ownership-and-borrowing-95` — Build a Borrowing-Safe Text Editor Buffer
_exercise · hard · ownership and borrowing · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-and-enums-96` — Build a Task Scheduler with Priority Queues
_exercise · hard · structs and enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-and-generics-97` — Build a Generic Sorted Collection with Custom Ordering
_exercise · hard · traits and generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-98` — Build a Retry Executor with Exponential Backoff
_exercise · hard · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-99` — Parse and Evaluate a Simple Expression Language
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-scala-handwritten

- **Course title:** Scala Challenges
- **Language:** scala
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-scala-handwritten fully translated to `ru`
- [ ] challenges-scala-handwritten fully translated to `es`
- [ ] challenges-scala-handwritten fully translated to `fr`
- [ ] challenges-scala-handwritten fully translated to `kr`
- [ ] challenges-scala-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · scala · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · scala · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · scala · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · scala · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · scala · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-9` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-12` — Find Maximum Element in List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-11` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-option-and-either-7` — Safe Division with Option and Either
_exercise · easy · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-implicits-10` — Implicit String Formatter
_exercise · easy · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-for-comprehensions-6` — Filter and Transform with For-Comprehensions
_exercise · easy · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-8` — Implement a Simple Drawable Trait
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-13` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-classes-14` — Create a Person Case Class with Formatted Greeting
_exercise · easy · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-option-and-either-17` — Safe Division with Option
_exercise · easy · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-15` — Traffic Light State Machine
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-19` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-for-comprehensions-16` — Filter and Transform with For-Comprehension
_exercise · easy · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-21` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-implicits-20` — Default Tax Calculator with Implicit Rate
_exercise · easy · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-18` — Implement a Simple Logger Trait
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-22` — Sum of Even Numbers in a List
_exercise · easy · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-23` — Count Character Frequencies
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-25` — Match Day of Week
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-classes-24` — Create a Person Case Class with Age Validation
_exercise · easy · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-for-comprehensions-26` — Filter and Transform with For-Comprehensions
_exercise · easy · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-option-and-either-27` — Safe Division with Option
_exercise · easy · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-29` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-28` — Implement a Simple Trait for Geometric Shapes
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-lists-32` — Find Maximum in List
_exercise · easy · lists · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-31` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-implicits-30` — Default Greeting with Implicit Parameters
_exercise · easy · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-maps-33` — Count Character Frequency
_exercise · easy · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-classes-34` — Person Case Class with Age Calculation
_exercise · easy · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-pattern-matching-35` — Match Day of Week
_exercise · easy · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-for-comprehensions-36` — Filter and Transform with For-Comprehension
_exercise · easy · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-option-and-either-37` — Safe Division with Option
_exercise · easy · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tuples-39` — Swap Tuple Elements
_exercise · easy · tuples · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-traits-38` — Implement a Comparable Shape Trait
_exercise · easy · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-implicits-40` — Create an Implicit Conversion for Temperature Units
_exercise · easy · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Find Longest Palindromic Substring
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-2` — Partition List Around Pivot
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-5` — Parse and Evaluate Arithmetic Expressions
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-classes-4` — Implement a Shopping Cart with Case Classes
_exercise · medium · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-3` — Merge Maps with Custom Conflict Resolution
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-for-comprehensions-6` — Filter and Transform with For-Comprehensions
_exercise · medium · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-9` — Tuple Swap and Rotate
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-8` — Trait-Based Shape Area Calculator
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-and-either-7` — Parse Configuration with Validation
_exercise · medium · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-12` — Partition List Around Pivot
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-11` — Encode Consecutive Duplicates
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-13` — Group Anagrams
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-implicits-10` — Implement a Type-Safe Builder with Implicit Evidence
_exercise · medium · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-classes-14` — Deep Copy Case Class with Nested Updates
_exercise · medium · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-and-either-17` — Safe Division with Error Context
_exercise · medium · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-for-comprehensions-16` — Chain Optional Operations with For-Comprehension
_exercise · medium · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-15` — Parse and Evaluate Boolean Expressions
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-19` — Tuple Rotation and Transformation
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-18` — Implement a Trait-Based Plugin System
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-21` — Balanced Parentheses Validator
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-implicits-20` — Implicit Type Class for Custom Ordering
_exercise · medium · implicits · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-22` — Flatten Nested List to Target Depth
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-25` — Decode Run-Length Encoded String
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-23` — Group Anagrams by Sorted Characters
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-for-comprehensions-26` — Flatten Nested Options with For-Comprehension
_exercise · medium · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-classes-24` — Implement a Shopping Cart with Discounts
_exercise · medium · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-29` — Tuple Rotation and Transformation
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-and-either-27` — Parse and Validate Configuration
_exercise · medium · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-28` — Implement a Trait-Based Plugin System
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-implicits-30` — Type Class for Custom Ordering
_exercise · medium · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-lists-32` — Find All Sublists with Target Sum
_exercise · medium · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-maps-33` — Group Anagrams by Signature
_exercise · medium · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-31` — Run-Length Decode with Validation
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-for-comprehensions-36` — Cartesian Product with For-Comprehensions
_exercise · medium · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-classes-34` — Transform Nested Case Classes with Pattern Matching
_exercise · medium · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-matching-35` — Algebraic Expression Evaluator
_exercise · medium · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tuples-39` — Tuple Zipper with Custom Combiner
_exercise · medium · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-option-and-either-37` — Safe Division with Option and Either
_exercise · medium · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-traits-38` — Implement a Trait-Based Event Logger System
_exercise · medium · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-implicits-40` — Implement Type Class for Custom Ordering
_exercise · medium · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Longest Common Subsequence with Path Reconstruction
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-3` — Nested Map Path Query Engine
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-2` — Longest Increasing Subsequence with Reconstruct
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-classes-4` — Nested Case Class Delta Tracker
_exercise · hard · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-option-and-either-7` — Railway-Oriented Error Pipeline with Recovery
_exercise · hard · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-5` — Nested Expression Pattern Matcher with Type Inference
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-9` — Multi-Dimensional Tuple Zipper with Custom Predicates
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-8` — Implement a Type-Safe Builder with Phantom Types
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-for-comprehensions-6` — Nested Transaction Validator with Error Accumulation
_exercise · hard · for-comprehensions · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-11` — Longest Palindromic Subsequence with K Changes
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-implicits-10` — Build a Type-Safe Units-of-Measure Library with Implicits
_exercise · hard · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-for-comprehensions-16` — Nested Option Extraction with For-Comprehensions
_exercise · hard · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-15` — Recursive Pattern-Based Expression Evaluator
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-classes-14` — Deep Copy with Structural Sharing for Immutable Trees
_exercise · hard · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-13` — Multi-Level Cache with TTL and Eviction
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-12` — Implement Persistent List Zipper with History
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-19` — Tuple Tree Path Compression
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-18` — Type-Safe Builder with Phantom Types
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-option-and-either-17` — Build a Railway-Oriented Validation Pipeline
_exercise · hard · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-implicits-20` — Type-Level State Machine with Implicit Evidence
_exercise · hard · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-21` — Minimum Window Substring with Character Frequency
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-22` — Longest Increasing Subsequence with Reconstruction
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-23` — Nested Map Path Resolution with Wildcards
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-25` — Algebraic Expression Simplifier
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-for-comprehensions-26` — Implement a Monad Transformer Stack with For-Comprehension
_exercise · hard · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-29` — Tuple Tree Flattener with Type-Safe Path Tracking
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-option-and-either-27` — Railway-Oriented Validation Pipeline
_exercise · hard · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-28` — Trait-Based Expression Evaluator with Type Safety
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-classes-24` — Deep Merge Nested Case Classes with Type Safety
_exercise · hard · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-31` — Reconstruct Interleaved String from Pattern
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-lists-32` — Longest Increasing Subsequence with Position Tracking
_exercise · hard · lists · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-maps-33` — Nested Map Path Merger with Conflict Resolution
_exercise · hard · maps · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-pattern-matching-35` — Build a JSON Path Matcher with Wildcards
_exercise · hard · pattern matching · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-implicits-30` — Type-Level Natural Number Arithmetic with Implicits
_exercise · hard · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-classes-34` — Recursive Case Class Visitor with Path Tracking
_exercise · hard · case classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-for-comprehensions-36` — Build a Custom Monad for Transaction Validation
_exercise · hard · for-comprehensions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-option-and-either-37` — Parse and Validate Nested Configuration with Either
_exercise · hard · Option and Either · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tuples-39` — Tuple-Based Expression Tree Evaluator
_exercise · hard · tuples · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-implicits-40` — Type-Level Priority Queue with Implicit Ordering
_exercise · hard · implicits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-traits-38` — Type-Safe Event System with Trait Composition
_exercise · hard · traits · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-sql-handwritten

- **Course title:** SQL Challenges
- **Language:** sql
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-sql-handwritten fully translated to `ru`
- [ ] challenges-sql-handwritten fully translated to `es`
- [ ] challenges-sql-handwritten fully translated to `fr`
- [ ] challenges-sql-handwritten fully translated to `kr`
- [ ] challenges-sql-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · sql · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · sql · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · sql · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · sql · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · sql · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-date-arithmetic-10` — Calculate Days Between Dates
_exercise · easy · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-group-by-and-aggregates-13` — Count Orders by Customer
_exercise · easy · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-joins-12` — Join Customers with Their Orders
_exercise · easy · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-functions-7` — Extract Domain from Email Addresses
_exercise · easy · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-window-functions-6` — Running Total with Window Functions
_exercise · easy · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-set-operations-9` — Find Common Customers Between Two Stores
_exercise · easy · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-select-and-where-11` — Filter Active Users by Age Range
_exercise · easy · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-expressions-8` — Categorize Products by Price Range
_exercise · easy · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-functions-17` — Extract Email Domain
_exercise · easy · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-subqueries-14` — Find Customers With Above-Average Orders
_exercise · easy · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-select-and-where-21` — Filter Active Users by Age
_exercise · easy · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ctes-15` — Calculate Running Total with CTE
_exercise · easy · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-set-operations-19` — Find Unique Products Sold This Month
_exercise · easy · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-expressions-18` — Categorize Products by Price Range
_exercise · easy · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-window-functions-16` — Running Total with Window Functions
_exercise · easy · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-date-arithmetic-20` — Calculate Days Until Next Birthday
_exercise · easy · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-joins-22` — Join Customers with Their Orders
_exercise · easy · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-group-by-and-aggregates-23` — Count Orders by Customer
_exercise · easy · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-window-functions-26` — Running Total with Window Functions
_exercise · easy · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-functions-27` — Extract Domain from Email Addresses
_exercise · easy · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ctes-25` — Find Customers With Multiple Orders Using CTE
_exercise · easy · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-expressions-28` — Categorize Products by Price Range
_exercise · easy · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-subqueries-24` — Find Products Above Average Price
_exercise · easy · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-set-operations-29` — Find Products in Stock Across All Warehouses
_exercise · easy · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-date-arithmetic-30` — Calculate Days Until Next Birthday
_exercise · easy · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-group-by-and-aggregates-33` — Count Orders Per Customer
_exercise · easy · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-select-and-where-31` — Filter Active Users by Age Range
_exercise · easy · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-ctes-35` — Calculate Running Total with CTE
_exercise · easy · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-functions-37` — Extract Domain from Email Addresses
_exercise · easy · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-subqueries-34` — Find Customers with Above-Average Order Totals
_exercise · easy · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-joins-32` — Find Customers with Orders
_exercise · easy · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-window-functions-36` — Calculate Running Total with Window Functions
_exercise · easy · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-set-operations-39` — Find Unique Product Categories
_exercise · easy · set operations · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-case-expressions-38` — Classify Products by Price Range
_exercise · easy · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-date-arithmetic-40` — Calculate Days Until Next Birthday
_exercise · easy · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-group-by-and-aggregates-3` — Find Teams with Consistent Performance
_exercise · medium · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-select-and-where-1` — Filter Products by Price Range and Category
_exercise · medium · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ctes-5` — Calculate Running Department Budgets with CTEs
_exercise · medium · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-subqueries-4` — Find Departments With Above-Average Salaries
_exercise · medium · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-functions-7` — Extract Domain from Email Addresses
_exercise · medium · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-joins-2` — Find Customers With Unpaid High-Value Orders
_exercise · medium · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-window-functions-6` — Running Total with Category Reset
_exercise · medium · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-set-operations-9` — Find Products Sold in All Regions
_exercise · medium · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-expressions-8` — Categorize Orders by Value with Conditional Logic
_exercise · medium · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-date-arithmetic-10` — Calculate Business Days Between Dates
_exercise · medium · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-group-by-and-aggregates-13` — Product Sales Report with Running Totals
_exercise · medium · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-select-and-where-11` — Filter Products by Multiple Conditions
_exercise · medium · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-joins-12` — Find Orphaned Products Without Active Orders
_exercise · medium · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ctes-15` — Calculate Running Totals with Recursive CTE
_exercise · medium · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-window-functions-16` — Running Total with Group Reset
_exercise · medium · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-functions-17` — Extract Domain from Email Addresses
_exercise · medium · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-subqueries-14` — Find Customers With Above-Average Orders
_exercise · medium · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-set-operations-19` — Find Symmetric Difference Between Product Categories
_exercise · medium · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-select-and-where-21` — Find Products in Stock with Price Range
_exercise · medium · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-date-arithmetic-20` — Calculate Business Days Between Dates
_exercise · medium · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-expressions-18` — Grade Calculator with Conditional Bonuses
_exercise · medium · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-subqueries-24` — Find Departments With Above-Average Salaries
_exercise · medium · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-group-by-and-aggregates-23` — Find Products with Above-Average Sales per Category
_exercise · medium · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-joins-22` — Find Customers with No Recent Orders
_exercise · medium · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ctes-25` — Calculate Running Department Budgets with CTEs
_exercise · medium · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-window-functions-26` — Calculate Running Totals with Window Functions
_exercise · medium · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-functions-27` — Extract Domain from Email Addresses
_exercise · medium · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-set-operations-29` — Find Products Available in Both Stores
_exercise · medium · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-select-and-where-31` — Filter Products by Price Range and Category
_exercise · medium · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-joins-32` — Find Customers with Unshipped Orders
_exercise · medium · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-expressions-28` — Sales Tax Calculator with Regional Rules
_exercise · medium · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-group-by-and-aggregates-33` — Find Products with Above-Average Sales
_exercise · medium · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-subqueries-34` — Find Departments With Above-Average Salaries
_exercise · medium · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-date-arithmetic-30` — Calculate Subscription Renewal Dates
_exercise · medium · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-ctes-35` — Employee Hierarchy Reporting Chain
_exercise · medium · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-window-functions-36` — Running Total with Category Reset
_exercise · medium · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-functions-37` — Extract Domain from Email Addresses
_exercise · medium · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-set-operations-39` — Find Customers Who Purchased All Products
_exercise · medium · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-date-arithmetic-40` — Calculate Subscription Renewal Dates
_exercise · medium · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-case-expressions-38` — Product Category Price Labeling with CASE
_exercise · medium · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-select-and-where-1` — Multi-Table Filtering with Correlated Subqueries
_exercise · hard · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ctes-5` — Recursive Hierarchy Path Aggregation
_exercise · hard · ctes · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-subqueries-4` — Recursive Category Hierarchy with Aggregates
_exercise · hard · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-group-by-and-aggregates-3` — Multi-Level Sales Territory Performance Analysis
_exercise · hard · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-window-functions-6` — Running Median with Window Functions
_exercise · hard · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-expressions-8` — Conditional Aggregation with Multi-Level CASE
_exercise · hard · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-joins-2` — Reconstruct Employee Hierarchy with Recursive Joins
_exercise · hard · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-set-operations-9` — Multi-Stage Pipeline Reconciliation with Set Operations
_exercise · hard · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-select-and-where-11` — Multi-Table Fraud Detection with Complex Filtering
_exercise · hard · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-date-arithmetic-10` — Calculate Business Days Between Dates with Holidays
_exercise · hard · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-joins-12` — Multi-Level Employee Hierarchy Sales Analysis
_exercise · hard · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-functions-7` — Parse and Validate Nested JSON Paths
_exercise · hard · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-group-by-and-aggregates-13` — Customer Lifetime Value Tiers with Running Totals
_exercise · hard · group by and aggregates · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-subqueries-14` — Recursive Employee Hierarchy with Aggregate Metrics
_exercise · hard · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ctes-15` — Recursive Organization Hierarchy with Depth Limits
_exercise · hard · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-window-functions-16` — Running Median with Window Functions
_exercise · hard · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-functions-17` — Extract Nested JSON Paths with Wildcards
_exercise · hard · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-date-arithmetic-20` — Calculate Business Days Between Dates with Holidays
_exercise · hard · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-set-operations-19` — Find Symmetric Difference Across Multiple Sets
_exercise · hard · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-subqueries-24` — Find Departments With Above-Average High Earners
_exercise · hard · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-select-and-where-21` — Complex Multi-Table Filtering with Subqueries
_exercise · hard · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-joins-22` — Multi-Table Revenue Attribution with Complex Joins
_exercise · hard · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-group-by-and-aggregates-23` — Rolling Window Revenue Analysis with Quartile Filtering
_exercise · hard · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ctes-25` — Recursive CTE: Build Organizational Hierarchy Paths
_exercise · hard · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-expressions-18` — Multi-Tier Customer Loyalty Points Calculator
_exercise · hard · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-set-operations-29` — Find Symmetric Differences Across Three Sets
_exercise · hard · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-expressions-28` — Dynamic Pivot with Conditional Aggregation
_exercise · hard · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-window-functions-26` — Running Median with Window Functions
_exercise · hard · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-functions-27` — Parse and Validate Custom Log Format
_exercise · hard · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-select-and-where-31` — Multi-Table Fraud Detection with Complex Filtering
_exercise · hard · select and where · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-joins-32` — Multi-Table Inventory Reconciliation with Date Ranges
_exercise · hard · joins · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-date-arithmetic-30` — Calculate Business Days Between Dates with Holidays
_exercise · hard · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-group-by-and-aggregates-33` — Monthly Revenue Growth Rate with Rolling Averages
_exercise · hard · group by and aggregates · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-window-functions-36` — Running Percentile Rank with Dynamic Window
_exercise · hard · window functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-subqueries-34` — Find Top Products by Category with Running Totals
_exercise · hard · subqueries · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-ctes-35` — Recursive Employee Hierarchy with Salary Rollups
_exercise · hard · ctes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-case-expressions-38` — Multi-Tier Commission Calculator with CASE
_exercise · hard · case expressions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-functions-37` — Parse and Aggregate Nested Tag Frequencies
_exercise · hard · string functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-set-operations-39` — Identify Symmetric Set Differences Across Three Tables
_exercise · hard · set operations · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-date-arithmetic-40` — Calculate Business Days Between Dates with Holidays
_exercise · hard · date arithmetic · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-sway-handwritten

- **Course title:** Sway Challenges
- **Language:** sway
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-sway-handwritten fully translated to `ru`
- [ ] challenges-sway-handwritten fully translated to `es`
- [ ] challenges-sway-handwritten fully translated to `fr`
- [ ] challenges-sway-handwritten fully translated to `kr`
- [ ] challenges-sway-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · sway · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · sway · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · sway · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · sway · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · sway · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-12` — Sum Vector Elements
_exercise · easy · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-7` — Unwrap Option with Default Value
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-9` — Calculate Average of Three Numbers
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-13` — Calculate Rectangle Area
_exercise · easy · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-primitives-11` — Count Set Bits in a u64
_exercise · easy · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-10` — Count UTF-8 Characters in a String
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-storage-6` — Storage Counter Increment
_exercise · easy · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-8` — Write Tests for a Counter Contract
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-17` — Safe Division with Option
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-14` — Match Simple Traffic Light States
_exercise · easy · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-18` — Sum Two Numbers with Tests
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-19` — Sum of Digits in a u64
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-abi-and-contracts-15` — Create a Simple Counter Contract
_exercise · easy · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-storage-16` — Simple Counter Storage
_exercise · easy · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-20` — Count UTF-8 Code Points
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-primitives-21` — Count Set Bits in a u64
_exercise · easy · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-22` — Sum All Even Numbers in a Vector
_exercise · easy · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-24` — Match Traffic Light States
_exercise · easy · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-27` — Safe Division with Option
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-storage-26` — Simple Counter Storage
_exercise · easy · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-abi-and-contracts-25` — Simple Storage Contract
_exercise · easy · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-23` — Define and Use a Point Struct
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-29` — Calculate Circle Area from Radius
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-28` — Write Tests for Sum Function
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-primitives-31` — Sum Two u64 Numbers
_exercise · easy · primitives · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-vectors-32` — Sum Elements in a Vector
_exercise · easy · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-30` — Count UTF-8 Characters
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-33` — Calculate Rectangle Area
_exercise · easy · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-34` — Match Traffic Light States
_exercise · easy · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-abi-and-contracts-35` — Simple Storage Contract ABI
_exercise · easy · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-options-and-results-37` — Unwrap Option with Default
_exercise · easy · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-storage-36` — Simple Counter Storage
_exercise · easy · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-u64-math-39` — Sum of Multiples
_exercise · easy · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tests-38` — Write Tests for a Counter Contract
_exercise · easy · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-string-utf8-40` — Count UTF-8 Characters in String
_exercise · easy · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-1` — Bitwise Balance Checker
_exercise · medium · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-2` — Filter and Transform Vector Elements
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-3` — Inventory Management with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-7` — Chain Option and Result Transformations
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-8` — Mock Storage Testing with Predicates
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-9` — Compute Next Power of Two
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-storage-6` — Implement a Simple Token Balance Tracker
_exercise · medium · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-4` — Parse and Evaluate Simple Arithmetic Expression
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-11` — Bitwise Parity Checker
_exercise · medium · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abi-and-contracts-5` — Multi-Token Vault Contract
_exercise · medium · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-10` — UTF-8 Byte Length Calculator
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-13` — Implement a Simple Inventory System
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-12` — Find Median of Two Sorted Vectors
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-14` — Parse and Evaluate Simple Mathematical Expressions
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-17` — Safe Division with Option Chaining
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-19` — Compute Fast Integer Square Root (u64)
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-storage-16` — Implement a Simple Token Balance Tracker
_exercise · medium · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abi-and-contracts-15` — Build a Multi-Token Vault Contract
_exercise · medium · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-18` — Build a Test Suite for Token Balance Tracker
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-21` — Pack and Unpack Bit Flags
_exercise · medium · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-20` — Count UTF-8 Grapheme Clusters
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-22` — Partition Vector by Predicate
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-24` — Enum-Based State Machine for Order Processing
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-23` — Implement a Point Distance Calculator
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-storage-26` — Implement a Simple Token Balance Storage
_exercise · medium · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-27` — Chain Optional Transformations
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-29` — Count Set Bits in Range
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-28` — Test Coverage Analyzer
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abi-and-contracts-25` — Multi-Token Balance Tracker Contract
_exercise · medium · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-primitives-31` — Bit Manipulation: Count Set Bits in Range
_exercise · medium · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-vectors-32` — Rotate Vector Elements
_exercise · medium · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-33` — Build a Simple Inventory System
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-options-and-results-37` — Chain Option and Result Operations
_exercise · medium · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-30` — Count UTF-8 Grapheme Clusters
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-34` — Parse and Transform Command Variants
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-u64-math-39` — Count Set Bits in Range
_exercise · medium · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-storage-36` — Implement a Token Balance Tracker
_exercise · medium · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-abi-and-contracts-35` — Multi-Token Balance Tracker Contract
_exercise · medium · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tests-38` — Test Coverage Analyzer for Smart Contract
_exercise · medium · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-string-utf8-40` — Count UTF-8 Character Categories
_exercise · medium · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-1` — Implement Fixed-Point Square Root with Newton's Method
_exercise · hard · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-4` — Multi-Level Result Chain with Custom Error Recovery
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-2` — Implement a Generic Vector Chunk Iterator
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-3` — Implement a Memory-Efficient Sparse Matrix
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-7` — Nested Result Unwrapping with Custom Error Propagation
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-9` — Implement Saturating Arithmetic for u64
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abi-and-contracts-5` — Multi-Signature Wallet with Threshold Voting
_exercise · hard · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-storage-6` — Multi-Level Access Control with Role Hierarchy
_exercise · hard · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-11` — Implement Fixed-Point Decimal Arithmetic
_exercise · hard · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-8` — Property-Based Test Generator for Merkle Tree
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-14` — Implement a Recursive Expression Evaluator with Result Enum
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-12` — Implement a Sparse Vector with Dot Product
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-13` — Implement a Memory-Efficient Sparse Matrix
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-17` — Nested Option/Result Chain Unwrapper
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-10` — UTF-8 Code Point Counter with Validation
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abi-and-contracts-15` — Multi-Token Vault with Weighted Withdrawals
_exercise · hard · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-19` — Fixed-Point Square Root
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-storage-16` — Implement a Storage-Based Merkle Tree Verifier
_exercise · hard · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-18` — Property-Based Sum Verification via QuickCheck
_exercise · hard · tests · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-21` — Bitwise Polynomial Hash with Collision Detection
_exercise · hard · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-20` — UTF-8 Byte Sequence Validator
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-24` — Advanced Enum State Machine with Result Handling
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-27` — Nested Result Chain Validator
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-22` — Implement Vector Deduplication with Custom Comparator
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-23` — Implement a Generic Binary Search Tree with In-Order Traversal
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-28` — Build a Test Result Aggregator with Custom Assertions
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-storage-26` — Implement a Multi-Tier Storage Cache with Eviction Policy
_exercise · hard · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abi-and-contracts-25` — Multi-Token Escrow Contract with Conditional Release
_exercise · hard · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-29` — Implement Integer Square Root Without Division
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-primitives-31` — Bit-Packed Color Palette Encoder
_exercise · hard · primitives · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-30` — UTF-8 Boundary-Safe String Truncation
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-vectors-32` — Implement a Sparse Vector with Dot Product
_exercise · hard · vectors · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-34` — Recursive Enum Expression Evaluator
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-storage-36` — Implement a Persistent Ring Buffer with Overwrite Protection
_exercise · hard · storage · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-33` — Implement a Persistent Binary Search Tree
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-options-and-results-37` — Chained Option-Result Pipeline with Custom Error Recovery
_exercise · hard · options and results · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-u64-math-39` — Implement 64-bit Modular Exponentiation
_exercise · hard · u64 math · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-abi-and-contracts-35` — Multi-Signature Vault with Time-Locked Withdrawals
_exercise · hard · abi and contracts · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-string-utf8-40` — UTF-8 Character Boundary Validator
_exercise · hard · string utf8 · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tests-38` — Implement a Mock Testing Framework
_exercise · hard · tests · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-swift-handwritten

- **Course title:** Swift Challenges
- **Language:** swift
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-swift-handwritten fully translated to `ru`
- [ ] challenges-swift-handwritten fully translated to `es`
- [ ] challenges-swift-handwritten fully translated to `fr`
- [ ] challenges-swift-handwritten fully translated to `kr`
- [ ] challenges-swift-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-strings-1` — Reverse a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-2` — Count Vowels
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-3` — Check if a String is a Palindrome
_exercise · easy · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-4` — Repeat a String
_exercise · easy · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-1` — Sum an Array of Ints
_exercise · easy · arrays · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-2` — Find the Maximum
_exercise · easy · arrays · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-3` — Filter Even Numbers
_exercise · easy · arrays · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-4` — Check Array Contains
_exercise · easy · arrays · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-1` — Count Word Frequencies
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-2` — Lookup with Default
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-3` — Group by First Letter
_exercise · easy · dictionaries · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-dictionaries-4` — Get All Keys Sorted
_exercise · easy · dictionaries · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-1` — Default Value with Nil-Coalescing
_exercise · easy · optionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-2` — Map an Optional
_exercise · easy · optionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-3` — Safe Length
_exercise · easy · optionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-4` — Unwrap or Throw Default
_exercise · easy · optionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-1` — Sort by Length
_exercise · easy · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-2` — Filter with a Closure
_exercise · easy · closures · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-3` — Sort Descending
_exercise · easy · closures · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-4` — Filter Strings by Prefix
_exercise · easy · closures · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-1` — Point with Magnitude
_exercise · easy · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-2` — Counter Struct
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-3` — Rectangle Area
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-4` — Person Greeting
_exercise · easy · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-1` — Traffic Light Action
_exercise · easy · enums · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-2` — Direction Delta
_exercise · easy · enums · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-3` — Day is Weekend
_exercise · easy · enums · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-4` — HTTP Status Category
_exercise · easy · enums · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-1` — Factorial
_exercise · easy · numbers · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-2` — Absolute Value
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-3` — Sign of a Number
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-numbers-4` — Is Even
_exercise · easy · numbers · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-1` — FizzBuzz Word
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-2` — Classify Score
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-3` — Leap Year Check
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-conditionals-4` — Clamp a Value
_exercise · easy · conditionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-1` — Count Down
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-2` — Accumulate Squares
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-3` — Double Each Element
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-loops-4` — Count Matches
_exercise · easy · loops · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-protocols-1` — Stringer Protocol with Default Impl
_exercise · medium · protocols · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-protocols-2` — Summable Protocol via Extension
_exercise · medium · protocols · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-protocols-3` — Comparable Wrapper for Boxed Int
_exercise · medium · protocols · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-protocols-4` — Protocol Extension for Even-Count Filter
_exercise · medium · protocols · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-1` — Result-Like Enum: Outcome
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-2` — Either Left/Right Mapper
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-3` — Parse Simple Command Enum
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-4` — Shape Area via Associated Values
_exercise · medium · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-1` — Generic Stack
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-2` — Generic minMax
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-3` — Generic Pair Swap
_exercise · medium · generics · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-4` — Generic Find First
_exercise · medium · generics · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-1` — Sort by Custom Comparator
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-2` — Reduce With Seed
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-3` — Lazy Chain Map+Filter
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-4` — Closure Counter Factory
_exercise · medium · closures · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-1` — Counter Struct with Mutating
_exercise · medium · structs · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-2` — Bank Account with Overdraft Guard
_exercise · medium · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-3` — Ring Buffer of Fixed Capacity
_exercise · medium · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-4` — Vector2D with Mutating Add
_exercise · medium · structs · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-1` — Group By Length
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-2` — Frequency Map
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-3` — Partition by Predicate
_exercise · medium · collections · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-collections-4` — Unique Preserving Order
_exercise · medium · collections · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-1` — Chained Optional Map
_exercise · medium · optionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-2` — FlatMap to Avoid Nested Optionals
_exercise · medium · optionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-3` — Nil-Coalescing Pipeline
_exercise · medium · optionals · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-4` — Optional Chain on Nested Struct
_exercise · medium · optionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-1` — Split Filter Join
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-2` — Is Alphanumeric
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-3` — Initials From Name
_exercise · medium · strings · parts: title, body, hints (1)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-4` — Run-Length Encode
_exercise · medium · strings · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-1` — Switch With Where Clauses
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-2` — Tuple Destructuring in Switch
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-3` — Match Optional Range
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-pattern-4` — Match Enum With Where
_exercise · medium · pattern · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-1` — Throwing Divide
_exercise · medium · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-2` — Do/Try/Catch With Multiple Errors
_exercise · medium · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-3` — Result to Throws Bridge
_exercise · medium · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-errors-4` — Rethrowing Pipeline
_exercise · medium · errors · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-1` — Build an LRU Cache
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-2` — Generic Binary Min-Heap
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-3` — Doubly Linked List with Node Removal
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-datastructures-4` — Fixed-Capacity Ring Buffer
_exercise · hard · data-structures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-1` — BFS Shortest Path in a Directed Graph
_exercise · hard · tree · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-2` — DFS Topological Sort with Cycle Detection
_exercise · hard · tree · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-3` — Lazy In-Order Iterator over a Binary Tree
_exercise · hard · tree · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tree-4` — Flatten an N-ary Tree (Pre-order, Levels, Depth)
_exercise · hard · tree · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-1` — Configurable Priority Queue (Min/Max)
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-2` — Memoize and Recursive Memoize
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-3` — Generic TTL Cache with Injected Clock
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-4` — Type-Erased Validator Composition
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-result-1` — Tiny Parser Combinators
_exercise · hard · result · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-result-2` — Synchronous Retry with Exponential Backoff
_exercise · hard · result · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-result-3` — Accumulating Form Validation
_exercise · hard · result · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-result-4` — Result-chained Pipeline with Short-Circuit
_exercise · hard · result · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-1` — Regex-Light Matcher (. and *)
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-2` — Vending Machine State Transitions
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-3` — Recursive-Descent Expression Evaluator
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-4` — Traffic Light with Emergency Mode
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-class-1` — Observable/Subject with Auto-Cancel
_exercise · hard · class · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-class-2` — Mediator: Chat Room
_exercise · hard · class · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-class-3` — Navigation Coordinator
_exercise · hard · class · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-class-4` — Type-Keyed Event Bus
_exercise · hard · class · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-1` — Variadic Compose and Pipe
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-2` — Curry, Uncurry, and Flip
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-3` — Deep Equality for a JSON-like Tree
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-functional-4` — Lazy Functional Pipeline (map / filter / compactMap)
_exercise · hard · functional · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-1` — Longest Palindromic Substring
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-2` — Group Anagrams
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-3` — Wildcard Match (? and *)
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-4` — Run-Length Encode and Decode
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-1` — Longest Increasing Subsequence (Length + Reconstruction)
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-2` — Levenshtein Edit Distance
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-3` — Coin Change: Min Coins + Combination Count
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-dp-4` — Climbing Stairs with Custom Step Set
_exercise · hard · dp · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-1` — Synchronous Event Scheduler
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-2` — Synchronous Promise/Future
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-3` — Event-Sourced Account Replay
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-concurrency-4` — Synchronous Debounce and Throttle
_exercise · hard · concurrency · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-typescript-mo9c9k2o

- **Course title:** Typescript — Challenge Pack
- **Language:** typescript
- **Chapters / lessons:** 3 / 100
- **Translation units:** 500 (100 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-typescript-mo9c9k2o fully translated to `ru`
- [ ] challenges-typescript-mo9c9k2o fully translated to `es`
- [ ] challenges-typescript-mo9c9k2o fully translated to `fr`
- [ ] challenges-typescript-mo9c9k2o fully translated to `kr`
- [ ] challenges-typescript-mo9c9k2o fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `easy-strings-0` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-1` — Find the Second Largest Number
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-and-records-2` — Build a Word Frequency Counter
_exercise · easy · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-3` — Create a Counter Class
_exercise · easy · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-interfaces-and-types-4` — Shape Area Calculator with Type Guards
_exercise · easy · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-generics-5` — Create a Generic Wrapper Function
_exercise · easy · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-union-and-discriminated-unions-6` — Parse Shape Commands with Discriminated Unions
_exercise · easy · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-promises-and-async-await-7` — Delay and Double
_exercise · easy · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-and-generators-8` — Implement a Range Generator
_exercise · easy · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-9` — Safe JSON Parser
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-10` — Create a Counter with Closures
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-higher-order-functions-11` — Filter and Transform: Build a Number Pipeline
_exercise · easy · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-12` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-13` — Find the Second Largest Number
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-and-records-14` — Create a Contact Card
_exercise · easy · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-15` — Create a Counter Class
_exercise · easy · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-interfaces-and-types-16` — Define a Shape Calculator Interface
_exercise · easy · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-generics-17` — Create a Generic Identity Function
_exercise · easy · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-union-and-discriminated-unions-18` — Classify Shape Areas
_exercise · easy · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-promises-and-async-await-19` — Fetch User Age with Retry
_exercise · easy · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-and-generators-20` — Create a Range Generator
_exercise · easy · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-21` — Safe JSON Parser
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-22` — Create a Counter with Closures
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-higher-order-functions-23` — Create a Function Multiplier
_exercise · easy · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-24` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-25` — Find the Second Largest Number
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-and-records-26` — Create a Phone Book Lookup Function
_exercise · easy · objects and records · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-27` — Create a Simple Counter Class
_exercise · easy · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-interfaces-and-types-28` — Shape Area Calculator with Type Guards
_exercise · easy · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-generics-29` — Create a Type-Safe Identity Function
_exercise · easy · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-union-and-discriminated-unions-30` — Parse Shape Areas with Discriminated Unions
_exercise · easy · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-promises-and-async-await-31` — Delay Then Double
_exercise · easy · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-iterators-and-generators-32` — Create a Range Generator
_exercise · easy · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-handling-33` — Safe JSON Parser
_exercise · easy · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-closures-34` — Create a Counter Factory
_exercise · easy · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-higher-order-functions-35` — Create a Function Multiplier
_exercise · easy · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-36` — Extract Initials from a Full Name
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-37` — Find the Second Largest Number in an Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-objects-and-records-38` — Create a Contact Book Entry
_exercise · easy · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-classes-39` — Create a Counter Class
_exercise · easy · classes · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-40` — Parse and Validate Email Addresses
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-41` — Flatten Nested Arrays to a Specified Depth
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-objects-and-records-42` — Deep Freeze Object with Nested Structures
_exercise · medium · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-43` — Build a Shopping Cart with Discounts
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-and-types-44` — Build a Type-Safe Event Emitter
_exercise · medium · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-45` — Build a Type-Safe Object Picker
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-union-and-discriminated-unions-46` — Parse and Validate API Responses with Discriminated Unions
_exercise · medium · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-and-async-await-47` — Retry with Exponential Backoff
_exercise · medium · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-and-generators-48` — Implement a Lazy Range Generator with Transformations
_exercise · medium · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-49` — Build a Retry Mechanism with Exponential Backoff
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-50` — Build a Rate Limiter with Closures
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-51` — Build a Function Pipeline Composer
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-52` — Parse Query String into Object
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-53` — Flatten Nested Arrays to a Specified Depth
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-objects-and-records-54` — Deep Freeze: Make Objects Truly Immutable
_exercise · medium · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-55` — Build a Task Queue with Priority Scheduling
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-and-types-56` — Build a Type-Safe Event Emitter
_exercise · medium · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-57` — Build a Type-Safe Result Wrapper
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-union-and-discriminated-unions-58` — Parse and Validate API Responses with Discriminated Unions
_exercise · medium · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-and-async-await-59` — Retry with Exponential Backoff
_exercise · medium · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-and-generators-60` — Lazy Range Iterator with Transformations
_exercise · medium · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-61` — Build a Retry Mechanism with Exponential Backoff
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-62` — Build a Rate Limiter with Closures
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-63` — Build a Function Pipeline Composer
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-64` — Compress Consecutive Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-65` — Rotate Array Elements by K Positions
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-objects-and-records-66` — Deep Freeze Object Properties
_exercise · medium · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-67` — Build a Task Queue with Priority Support
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-interfaces-and-types-68` — Build a Type-Safe Event Emitter
_exercise · medium · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-generics-69` — Build a Type-Safe Map Function with Transformers
_exercise · medium · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-union-and-discriminated-unions-70` — Parse and Validate API Responses with Discriminated Unions
_exercise · medium · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-promises-and-async-await-71` — Retry with Exponential Backoff
_exercise · medium · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-iterators-and-generators-72` — Implement a Paginated Data Iterator
_exercise · medium · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-handling-73` — Build a Retry Function with Exponential Backoff
_exercise · medium · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-closures-74` — Build a Rate Limiter with Closures
_exercise · medium · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-higher-order-functions-75` — Build a Function Pipeline Composer
_exercise · medium · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-76` — Parse Template Strings with Nested Variables
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-77` — Rotate Array Elements by K Positions
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-objects-and-records-78` — Deep Freeze: Make Objects Immutable Recursively
_exercise · medium · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-classes-79` — Build a Task Queue with Priority Ordering
_exercise · medium · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-80` — Implement a Glob Pattern Matcher
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-81` — Implement a Sparse Array with Range Sum Queries
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-objects-and-records-82` — Implement a Deep Diff Function for Nested Objects
_exercise · hard · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-83` — Build a Type-Safe Event Emitter with Wildcard Support
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-interfaces-and-types-84` — Build a Type-Safe Event Emitter with Generics
_exercise · hard · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-85` — Build a Type-Safe Event Emitter with Generics
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-union-and-discriminated-unions-86` — Build a Type-Safe Event Bus with Discriminated Unions
_exercise · hard · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-promises-and-async-await-87` — Implement a Promise Pool with Concurrency Limit
_exercise · hard · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-iterators-and-generators-88` — Implement a Lazy Evaluation Pipeline with Generators
_exercise · hard · iterators and generators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-handling-89` — Build a Retry Mechanism with Exponential Backoff
_exercise · hard · error handling · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-closures-90` — Build a Composable Middleware Pipeline with Closures
_exercise · hard · closures · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-higher-order-functions-91` — Build a Function Composition Pipeline with Error Handling
_exercise · hard · higher-order functions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-92` — Implement a Regex-Like Pattern Matcher
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-93` — Implement a Sparse Array with Efficient Range Queries
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-objects-and-records-94` — Implement a Deep Diff Function for Nested Objects
_exercise · hard · objects and records · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-classes-95` — Build a Type-Safe Event Emitter with Once and Wildcard
_exercise · hard · classes · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-interfaces-and-types-96` — Build a Type-Safe Event Emitter with Generics
_exercise · hard · interfaces and types · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-generics-97` — Build a Type-Safe Event Emitter with Generics
_exercise · hard · generics · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-union-and-discriminated-unions-98` — Build a Type-Safe Event Dispatcher with Discriminated Unions
_exercise · hard · union and discriminated unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-promises-and-async-await-99` — Implement a Retry with Exponential Backoff
_exercise · hard · promises and async/await · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`


---

### challenges-zig-handwritten

- **Course title:** Zig Challenges
- **Language:** zig
- **Chapters / lessons:** 3 / 120
- **Translation units:** 600 (120 lessons × 5 locales)

**Pack-level:**
- [ ] challenges-zig-handwritten fully translated to `ru`
- [ ] challenges-zig-handwritten fully translated to `es`
- [ ] challenges-zig-handwritten fully translated to `fr`
- [ ] challenges-zig-handwritten fully translated to `kr`
- [ ] challenges-zig-handwritten fully translated to `jp`

**Per-lesson rows** — tick each locale when its part-list is fully translated into the lesson's `translations[<locale>]` overlay:

#### `hello` — Greeting
_exercise · easy · zig · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `add` — Add two numbers
_exercise · easy · zig · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `reverse_string` — Reverse a string
_exercise · easy · zig · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `is_palindrome` — Is it a palindrome?
_exercise · easy · zig · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `sum_array` — Sum an array
_exercise · easy · zig · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-11` — Sum Elements in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-13` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-12` — Find Maximum Value in Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comptime-7` — Compute Array Sum at Compile Time
_exercise · easy · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-6` — Safe Array Access
_exercise · easy · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-allocators-8` — Arena Allocator Lifecycle
_exercise · easy · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-10` — Count Enum Variants by Category
_exercise · easy · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tagged-unions-9` — Shape Area Calculator
_exercise · easy · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-16` — Unwrap or Default
_exercise · easy · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comptime-17` — Compile-Time Fibonacci
_exercise · easy · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-20` — Convert Day of Week to Number
_exercise · easy · enums · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-unions-15` — Parse Integer with Error Handling
_exercise · easy · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-14` — Create a Point2D Struct with Distance Method
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tagged-unions-19` — Shape Area Calculator
_exercise · easy · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-21` — Count Even Numbers in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-23` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-22` — Find Maximum in Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-allocators-18` — Track Total Bytes Allocated
_exercise · easy · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-24` — Calculate Rectangle Area
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-26` — Safe Division with Optionals
_exercise · easy · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comptime-27` — Comptime Factorial Array
_exercise · easy · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-allocators-28` — Allocate and Fill a Dynamic Array
_exercise · easy · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-slices-31` — Count Vowels in a Slice
_exercise · easy · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-unions-25` — Parse Temperature with Error Handling
_exercise · easy · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-30` — Parse Traffic Light Color
_exercise · easy · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tagged-unions-29` — Shape Area Calculator
_exercise · easy · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-arrays-32` — Find the Maximum Element in an Array
_exercise · easy · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-strings-33` — Count Vowels in a String
_exercise · easy · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-optionals-36` — Safely Unwrap Optional Integer
_exercise · easy · optionals · parts: title, body, hints (2)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-structs-34` — Calculate Rectangle Area
_exercise · easy · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-comptime-37` — Comptime Array Sum
_exercise · easy · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-error-unions-35` — Parse Temperature with Error Handling
_exercise · easy · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-enums-40` — Enum-Based Traffic Light State Machine
_exercise · easy · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-allocators-38` — Count Unique Words with Arena Allocator
_exercise · easy · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `easy-tagged-unions-39` — Parse Command-Line Flag
_exercise · easy · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-1` — Circular Buffer Slice Rotation
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-2` — Find Peak Element in Array
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-6` — Unwrap Optional Chain
_exercise · medium · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-unions-5` — Parse and Validate Configuration Values
_exercise · medium · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-3` — Find Longest Palindrome Substring
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comptime-7` — Comptime Array Statistics Generator
_exercise · medium · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-4` — Build a Dynamic Student Registry
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-10` — Tagged Union Message Parser
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tagged-unions-9` — Parse and Evaluate Simple Expressions
_exercise · medium · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-allocators-8` — Build a Fixed-Size Arena Allocator
_exercise · medium · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-unions-15` — Parse and Validate Port Numbers
_exercise · medium · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-11` — Sliding Window Maximum
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-13` — Compress Repeated Characters
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-12` — Find All Missing Numbers in Range
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-16` — Unwrap Nested Optionals
_exercise · medium · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-14` — Implement a Simple Priority Queue with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-22` — Find Missing Number in Sequence
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tagged-unions-19` — Parse and Evaluate Simple Arithmetic Expressions
_exercise · medium · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-21` — Rotate Slice Elements
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comptime-17` — Comptime Type-Safe Bit Field Builder
_exercise · medium · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-20` — Implement a Traffic Light State Machine
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-23` — Count Substring Occurrences (Overlapping)
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-24` — Binary Tree Node Count
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-unions-25` — Parse and Validate Config Entries
_exercise · medium · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-allocators-18` — Custom Arena Allocator with Reset
_exercise · medium · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comptime-27` — Comptime Fibonacci Sequence Generator
_exercise · medium · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-26` — Chain Optional Transformations
_exercise · medium · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-30` — Enum-Based State Machine Validator
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tagged-unions-29` — Parse and Evaluate Simple Expressions
_exercise · medium · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-arrays-32` — Find Missing Number in Sequence
_exercise · medium · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-slices-31` — Rotate Slice Elements Left by K Positions
_exercise · medium · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-allocators-28` — Memory Pool with Custom Allocator
_exercise · medium · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-optionals-36` — Chain Optional Operations
_exercise · medium · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-strings-33` — Count Character Frequencies in a String
_exercise · medium · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-error-unions-35` — Safe Division with Error Handling
_exercise · medium · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-structs-34` — Implement a Ring Buffer with Structs
_exercise · medium · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-comptime-37` — Comptime String Validation and Transformation
_exercise · medium · comptime · parts: title, body, hints (4)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-tagged-unions-39` — Parse and Evaluate Simple Expressions
_exercise · medium · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-allocators-38` — Implement a Fixed-Size Arena Allocator
_exercise · medium · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `medium-enums-40` — Parse and Evaluate HTTP Status Codes
_exercise · medium · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-2` — Longest Increasing Subsequence Length
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-slices-1` — Sliding Window Maximum with Deque
_exercise · hard · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-unions-5` — Nested Error Recovery with Custom Error Sets
_exercise · hard · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-comptime-7` — Comptime Type-Level Fibonacci Sequence
_exercise · hard · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-3` — UTF-8 String Reversal with Grapheme Awareness
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-4` — Implement a Generic Memory Pool Allocator
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-optionals-6` — Build a Lazy Optional Chain Evaluator
_exercise · hard · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tagged-unions-9` — Expression Evaluator with Tagged Unions
_exercise · hard · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-12` — Longest Increasing Subsequence
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-allocators-8` — Custom Arena Allocator with Reset and Alignment
_exercise · hard · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-10` — Implement a Tagged Union State Machine with Validation
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-13` — UTF-8 String Reversal with Grapheme Clustering
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-comptime-17` — Comptime Type-Level Fibonacci Sequence Generator
_exercise · hard · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-optionals-16` — Nested Optional Chain Resolver
_exercise · hard · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-14` — Implement a Thread-Safe Memory Pool Allocator
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tagged-unions-19` — Expression Evaluator with Tagged Unions
_exercise · hard · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-unions-15` — Build a Fallible Allocator Chain with Error Recovery
_exercise · hard · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-slices-21` — Implement In-Place Slice Rotation with Reversal
_exercise · hard · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-allocators-18` — Implement a Stack-Based Arena Allocator with Checkpoints
_exercise · hard · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-20` — Tagged Union State Machine with Memory
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-23` — UTF-8 Substring Indexing
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-optionals-26` — Optional Chain Validator with Error Recovery
_exercise · hard · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-24` — Generic Ring Buffer with Iterator
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-22` — Longest Increasing Subsequence with K Deletions
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-comptime-27` — Comptime Polynomial Evaluator with Type-Level Degree Checking
_exercise · hard · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-slices-31` — Implement In-Place Slice Rotation
_exercise · hard · slices · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-strings-33` — Longest Common Subsequence Length
_exercise · hard · strings · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-30` — Enum-Based Expression Evaluator with Error Handling
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tagged-unions-29` — Generic Expression Evaluator with Tagged Unions
_exercise · hard · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-arrays-32` — Kadane's Algorithm: Maximum Subarray Sum with Indices
_exercise · hard · arrays · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-allocators-28` — Implement a Stack-Based Arena Allocator
_exercise · hard · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-structs-34` — Generic Ring Buffer with Compaction
_exercise · hard · structs · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-comptime-37` — Comptime Type-Level Fibonacci Sequence
_exercise · hard · comptime · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-error-unions-35` — Error-Handling State Machine Parser
_exercise · hard · error unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-optionals-36` — Optional Chain Calculator with Error Recovery
_exercise · hard · optionals · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-40` — Tagged Union State Machine with Error Recovery
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tagged-unions-39` — Type-Safe Expression Evaluator with Tagged Unions
_exercise · hard · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-allocators-38` — Build a Growing Arena Allocator
_exercise · hard · allocators · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-enums-40-2` — Tagged Union State Machine with Variant Payloads
_exercise · hard · enums · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

#### `hard-tagged-unions-39-2` — Parse and Evaluate Expression Tree
_exercise · hard · tagged unions · parts: title, body, hints (3)_
- [ ] `ru`
- [ ] `es`
- [ ] `fr`
- [ ] `kr`
- [ ] `jp`

