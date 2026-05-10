# Book Cover Prompts — GPT Image 2

Custom cover-art prompts for every course Libre ships, written in the same ribbon-glassmorphism vocabulary as the `libre_header.png` lockup (3D coral/amber ribbon-snake on a warm cream backdrop with floating glass squircles and soft rim light).

Coverage: **51 covers** spanning eight long-form sections plus the full challenge-pack roster.

## Generator settings

- **Model**: `gpt-image-2` (or whatever the current high-fidelity image gen is)
- **Aspect ratio**: 2:3 portrait, **1024 × 1536** is what these prompts target. Resize down to 360 × 540 for the bundle (`scripts/extract-starter-courses.mjs` does this with quality 72 baseline JPEG).
- **Output**: PNG with transparent / soft background OK; the extract pipeline composites over the dark library surface.
- **Title text**: leave a **clear band in the lower third** of the cover for the typeset title we add at extract time. Don't render the course title inside the image — we composite it on top so we can tweak typography and localise without re-rolling artwork.

## Shared style preamble

Every prompt below leads with the same paragraph so the family reads as one set. Copy-paste the preamble plus the course-specific block.

> A 3D coral-orange ribbon — the Libre.academy brand mark — sculpted into a hero shape against a warm cream-peach backdrop with a sunlit rim glow from the upper right. Floating frosted-glass squircles drift in soft parallax behind the ribbon, catching highlights like glass panels. The ribbon has a glossy lacquer finish: deep crimson shadows along the inside curls, sun-orange midtones, and pale cream highlights along the top edges; soft pink sub-surface glow where the ribbon thins. A subtle magenta cast-shadow falls onto the cream floor below. Composition is portrait orientation, 2:3 aspect ratio, hero shape centred in the upper two-thirds with empty cream space in the lower third reserved for typeset title text. Photorealistic 3D render, cinematic key-light, 35mm depth of field, glassmorphism aesthetic, no text rendered inside the image, no logos, no watermarks.

---

## Long-form courses

### Flagship in-house tutorials

#### 1. A to Zig — `a-to-zig.png`
> Hero shape: the coral ribbon coils into the lowercase letter **"z"** with sharp diagonal strokes, the bottom serif tapering into a slim ribbon-snake head with two tiny black bead eyes and a forked highlight along its back. The angular Z form contrasts with the surrounding squircles. Behind it, one of the glass panels reflects a faint silhouette of a stylised mountain — a quiet nod to Zig's official mountain-peak motif.

