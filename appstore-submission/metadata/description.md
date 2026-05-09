# Description, promotional text, keywords

## Promotional Text (170 char max)

Editable any time without a new submission — useful for "what's new this month" without burning a release. Keep it punchy.

```
Now with HelloTrade — a 51-lesson decentralized perpetuals course with a built-in Postman-style API tester. Tap a request, see real responses, no setup.
```
Length: 161/170.

## Description (4000 char max)

```
Libre turns the technical books on your shelf into runnable courses. Drop a PDF or EPUB in, and Libre splits it into lessons, generates exercises that compile and run on-device, and tracks your progress as you work through them. No quiz-app filler — every "did this make sense?" check is a real exercise with real tests, in the real language.

Eighteen courses ship in the box, including The Rust Programming Language, Mastering Bitcoin, Mastering Ethereum, A to Zig, A to TypeScript, Learning Go, and language-specific challenge packs for Ruby, Lua, Dart, Haskell, Scala, SQL, Elixir, Cairo, Move, Sway, and more. The ingest pipeline that built them is the same one available to you — feed it your own books and it returns courses with the same shape.

Highlights:

• Eighteen pre-loaded courses spanning systems languages, blockchain protocols, web frameworks, and CS fundamentals — all browser-runnable, no remote build server.

• Native code execution for Rust, Go, TypeScript, JavaScript, Python, Solidity, Lua, SQL, Svelte, React, three.js, HTMX, Astro, and Bun. Other languages run via official sandboxes (play.rust-lang.org, play.golang.org).

• HelloTrade course (NEW) — 51 lessons on decentralized perpetual futures: trading concepts (perps, leverage, liquidation, funding), the EIP-191/EIP-712/ERC-2612 signature scheme, and the WebSocket + REST APIs. Mounted above every lesson is a Postman-style API tester so you can fire real requests at a staging exchange while you read.

• Skill trees and tracks — pick a goal ("become a Rust systems programmer," "ship a Solana program") and Libre maps the cross-book path through the lessons that get you there.

• Practice — spaced-review surface that resurfaces quizzes and code puzzles from courses you've touched. Smart-mix mode pulls from due, weak-spots, and recent.

• AI tutor (optional) — local via Ollama, or cloud via your Anthropic key. Hits the lesson context so the help you get is about the lesson you're on, not generic.

• Audio narration — every reading lesson is narrated by an ElevenLabs voice. Pause / scrub / skim by section. Cached on first play, available offline after.

• Progress sync (optional) — sign in with Apple, Google, or email and Libre keeps streaks, completions, and library state in lockstep across iPhone, iPad, Mac, and the web build.

• Works offline — every bundled course runs entirely on-device. No login, no network, no telemetry. Cloud sync is opt-in and disclosed in App Privacy.

• Open content, open tooling — most bundled books are CC / MIT / Apache-licensed; attribution and source links are one tap away from any lesson. Libre is built on Tauri 2 and runs on iPad, iPhone, Mac, Windows, and the open web.

Drop in a Rust book and 30 minutes later you have a 100-lesson course with running code on every page.
```

(Length is around 2,650 characters — well under the 4,000 limit. Trim or expand on a per-release basis.)

## Keywords (100 char max, comma-separated, no spaces around commas)

Apple uses keywords plus the title + subtitle to drive search ranking. Don't repeat words from the title/subtitle (those already get full weight). Don't use other apps' brand names.

```
programming,coding,book,rust,javascript,python,go,solidity,bitcoin,ethereum,course,tutorial
```
Length: 99/100. (One char to spare; don't add another keyword without dropping one.)

Alternative if you want to lean into specific niches:

```
programming,rust,javascript,solana,ethereum,defi,trading,course,tutorial,ipad,coding,book
```

The current order biases broad-search terms at the front. Swap a few based on what's converting after a few weeks (App Store Connect → Analytics → Search shows which keywords drive impressions).

## What's New in This Version (per release, 4000 char)

For the first release, leave blank or use:

```
Welcome to Libre. This is the first public release.
```

For 0.1.16+, summarise the headlining changes — new courses, performance work, fixes. Recent commit subjects are a good seed:

```
• Library cold-load is now ~50% faster — covers shrunk to 360 px and the per-card fetch was rewritten to fan out off the critical path.
• Library ↔ Discover navigation no longer freezes on bigger libraries.
• HelloTrade course landed: 51 lessons on decentralized perpetuals + a Postman-style API tester docked above each lesson.
• Practice tab — spaced-review for quizzes + code puzzles from any course you've touched.
• Tracks page — curated linear paths through the trees, surfaced as its own rail entry.
• Mobile theme picker, pull-to-refresh on Library + Profile, iOS-friendly zoom and input behaviour.
```

Roughly 600 chars; stays under the limit and doesn't bury the lede.
