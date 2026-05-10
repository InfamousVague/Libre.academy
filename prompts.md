# Book Cover Prompts — GPT Image 2

Custom cover-art prompts for every course Libre ships, written in the same ribbon-glassmorphism vocabulary as the `libre_header.png` lockup (3D coral/amber ribbon-snake on a warm cream backdrop with floating glass squircles and soft rim light).

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

### 1. A to Zig — `a-to-zig.png`
> Hero shape: the coral ribbon coils into the lowercase letter **"z"** with sharp diagonal strokes, the bottom serif tapering into a slim ribbon-snake head with two tiny black bead eyes and a forked highlight along its back. The angular Z form contrasts with the surrounding squircles. Behind it, one of the glass panels reflects a faint silhouette of a stylised mountain — a quiet nod to Zig's official mountain-peak motif.

### 2. A to TS — `a-to-ts.png`
> Hero shape: the ribbon flows into a stacked **"TS"** monogram, the T's crossbar arching gently and the S forming a single graceful curl. Both letterforms share one continuous ribbon — no breaks. A subtle azure inner glow where the cream floor reflects up onto the ribbon's underside (a quiet nod to TypeScript's blue without departing from the orange family). Glass squircles behind carry faint angled-bracket etchings as decorative caustics.

### 3. Learning Ledger — `learning-ledger.png`
> Hero shape: the ribbon wraps around and through a **floating hardware-wallet device** — a slim stainless-steel rectangle with a small grayscale OLED screen on top and a single physical button on the side, levitating at a 3/4 angle. The ribbon enters from the lower-left, threads through the device's USB-C port, and exits over the top edge curling into a tight ribbon-snake head. A second glass squircle behind the device shows a faint circuit-trace pattern. The device casts a sharper, cooler shadow than the warm ribbon shadow.

### 4. The Rust Programming Language — `the-rust-programming-language.png`
> Hero shape: the ribbon is sculpted into the silhouette of a **stylised crab** — Ferris-like but rendered entirely from one continuous coiled coral ribbon, no literal crab features. Two small ribbon-tipped claws raised, eight ribbon legs tucked beneath, a friendly highlight where the eyes would sit. Slightly deeper crimson saturation than the other covers in the set — Rust's brick-red brand colour bled subtly into the orange. A bronze gear reflection visible inside one of the background glass squircles.

### 5. Learning Go — `learning-go.png`
> Hero shape: the ribbon coils into a stylised **gopher silhouette** — round body, two upright ears, friendly stance, all formed from one continuous folded ribbon with no facial features rendered (let the silhouette speak). A teal-cyan sub-surface glow from inside the ribbon's curls — a subtle nod to Go's brand cyan, peeking through the warm orange surface. One background glass squircle reflects a faint goroutine fan-out diagram (lines fanning from a single point) as caustic detail.

### 6. Mastering Bitcoin — `mastering-bitcoin.png`
> Hero shape: the ribbon forms the **Bitcoin "₿"** glyph — the vertical stem with the two horizontal serifs at top and bottom, and the two stacked half-loops on the right side, all rendered as one continuous folded coral ribbon. Pumpkin-orange saturation pushed slightly warmer than the base palette to match Bitcoin's brand orange. A subtle hash-pattern caustic inside the background glass squircles (looks like 64-character hex but unreadable, just texture). One floating coin disc behind the glyph reflects a faint sun.

### 7. Mastering Ethereum — `mastering-ethereum.png`
> Hero shape: the ribbon forms the **Ethereum diamond** — two stacked four-sided pyramids meeting base-to-base, all rendered as one folded continuous ribbon with the inner diagonal facets implied by ribbon creases. The ribbon's interior gets a cool slate-blue inner glow (Ethereum's brand grey-blue) seen through the gloss, contrasting against the otherwise orange exterior. Behind the diamond, a faint hexagonal lattice pattern in one of the glass squircles. A second smaller diamond rests behind in soft focus.