#### 2. A to TS — `a-to-ts.png`
> Hero shape: the ribbon flows into a stacked **"TS"** monogram, the T's crossbar arching gently and the S forming a single graceful curl. Both letterforms share one continuous ribbon — no breaks. A subtle azure inner glow where the cream floor reflects up onto the ribbon's underside (a quiet nod to TypeScript's blue without departing from the orange family). Glass squircles behind carry faint angled-bracket etchings as decorative caustics.

#### 3. Learning Ledger — `learning-ledger.png`
> Hero shape: the ribbon wraps around and through a **floating hardware-wallet device** — a slim stainless-steel rectangle with a small grayscale OLED screen on top and a single physical button on the side, levitating at a 3/4 angle. The ribbon enters from the lower-left, threads through the device's USB-C port, and exits over the top edge curling into a tight ribbon-snake head. A second glass squircle behind the device shows a faint circuit-trace pattern. The device casts a sharper, cooler shadow than the warm ribbon shadow.

### Rust deep dives

#### 4. The Rust Programming Language — `the-rust-programming-language.png`
> Hero shape: the ribbon is sculpted into the silhouette of a **stylised crab** — Ferris-like but rendered entirely from one continuous coiled coral ribbon, no literal crab features. Two small ribbon-tipped claws raised, eight ribbon legs tucked beneath, a friendly highlight where the eyes would sit. Slightly deeper crimson saturation than the other covers in the set — Rust's brick-red brand colour bled subtly into the orange. A bronze gear reflection visible inside one of the background glass squircles.

#### 5. Rust by Example — `rust-by-example.png`
> Hero shape: a **stack of three small ribbon "code-snippet" tiles** arranged like cards fanned across a desk in 3/4 view, each tile a flat ribbon-rectangle with subtle bevelled edges and faint bracket-glyph caustics across its face (no readable text, just typographic texture). A tiny ribbon-Ferris crab — a smaller cousin of the TRPL cover's crab — perches on top of the topmost tile, friendly and curious. Brick-red sub-surface glow inside the tiles. The cards' own warm shadows fall onto the cream floor in a slightly fanned overlap.

#### 6. The Async Book (Rust) — `the-async-book-rust.png`
> Hero shape: the ribbon ties a **trefoil knot** that loops back on itself in two crossing directions — futures branching and rejoining. The knot's central crossing is the visual hero; a small ribbon-Ferris crab nests inside one of the loops, looking on. Brick-red sub-surface glow on the outer ribbon, with a cooler teal cast inside the inner crossings (a hint of "cancellation/wake" energy). The knot floats above the cream floor, casting a complex cast-shadow that traces the topology of the crossings.

#### 7. The Rustonomicon — `the-rustonomicon.png`
> Hero shape: a **closed grimoire-style book** rendered in coral ribbon — flat-lying tome at a 3/4 angle, ribbon-leather spine with three faint ribbon-bands, a small ribbon-Ferris crab embossed on the cover with crimson runic glyphs glowing along the cover edge (just glow + abstract shapes, no readable letters). Deeper crimson saturation than the other Rust covers — this is "the dark side of Rust." Wisps of smoke-style ribbon curl up from the closed pages. The background glass squircles are slightly desaturated; one carries a faint pentagram-of-pointer-arrows caustic.

### CS fundamentals

#### 8. Composing Programs — `composing-programs.png`
> Hero shape: **two interlocking ribbon gears** meshing teeth-to-teeth, the larger gear behind and the smaller in front. Between them, suspended as if held by an invisible mechanism, a small **Greek λ (lambda) glyph** rendered in tighter ribbon. A faint cobalt-blue sub-surface glow inside the gears (Python's brand blue) bleeds through the orange surface; a hint of warm yellow caustic dances across the smaller gear (Python's secondary yellow). The gears imply functional composition without spelling it out.

#### 9. Algorithms (Erickson) — `algorithms-erickson.png`
> Hero shape: a **three-level binary tree** rendered from coral ribbon — one root node at the top, two children below it, two grandchildren below each child, all the nodes formed as small ribbon spheres connected by ribbon-arc edges. The ribbon-snake head emerges from the root node's top, looking up and to the right. A faint scarlet sub-surface glow inside the nodes (Erickson's distinctive scarlet cover). One background glass squircle carries a faint dotted comparison-swap diagram as decorative caustic.

#### 10. Open Data Structures — `open-data-structures.png`
> Hero shape: a **graph of five interconnected ribbon nodes** in 3/4 perspective — three nodes in front, two behind, each node a small ribbon sphere, connected by curving ribbon edges that thread through the cluster like a doubly-linked tangle. The ribbon-snake head emerges from one of the front nodes. Sage-green sub-surface glow inside the ribbon (academic-textbook restraint). The cluster casts a soft web-like shadow on the cream floor.

#### 11. Pro Git — `pro-git.png`
> Hero shape: a **branching git-log graph** rendered in coral ribbon — a vertical main branch with three commit-dot ribbon nubs, two side branches splitting off to the right and left, each carrying their own commit dots, with a merge ribbon arcing back into the main branch near the top. The ribbon-snake head emerges from the topmost commit dot. A burnt-orange Git brand glow inside the ribbon; the tip of the merge-arc carries a tiny ribbon "pull-request" arrow head. Background glass squircles reflect faint hash-prefix caustics.

### Languages & frameworks

#### 12. Learning Go — `learning-go.png`
> Hero shape: the ribbon coils into a stylised **gopher silhouette** — round body, two upright ears, friendly stance, all formed from one continuous folded ribbon with no facial features rendered (let the silhouette speak). A teal-cyan sub-surface glow from inside the ribbon's curls — a subtle nod to Go's brand cyan, peeking through the warm orange surface. One background glass squircle reflects a faint goroutine fan-out diagram (lines fanning from a single point) as caustic detail.

#### 13. Learning Svelte — `learning-svelte.png`
> Hero shape: the ribbon flows into a **stylised flame** — three teardrop ribbon-tongues licking upward, the central tongue tallest, the outer two curling slightly outward, all sharing one continuous folded ribbon base. The ribbon-snake head perches at the tip of the central tongue, looking up. Three small floating ribbon embers drift up around the upper background squircles. Vivid orange-red Svelte brand glow inside the ribbon.

#### 14. SolidJS Fundamentals — `solidjs-fundamentals.png`
> Hero shape: a **stylised atomic-orbital diamond** — three ribbon arcs forming an "X" shape that cross at the centre and open into elliptical orbits, with a small ribbon nucleus sphere at the crossing. Each orbit is one continuous ribbon arc. Cobalt-blue sub-surface glow inside the orbits (Solid's brand blue). The ribbon-snake head peers out from one of the orbital arcs at the upper right. Background squircles reflect faint orbital-trace caustics.

#### 15. HTMX Fundamentals — `htmx-fundamentals.png`
> Hero shape: a **closed-loop arrow chain** — two thick coral ribbon arrows curving in a clockwise circle, head-to-tail, suggesting request→response→swap→request. Each arrow is one continuous folded ribbon with chevron-tipped heads. The ribbon-snake head replaces one of the arrowheads, peering inward at the loop. A faint slate-blue sub-surface glow inside the ribbon (HTMX's brand slate). Background squircles carry faint dotted-line connection caustics.

#### 16. Astro Fundamentals — `astro-fundamentals.png`
> Hero shape: a **shooting star with a long tapering ribbon trail** — the star itself a five-pointed ribbon glyph at the upper-left, the trail sweeping down and to the right in a graceful arc, fading into ribbon wisps as it tapers. The ribbon-snake head forms the trailing tip, looking back toward the star. A magenta-purple sub-surface glow inside the ribbon (Astro's brand magenta). Three small floating ribbon stars scattered across the background squircles.

#### 17. React Native — `react-native.png`
> Hero shape: a **floating phone outline rendered in ribbon** — slim rounded-rectangle frame at a 3/4 angle, with a stylised React atom-orbit logo inside formed by three ribbon ellipses crossing at the screen's centre point. The ribbon-snake head emerges from the top of the phone like an antenna, curling forward. Light-cyan React-brand sub-surface glow inside both the frame and the orbits. One background squircle reflects a faint mobile-status-bar pattern as caustic.

#### 18. Tauri 2 Fundamentals — `tauri-2-fundamentals.png`
> Hero shape: a **window frame in ribbon** — slim rectangular frame with three small ribbon traffic-light dots in the upper-left corner (closed/min/max), and inside the frame a tiny ribbon-Ferris crab (Tauri = Rust desktop) perched at the centre. The frame floats at a 3/4 angle. Sun-yellow sub-surface glow inside the frame (Tauri's brand yellow), brick-red glow inside the crab. The ribbon-snake head emerges from the upper-right corner of the frame, looking outward.

### Web3 / blockchain / crypto

#### 19. Mastering Bitcoin — `mastering-bitcoin.png`
> Hero shape: the ribbon forms the **Bitcoin "₿"** glyph — the vertical stem with the two horizontal serifs at top and bottom, and the two stacked half-loops on the right side, all rendered as one continuous folded coral ribbon. Pumpkin-orange saturation pushed slightly warmer than the base palette to match Bitcoin's brand orange. A subtle hash-pattern caustic inside the background glass squircles (looks like 64-character hex but unreadable, just texture). One floating coin disc behind the glyph reflects a faint sun.

#### 20. Programming Bitcoin — `programming-bitcoin.png`
> Hero shape: the ribbon forms a **smaller Bitcoin ₿ glyph in the foreground**, with a thin coiled ribbon-snake (paying homage to Python — the language the book teaches in) woven loosely through the two right-side loops of the ₿. The python-ribbon is a discrete, slightly tighter coil than the main ribbon — a subtle "two threads, one cover" effect. Pumpkin-orange Bitcoin saturation; a hint of Python yellow inside the python-ribbon. Background squircles carry the same hex-string caustics as Mastering Bitcoin so the two covers visually rhyme.

#### 21. Mastering Lightning Network — `mastering-lightning-network.png`
> Hero shape: a **branching lightning bolt** rendered in coral ribbon — a sharp jagged stroke down the centre, with two smaller forks splitting off the main stroke (channel branches) and ending in tiny ribbon-node dots (channel endpoints). The bolt is one continuous folded ribbon with hard 60° folds. Bright electric-yellow sub-surface glow inside the ribbon, intensifying near the forks. The ribbon-snake head replaces the topmost endpoint, looking down the bolt. Background squircles flicker with faint lightning-trace caustics.

#### 22. Mastering Ethereum — `mastering-ethereum.png`
> Hero shape: the ribbon forms the **Ethereum diamond** — two stacked four-sided pyramids meeting base-to-base, all rendered as one folded continuous ribbon with the inner diagonal facets implied by ribbon creases. The ribbon's interior gets a cool slate-blue inner glow (Ethereum's brand grey-blue) seen through the gloss, contrasting against the otherwise orange exterior. Behind the diamond, a faint hexagonal lattice pattern in one of the glass squircles. A second smaller diamond rests behind in soft focus.

#### 23. Vyper Fundamentals — `vyper-fundamentals-pythonic-smart-contracts.png`
> Hero shape: a **tightly coiled viper snake** rendered in coral ribbon — two stacked S-curves meeting at the centre, the upper curve raising into a striking viper-head pose with a faint diamond-pattern texture along the dorsal ridge. Tighter, more sinuous coils than the standard Libre ribbon. Forest-green sub-surface glow inside the ribbon (Vyper's brand green). The viper's head is the ribbon-snake head's stylised cousin — same family, different mood. Background squircles reflect faint contract-call traces.

#### 24. Solana Programs — `solana-programs-rust-on-the-svm.png`
> Hero shape: **three diagonal parallel ribbon bars** — Solana's signature graphic — stacked at a 30° angle from upper-left to lower-right, each bar a flat ribbon panel with subtle bevelled edges. A tiny ribbon-Ferris crab perches on the topmost bar (Solana programs are written in Rust). The ribbon-snake head curls out from the lower-right end of the bottommost bar. A magenta-to-teal gradient sub-surface glow inside the bars (Solana's signature gradient). Background squircles reflect faint validator-mesh caustics.

#### 25. viem & ethers.js — `viem-and-ethers-js-talking-to-ethereum-from-typescript.png`
> Hero shape: **a small Ethereum diamond on the left**, **a small JS curly-brace pair on the right**, connected across the middle by a single arcing ribbon "wire" that bridges them — the ribbon enters the diamond at one corner, exits at another, swoops across the gap, and curls into the curly braces. The ribbon-snake head emerges from one of the curly-brace tips, looking back toward the diamond. Slate-blue Ethereum glow inside the diamond, sun-yellow JS glow inside the braces, the bridging ribbon catches both as it crosses. A "TS" caustic faintly visible in one of the background squircles to nod at the TypeScript surface.

#### 26. Cryptography Fundamentals — `cryptography-fundamentals-hashes-to-zk.png`
> Hero shape: a **skeleton-key shape** rendered in coral ribbon — a long ribbon shaft with a circular ribbon bow at the top and a simple two-tooth ribbon bit at the bottom. A tiny ribbon-padlock dangles from the bow. Slate-grey sub-surface glow inside the key (matrix-feel restraint), with a subtle neon-green caustic at the keyhole and on the padlock's shackle (zero-knowledge "succeeded" cue). The ribbon-snake head replaces one of the bit's teeth, peering forward. Background squircles flicker with faint hex-digest caustics.

### Trading

#### 27. HelloTrade — `hellotrade.png`
> Hero shape: the ribbon flows into a **rising candlestick chart curve** — three or four discrete candlestick bars formed from short ribbon segments standing upright, connected by a thin spline of ribbon that traces an upward zigzag like a price chart. The ribbon-snake head perches at the top of the rightmost candle, looking up. A faint dotted grid (chart axes) is etched onto the largest background glass squircle. Greens and reds (typical bull/bear candle colours) hint inside the candle ribbon segments without dominating — just a tinge.

---

## Challenge packs

Each challenge pack is a tighter, more graphic single-symbol cover so the long row reads as a unified set on the library shelf.

### Original handwritten (legacy naming)

#### 28. JavaScript Challenges — `javascript-challenges.png`
> Hero shape: a **pair of ribbon curly braces** `{ }` standing upright in the centre, slightly tilted toward each other, the left brace's spine arching one way, the right's arching the other. Both are one continuous folded ribbon. Sun-yellow sub-surface glow inside the braces (JS's brand yellow). The ribbon-snake head curls down from the top of the right brace. Background squircles carry a faint "JS" letterform caustic, just enough to read as language identity.

#### 29. TypeScript Challenge Pack — `typescript-challenge-pack.png`
> Hero shape: the ribbon forms a **bold "TS" monogram** — tighter and more graphic than the A-to-TS hero, with the T flat-roofed and the S a single hard curve. Cobalt-blue sub-surface glow inside the ribbon (TypeScript's brand blue). The ribbon-snake head replaces the right tip of the T's crossbar, peering rightward. One background squircle reflects faint angle-bracket-and-colon caustics (`<T>:` motif).

#### 30. Python Challenges — `python-challenges.png`
> Hero shape: a **single coiled python snake** rendered in coral ribbon — three stacked S-curves spiralling tightly with a raised head at the top, paying homage to Python's two-snake brand mark while keeping the Libre ribbon-snake's friendly demeanour. A subtle yellow-blue gradient inside the ribbon (Python's signature dual-tone). The ribbon's body shows faint scale-pattern caustics on its dorsal side.

#### 31. Go Challenges — `go-challenges.png`
> Hero shape: a **smaller, more graphic ribbon-gopher silhouette** than Learning Go's hero — a tighter pose, just head and torso, gesturing one ribbon-paw forward in a friendly wave. Single-glance read. Cyan sub-surface glow inside the ribbon. The gopher's face has only a hint of an eye-spot.

#### 32. Rust Challenges — `rust-challenges.png`
> Hero shape: a **smaller ribbon-Ferris crab** holding a tiny ribbon wrench across one of its raised claws. Friendlier and more graphic than TRPL's hero — single-glance read on the shelf. Brick-red sub-surface glow inside the ribbon. A bronze-gear caustic appears inside one of the background squircles to echo the original Rust cover.

#### 33. React Native Challenges — `react-native-challenges.png`
> Hero shape: a **smaller ribbon phone outline** with a single ribbon React-atom orbit inside (one ellipse instead of three), more graphic than the React Native book hero. Light-cyan sub-surface glow. The ribbon-snake head curls out from the top-right corner of the phone like a small antenna.

#### 34. C Challenges — `c-challenges.png`
> Hero shape: a **single bold ribbon "C" letterform** — a thick three-quarter ring of ribbon with the opening on the right side, the upper and lower terminals tapered into chiselled serifs. A tiny ribbon wrench rests at the inner curve, suggesting low-level toolwork. Slate-blue sub-surface glow inside the ribbon (C's traditional palette). The ribbon-snake head emerges from the upper terminal, looking down.

#### 35. C++ Challenges — `cpp-challenges.png`
> Hero shape: a **ribbon "C" letterform** (matching the C-Challenges cover for visual rhyme) with **two small ribbon plus-signs stacked diagonally** at its top-right edge, suggesting "C++". Each plus-sign is two short folded ribbon segments crossing at right angles. Royal-blue sub-surface glow inside the ribbon (C++'s brand blue). Background squircles reflect faint pointer-arrow caustics.

#### 36. Java Challenges — `java-challenges.png`
> Hero shape: a **steaming coffee cup** — a curvy ribbon mug at a 3/4 angle, three thin ribbon steam-wisps curling upward from its rim, fading into ribbon-tendrils as they rise. The mug's handle is a single graceful folded ribbon arc. The ribbon-snake head peers over the rim. Cinnamon-brown sub-surface glow inside the mug (Java's brand earthy tone). One background squircle reflects a faint coffee-bean ring.

#### 37. Kotlin Challenges — `kotlin-challenges.png`
> Hero shape: a **stylised ribbon "K" letterform** — a vertical spine with two diagonal arms, the upper arm folding forward at a sharp angle and the lower arm stretching outward, all sharing one continuous ribbon. A faint triangular cut-out is implied between the spine and the upper arm (Kotlin's signature K-glyph negative space). Royal-purple sub-surface glow inside the ribbon (Kotlin's brand purple). The ribbon-snake head crowns the top of the spine.

#### 38. C# Challenges — `csharp-challenges.png`
> Hero shape: a **ribbon musical-sharp sign (♯)** — two slim vertical ribbon-bars crossed by two slim diagonal ribbon-bars rising from lower-left to upper-right, the diagonals slightly thicker than the verticals. Royal-purple sub-surface glow inside the ribbon (C#'s brand purple). The ribbon-snake head emerges from the upper end of the right vertical bar. Background squircles reflect faint dotnet-loop caustics.

#### 39. Swift Challenges — `swift-challenges.png`
> Hero shape: a **swift bird in flight** rendered in coral ribbon — wings swept back, body streamlined, as if mid-dive at a 30° downward angle. The bird's tail tapers into ribbon-feather tips; the head leads forward into a small ribbon-snake-head silhouette (the family signature). Vivid orange Swift brand glow inside the ribbon (slightly warmer than the base palette). Two faint motion-line caustics streak behind the bird through the background squircles.

#### 40. Assembly Challenges (ARM64 macOS) — `assembly-challenges-arm64-macos.png`
> Hero shape: a **stack of three short ribbon "instruction-row" tiles** at a 3/4 angle, each tile a slim flat ribbon-rectangle with subtle bevelled edges. A pattern of small ribbon dots and dashes runs across each tile (binary-like, but unreadable — just texture). The ribbon-snake head emerges from the top tile, looking outward. Slate-grey sub-surface glow inside the tiles (low-level restraint). One background squircle reflects a faint stylised ARM64 register diagram as caustic.

### 2026 expansion

#### 41. Ruby Challenges — `challenges-ruby-handwritten.png`
> Hero shape: the ribbon wraps around and through a **floating faceted ruby gemstone** — classic emerald-cut, cut from translucent crimson glass, internal facets refracting the warm key light. The ribbon enters from the lower-left, loops once around the stone's middle, and exits curling into a small ribbon-snake head over the upper-right facet. Crimson sub-surface scatter inside the gem. The cream floor catches faint pink prismatic light from the gem.

#### 42. Lua Challenges — `challenges-lua-handwritten.png`
> Hero shape: the ribbon coils into a **crescent moon** ("lua" means moon in Portuguese) — a gentle waxing-crescent silhouette formed by one fluid loop of the ribbon, the inner curve facing right. Cool indigo-violet glow inside the ribbon's curls (the moonlight cast against the warm sun-orange exterior). Three small floating ribbon dots, like stars, scattered around the upper background squircles.

#### 43. Dart Challenges — `challenges-dart-handwritten.png`
> Hero shape: the ribbon is cast as a **dart in mid-flight** — a slim cylindrical shaft with three ribbon-feathers fanning out at the back end, the sharp point at the front-right end formed by a tightly tapered ribbon-snake head. The dart hovers at a 25° upward angle as if mid-throw, motion-line caustics streaking through the background squircles. A faint cyan inner glow (Dart's brand teal) inside the feathers.

#### 44. Haskell Challenges — `challenges-haskell-handwritten.png`
> Hero shape: the ribbon forms the **Greek letter "λ" (lambda)** — the diagonal upstroke and the two diagonal downstrokes, one short, one long, all rendered from one folded continuous coral ribbon. Pure typographic clarity, hero-sized in the centre. A faint indigo-purple gradient inside the ribbon (Haskell's brand purple) reads as a hint of the language's identity through the orange. One background glass squircle reflects a faint chain of `>>=` (bind operator) symbols as caustic decoration.

#### 45. Scala Challenges — `challenges-scala-handwritten.png`
> Hero shape: the ribbon climbs as a set of **three-step stairs** ("scala" means stairs in Italian) — three rectangular ribbon panels stepping diagonally up-right, each with subtle bevelled edges. The ribbon-snake head emerges from the topmost step's edge, looking up the next imagined step. A faint scarlet-red highlight inside the ribbon (Scala's brand red) contrasts the orange exterior. Functional-symmetry: all three steps the same height + tread depth.

#### 46. SQL Challenges — `challenges-sql-handwritten.png`
> Hero shape: the ribbon wraps around a **stack of three transparent glass cylinders** (database disk-stack icon) — each cylinder a flat horizontal disc 30% taller than its caps would suggest, stacked with thin gaps. The coral ribbon enters from the lower-left, spirals once around the middle cylinder, and exits over the top into a tight ribbon-snake head. The cylinders are pale-amber tinted glass refracting the cream floor. Faint table-row caustics (horizontal lines at regular intervals) etched into the largest background glass squircle.

#### 47. Elixir Challenges — `challenges-elixir-handwritten.png`
> Hero shape: the ribbon wraps around a **transparent laboratory flask** — Erlenmeyer-shaped, three-quarters full of bubbling violet liquid (Elixir's brand purple), wisps of pale steam curling upward. The coral ribbon enters from the lower-right, loops once around the flask's neck, and exits into a small ribbon-snake head perched on the rim peering down. Bubbles inside the flask rise as glass spheres. Pink cast-shadow falls under the flask onto the cream floor.

#### 48. Zig Challenges — `challenges-zig-handwritten.png`
> Hero shape: the ribbon executes a sharp **zigzag** — three angular folds at 60° angles, each fold catching the key-light differently so the surface alternates highlight-shadow-highlight. The bottom fold tapers into a slim ribbon-snake head pointing up-right. A faint amber gradient inside the ribbon (Zig's brand orange-yellow) intensifies the warmth slightly past the base palette. One of the background squircles is rotated 30° to echo the zigzag's geometric energy.

#### 49. Move Challenges — `challenges-move-handwritten.png`
> Hero shape: the ribbon traces a **bold rightward-pointing arrow** — a thick chevron-tipped arrow formed by one continuous folded ribbon, the arrowhead made of two short ribbon segments meeting at a sharp point. A subtle motion-blur trail of three smaller ghosted ribbons streaks behind the main arrow, fading into the cream backdrop. Slate-blue inner glow inside the ribbon (Move's brand slate). The arrow sits at a slight upward angle suggesting forward momentum.

#### 50. Cairo Challenges — `challenges-cairo-handwritten.png`
> Hero shape: the ribbon forms a **stylised pyramid** — three triangular faces visible in 3/4 view, all rendered from one folded continuous coral ribbon with the seam along the rightmost edge. The pyramid's apex peaks into a tightly tapered ribbon-snake head looking outward. Sun rays from the upper-right cast a long pyramid shadow leftward across the cream floor. Sandy-amber highlights inside the ribbon, deeper crimson shadows.

#### 51. Sway Challenges — `challenges-sway-handwritten.png`
> Hero shape: the ribbon forms a **swaying pendulum** — a slim ribbon shaft hanging from an unseen pivot above the frame, ending in a heavy ribbon-bob at the bottom shaped like a teardrop. The pendulum is captured mid-swing, leaning ~20° to the right, with two ghosted motion-trails ribbons fading behind it suggesting the previous frames of the swing. Forest-green sub-surface glow inside the ribbon (Sway's brand green). The cream floor catches a long, soft shadow tracing the swing's arc.

---

## After generation

1. Save each image as `<course-id>.png` directly into the project's `cover-overrides/` directory. The filename must match exactly — `a-to-zig.png`, `the-rust-programming-language.png`, etc. — so `extract-starter-courses.mjs` picks them up via the `cover-overrides/<id>.png` lookup. The full filename for each cover is shown next to the heading above.
2. Run `npm run starter:web` from the project root. The script copies each override into `public/starter-courses/<id>.jpg` after resizing to 360 px wide and quality-72 JPEG.
3. Commit the new PNGs in `cover-overrides/` (git-tracked) — the JPEGs in `public/starter-courses/` regenerate from CI on every deploy, so they don't need committing.
4. To refresh local desktop installs and the bundled `.academy` archives in one go, run the same flow as the previous batch:
   ```bash
   # Refresh ~/Library/Application Support/com.mattssoftware.kata/courses/<id>/cover.jpg
   for png in cover-overrides/*.png; do
     id=$(basename "$png" .png)
     dir="$HOME/Library/Application Support/com.mattssoftware.kata/courses/$id"
     [ -d "$dir" ] && magick "$png" -resize 480x\> -strip -sampling-factor 4:2:0 -quality 85 "$dir/cover.jpg"
   done
   # Repack each .academy archive with the new cover.jpg embedded
   TMP=$(mktemp -d) && cd "$TMP"
   ROOT=$(git rev-parse --show-toplevel)
   for png in "$ROOT/cover-overrides/"*.png; do
     id=$(basename "$png" .png)
     archive="$ROOT/src-tauri/resources/bundled-packs/$id.academy"
     [ -f "$archive" ] || continue
     magick "$png" -resize 480x\> -strip -sampling-factor 4:2:0 -quality 85 cover.jpg
     zip -q -d "$archive" cover.jpg cover.png 2>/dev/null
     zip -q "$archive" cover.jpg
     rm -f cover.jpg
   done
   ```
5. Push to `main`; the marketing-site deploy workflow picks up the new artwork on the next run.

## Naming aliases (Discover-tab IDs that share existing prompts)

The Discover tab on desktop reads bundled archives' inner `course.json` ids, which use a longer naming convention than the short-form ids in `ALL_PACK_IDS` and the prompt headings above. The **cover artwork is shared** — each long-form name reuses the prompt + generated PNG of its short-form twin. When you regenerate a cover, drop the same image into `cover-overrides/` under both names (or rely on the build script's alias map, which writes both per-name copies into `public/starter-courses/`).

| Long-form (Discover inner id) | Reuses prompt for |
| --- | --- |
| `challenges-javascript-handwritten`     | #28 JavaScript Challenges (`javascript-challenges.png`) |
| `challenges-typescript-mo9c9k2o`         | #29 TypeScript Challenge Pack (`typescript-challenge-pack.png`) |
| `challenges-python-handwritten`          | #30 Python Challenges (`python-challenges.png`) |
| `challenges-go-handwritten`              | #31 Go Challenges (`go-challenges.png`) |
| `challenges-go-mo9kijkd`                 | #31 Go Challenges (auto-gen variant — same cover as `go-challenges`) |
| `challenges-rust-handwritten`            | #32 Rust Challenges (`rust-challenges.png`) |
| `challenges-rust-mo9bapm1`               | #32 Rust Challenges (auto-gen variant — same cover as `rust-challenges`) |
| `challenges-reactnative-handwritten`     | #33 React Native Challenges (`react-native-challenges.png`) |
| `challenges-c-handwritten`               | #34 C Challenges (`c-challenges.png`) |
| `challenges-cpp-handwritten`             | #35 C++ Challenges (`cpp-challenges.png`) |
| `challenges-java-handwritten`            | #36 Java Challenges (`java-challenges.png`) |
| `challenges-kotlin-handwritten`          | #37 Kotlin Challenges (`kotlin-challenges.png`) |
| `challenges-csharp-handwritten`          | #38 C# Challenges (`csharp-challenges.png`) |
| `challenges-swift-handwritten`           | #39 Swift Challenges (`swift-challenges.png`) |
| `challenges-assembly-handwritten`        | #40 Assembly Challenges (`assembly-challenges-arm64-macos.png`) |
| `rustonomicon`                           | #7 The Rustonomicon (`the-rustonomicon.png`) |
| `solana-programs`                        | #24 Solana Programs (`solana-programs-rust-on-the-svm.png`) |

The mapping lives in `scripts/extract-starter-courses.mjs`'s alias loop — same map the cover-deploy script uses to keep `~/Library/Application Support/.../courses/<id>/cover.jpg` in sync with the `.academy` archive's embedded cover.jpg.

## Removed / retired courses

These ids appear in legacy prune lists (`webSeedCourses.ts` LEGACY_STARTER_IDS, `extract-starter-courses.mjs` LEGACY_PACK_IDS) so first-launch on returning installs cleans them up; they no longer ship and don't need cover prompts.

- `eloquent-javascript` — retired 2026-05-07; coverage replaced by the in-house **A to TS** course (#2). Tree-node lesson links have been stripped from `src/data/trees/functional.ts`, `foundations.ts`, and `web.ts`; the local install dir is removed; the bundled archive was never present.
- `python-crash-course` — retired 2026-05-07; superseded by **Composing Programs** (#8) in the foundations slot.
- `the-modern-javascript-tutorial-fundamentals`, `you-don-t-know-js-yet`, `learning-zig`, `crafting-interpreters-javascript`, `learning-react-native`, `fluent-react`, `interactive-web-development-with-three-js-and-a-frame` — retired in the same 2026-05-07 cleanup. Replaced or implicitly covered by the in-house "A to <lang>" tutorials and the 2026 expansion challenge packs.

## Iteration tips

- The shared preamble keeps the set visually unified. If a generated cover drifts (wrong colour temperature, missing glass squircles, ribbon too thin), regenerate with the preamble re-emphasised at the end of the prompt as a reminder.
- Keep text out of the image — the title is composited at render time from `course.title`. If GPT Image 2 sneaks in stylised letters, regenerate with "no text, no letterforms, no calligraphy, no glyphs" appended.
- The ribbon-snake head is the brand's signature anchor. If a cover's shape doesn't have a natural place for it, hide it inside a fold of the hero shape or replace it with a small ribbon curl in the same position — but don't drop it entirely, or the cover loses its family resemblance.
- Crimson/sun-orange/cream is the base palette. Any language-specific colour tint (TypeScript blue, Rust brick, Go cyan, Haskell purple, Solidity slate, Python yellow-blue, etc.) should be a SUB-SURFACE GLOW seen through the ribbon, not a recolouring of the ribbon itself. The exterior always reads orange.
- Pairs / families intentionally rhyme (Mastering Bitcoin ↔ Programming Bitcoin, TRPL ↔ Rust Challenges, Learning Go ↔ Go Challenges, A to TS ↔ TypeScript Challenges, etc). When iterating, regenerate the rhyming pair together so they read as siblings rather than cousins.