### 8. HelloTrade — `hellotrade.png`
> Hero shape: the ribbon flows into a **rising candlestick chart curve** — three or four discrete candlestick bars formed from short ribbon segments standing upright, connected by a thin spline of ribbon that traces an upward zigzag like a price chart. The ribbon-snake head perches at the top of the rightmost candle, looking up. A faint dotted grid (chart axes) is etched onto the largest background glass squircle. Greens and reds (typical bull/bear candle colours) hint inside the candle ribbon segments without dominating — just a tinge.

---

## Challenge packs

Each challenge pack is a tighter, more graphic single-symbol cover so the row of 11 reads as a unified set on the library shelf.

### 9. Ruby Challenges — `challenges-ruby-handwritten.png`
> Hero shape: the ribbon wraps around and through a **floating faceted ruby gemstone** — classic emerald-cut, cut from translucent crimson glass, internal facets refracting the warm key light. The ribbon enters from the lower-left, loops once around the stone's middle, and exits curling into a small ribbon-snake head over the upper-right facet. Crimson sub-surface scatter inside the gem. The cream floor catches faint pink prismatic light from the gem.

### 10. Lua Challenges — `challenges-lua-handwritten.png`
> Hero shape: the ribbon coils into a **crescent moon** ("lua" means moon in Portuguese) — a gentle waxing-crescent silhouette formed by one fluid loop of the ribbon, the inner curve facing right. Cool indigo-violet glow inside the ribbon's curls (the moonlight cast against the warm sun-orange exterior). Three small floating ribbon dots, like stars, scattered around the upper background squircles.

### 11. Dart Challenges — `challenges-dart-handwritten.png`
> Hero shape: the ribbon is cast as a **dart in mid-flight** — a slim cylindrical shaft with three ribbon-feathers fanning out at the back end, the sharp point at the front-right end formed by a tightly tapered ribbon-snake head. The dart hovers at a 25° upward angle as if mid-throw, motion-line caustics streaking through the background squircles. A faint cyan inner glow (Dart's brand teal) inside the feathers.

### 12. Haskell Challenges — `challenges-haskell-handwritten.png`
> Hero shape: the ribbon forms the **Greek letter "λ" (lambda)** — the diagonal upstroke and the two diagonal downstrokes, one short, one long, all rendered from one folded continuous coral ribbon. Pure typographic clarity, hero-sized in the centre. A faint indigo-purple gradient inside the ribbon (Haskell's brand purple) reads as a hint of the language's identity through the orange. One background glass squircle reflects a faint chain of `>>=` (bind operator) symbols as caustic decoration.

### 13. Scala Challenges — `challenges-scala-handwritten.png`
> Hero shape: the ribbon climbs as a set of **three-step stairs** ("scala" means stairs in Italian) — three rectangular ribbon panels stepping diagonally up-right, each with subtle bevelled edges. The ribbon-snake head emerges from the topmost step's edge, looking up the next imagined step. A faint scarlet-red highlight inside the ribbon (Scala's brand red) contrasts the orange exterior. Functional-symmetry: all three steps the same height + tread depth.

### 14. SQL Challenges — `challenges-sql-handwritten.png`
> Hero shape: the ribbon wraps around a **stack of three transparent glass cylinders** (database disk-stack icon) — each cylinder a flat horizontal disc 30% taller than its caps would suggest, stacked with thin gaps. The coral ribbon enters from the lower-left, spirals once around the middle cylinder, and exits over the top into a tight ribbon-snake head. The cylinders are pale-amber tinted glass refracting the cream floor. Faint table-row caustics (horizontal lines at regular intervals) etched into the largest background glass squircle.

### 15. Elixir Challenges — `challenges-elixir-handwritten.png`
> Hero shape: the ribbon wraps around a **transparent laboratory flask** — Erlenmeyer-shaped, three-quarters full of bubbling violet liquid (Elixir's brand purple), wisps of pale steam curling upward. The coral ribbon enters from the lower-right, loops once around the flask's neck, and exits into a small ribbon-snake head perched on the rim peering down. Bubbles inside the flask rise as glass spheres. Pink cast-shadow falls under the flask onto the cream floor.

### 16. Zig Challenges — `challenges-zig-handwritten.png`
> Hero shape: the ribbon executes a sharp **zigzag** — three angular folds at 60° angles, each fold catching the key-light differently so the surface alternates highlight-shadow-highlight. The bottom fold tapers into a slim ribbon-snake head pointing up-right. A faint amber gradient inside the ribbon (Zig's brand orange-yellow) intensifies the warmth slightly past the base palette. One of the background squircles is rotated 30° to echo the zigzag's geometric energy.

### 17. Move Challenges — `challenges-move-handwritten.png`
> Hero shape: the ribbon traces a **bold rightward-pointing arrow** — a thick chevron-tipped arrow formed by one continuous folded ribbon, the arrowhead made of two short ribbon segments meeting at a sharp point. A subtle motion-blur trail of three smaller ghosted ribbons streaks behind the main arrow, fading into the cream backdrop. Slate-blue inner glow inside the ribbon (Move's brand slate). The arrow sits at a slight upward angle suggesting forward momentum.

### 18. Cairo Challenges — `challenges-cairo-handwritten.png`
> Hero shape: the ribbon forms a **stylised pyramid** — three triangular faces visible in 3/4 view, all rendered from one folded continuous coral ribbon with the seam along the rightmost edge. The pyramid's apex peaks into a tightly tapered ribbon-snake head looking outward. Sun rays from the upper-right cast a long pyramid shadow leftward across the cream floor. Sandy-amber highlights inside the ribbon, deeper crimson shadows.

### 19. Sway Challenges — `challenges-sway-handwritten.png`
> Hero shape: the ribbon forms a **swaying pendulum** — a slim ribbon shaft hanging from an unseen pivot above the frame, ending in a heavy ribbon-bob at the bottom shaped like a teardrop. The pendulum is captured mid-swing, leaning ~20° to the right, with two ghosted motion-trails ribbons fading behind it suggesting the previous frames of the swing. Forest-green sub-surface glow inside the ribbon (Sway's brand green). The cream floor catches a long, soft shadow tracing the swing's arc.

---

## After generation

1. Save each image as `<course-id>.png` directly into the project's `cover-overrides/` directory. The filename must match exactly — `a-to-zig.png`, `the-rust-programming-language.png`, etc. — so `extract-starter-courses.mjs` picks them up via the `cover-overrides/<id>.png` lookup.
2. Run `npm run starter:web` from the project root. The script copies the override into `public/starter-courses/<id>.jpg` after resizing to 360 px wide and quality-72 JPEG.
3. Commit the new PNGs in `cover-overrides/` (git-tracked) — the JPEGs in `public/starter-courses/` regenerate from CI on every deploy, so they don't need committing.
4. Push to `main`; the marketing-site deploy workflow picks up the new artwork on the next run.

## Iteration tips

- The shared preamble keeps the set visually unified. If a generated cover drifts (wrong colour temperature, missing glass squircles, ribbon too thin), regenerate with the preamble re-emphasised at the end of the prompt as a reminder.
- Keep text out of the image — the title is composited at render time from `course.title`. If GPT Image 2 sneaks in stylised letters, regenerate with "no text, no letterforms, no calligraphy, no glyphs" appended.
- The ribbon-snake head is the brand's signature anchor. If a cover's shape doesn't have a natural place for it, hide it inside a fold of the hero shape or replace it with a small ribbon curl in the same position — but don't drop it entirely, or the cover loses its family resemblance.
- Crimson/sun-orange/cream is the base palette. Any language-specific colour tint (TypeScript blue, Rust brick, Go cyan, Haskell purple) should be a SUB-SURFACE GLOW seen through the ribbon, not a recolouring of the ribbon itself. The exterior always reads orange.
