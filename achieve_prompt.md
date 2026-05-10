# Achievement Badge Prompts — GPT Image 2

Custom badge artwork for every in-app achievement Libre awards, written in the same ribbon-glassmorphism vocabulary as the `libre_header.png` lockup and the course covers in [`prompts.md`](./prompts.md). The 3D coral/amber ribbon-snake forms the hero glyph, framed by a tighter glass-medallion shell and a quieter scattering of floating squircles.

Coverage: **50 badges** across ten themed cohorts (first steps, streaks, levels, course mastery, polyglot, HelloTrade & web3, quiz & practice, speed & marathons, crafting & sharing, and hidden wild-cards).

## Generator settings

- **Model**: `gpt-image-2` (or whatever the current high-fidelity image gen is)
- **Aspect ratio**: 1:1 square, **1024 × 1024** master. The runtime resizes down to **192 × 192 quality 80 baseline JPEG** for in-app rail/profile rendering and **96 × 96 quality 78** for inline strip thumbnails. The smaller display sizes drive every choice below — every hero shape has to read at 64-96 px without losing identity.
- **Output**: PNG with transparent / soft background OK; the in-app surface composites over a dark or theme-tinted plate. The cream-peach base inside the medallion stays in the asset.
- **No text inside the image.** Badge labels are typeset by the runtime so we can localise them through the same i18n channel that powers the rest of the app.

## Shared style preamble

Every prompt below leads with the same paragraph so the family reads as one set. Copy-paste the preamble plus the badge-specific block.

> A 3D coral-orange ribbon — the Libre.academy brand mark — sculpted into a single hero glyph at the centre of a square 1:1 frame. The hero sits inside a soft frosted-glass medallion ring (a slim translucent torus catching highlights from the upper-right rim light), set against a warm cream-peach backdrop with a sunlit glow. Two or three smaller floating frosted-glass squircles drift in soft parallax behind the medallion at gentle parallax angles — fewer than the cover compositions because the hero needs to read at 64 px. The ribbon has a glossy lacquer finish: deep crimson shadows along the inside curls, sun-orange midtones, and pale cream highlights along the top edges; soft pink sub-surface glow where the ribbon thins. A subtle magenta cast-shadow falls onto the cream floor below the medallion. Composition is square, hero glyph centred and filling roughly 70% of the frame, no text rendered inside the image, no logos, no watermarks. Photorealistic 3D render, cinematic key-light, 35mm depth of field, glassmorphism aesthetic.

> Read-at-small note: prefer one bold silhouette over multiple competing shapes. Background squircles stay desaturated and soft so the hero always wins the eye at thumbnail size.

---

## Cohort 1 — First steps

The "you opened the door" badges. Awarded for the first time a learner crosses each entry-point milestone. Visual common thread: the medallion ring is **thinner** than later cohorts, signalling a starter tier.

#### 1. First Lesson — `first-lesson.png`
> Hero shape: a small **open ribbon book** floating at a 3/4 angle inside the medallion — two cream-tinted ribbon pages spread open on a coral spine, ribbon bookmark trailing down from the centre, faint horizontal text-line caustics across the pages (no readable letters). The ribbon-snake head emerges from the bookmark's tail, looking up. A pale yellow rim glow on the open pages reads as "first light" without being literal.

#### 2. First Quiz — `first-quiz.png`
> Hero shape: a **shield-shaped ribbon plaque** with a single bold ribbon checkmark filling its centre. The shield's top edge curls into the ribbon-snake head, looking down at the check. Soft mint-green sub-surface glow inside the checkmark stroke (correct-answer cue) without dominating the orange surface. The medallion ring around the shield is thinner here — starter tier.

#### 3. First Run — `first-run.png`
> Hero shape: a **bold ribbon play-triangle** ▶ pointing right, all three corners gently rounded as if folded from one flat ribbon panel. The trailing edge of the triangle's hypotenuse curls outward into a small ribbon-snake head looking forward. A pale cyan sub-surface glow inside the triangle (terminal-cursor energy). One background squircle carries a faint blinking-cursor caustic (`▌`) for texture only.

#### 4. First Test Pass — `first-test-pass.png`
> Hero shape: a **half-laurel ribbon wreath** opening at the top — two coral ribbon branches arcing up from a base node, each branch tipped with three ribbon-leaf shapes. Where the branches would meet at the top, the ribbon-snake head emerges instead, looking up. A vivid emerald-green sub-surface glow inside the leaves (passing-test signal). The wreath frames a small empty cream centre — a "you earned the spot in the middle" gesture.

#### 5. First Course — `first-course.png`
> Hero shape: a **graduation cap rendered in ribbon** — square ribbon mortarboard at a 3/4 angle, slim ribbon tassel hanging off one corner, the tassel tip curling into the ribbon-snake head. The cap floats just above a small ribbon disc base. Pale violet sub-surface glow inside the underside of the cap (academic-purple cue). The thin starter-tier medallion ring frames it.

---

## Cohort 2 — Streaks

Showcases consistency. Visual common thread: the **flame** motif starts small and stacks taller as the streak length grows; the medallion ring fattens with each tier.

#### 6. Spark — 3-day streak — `streak-3.png`
> Hero shape: a **single small ribbon flame** with two teardrop-shaped tongues licking upward, the inner tongue taller than the outer. The base of the flame rests on a ribbon ember nub. A faint orange-red sub-surface glow inside the inner tongue. The ribbon-snake head curls up from the flame's base, looking at the flame. Three small floating ribbon embers drift around the upper background squircles (one per streak day).

#### 7. Habit — 7-day streak — `streak-7.png`
> Hero shape: a **ribbon flame with three rising tongues**, taller and broader than the Spark badge — central tongue dominant, two side tongues curling outward. Beneath the flame, an arc of **seven small ribbon dots** traces a partial halo. The ribbon-snake head replaces the rightmost dot. Saturated orange-red sub-surface glow inside the flame, with a faint amber halo on the dot arc.

#### 8. Fortnight — 14-day streak — `streak-14.png`
> Hero shape: the **three-tongue ribbon flame from Habit, paired with a slim ribbon crescent moon** floating above and to the right. The flame and the crescent share the same continuous ribbon — one folded path that traces the flame and then loops up to form the crescent. A single ribbon-star nub between them. The ribbon-snake head curls from the crescent's lower tip. Cool indigo sub-surface glow inside the crescent contrasts the flame's warm orange.

#### 9. Marathoner — 30-day streak — `streak-30.png`
> Hero shape: a **closed ribbon laurel wreath ring** — two coral branches meeting at the top with crossed leaf-tips, surrounding a small central ribbon flame with three tall tongues. The medallion ring is thicker here than the starter tier. Emerald-green sub-surface glow inside the laurel leaves; warm orange inside the central flame. The ribbon-snake head emerges from one of the crossed leaf-tips at the top of the wreath.

#### 10. Centenarian — 100-day streak — `streak-100.png`
> Hero shape: a **stylised ribbon sun** with a circular ribbon disc centre and **eight tapering ribbon rays** radiating outward in a balanced burst. Inside the central disc, a small embossed ribbon flame echoes the streak motif. The ribbon-snake head replaces one of the rays at the upper-right, curling back toward the disc. Deep saffron sub-surface glow inside the disc, intensifying along the ray tips. The medallion ring around the sun is the heaviest in the streak family — a "milestone" weight.

---

## Cohort 3 — Levels

XP-ladder badges. Visual common thread: a single ribbon **chevron** at low tiers, growing into stacked chevrons, then a star, a wreath, and finally a crown. Each tier's medallion ring carries a slim metallic accent — bronze, silver, gold, platinum, then iridescent.

#### 11. Apprentice (Lvl 5) — `level-5.png`
> Hero shape: a **single bold ribbon chevron** ▼ pointing down, formed by one folded coral ribbon with a sharp central crease. The chevron's lower point curls forward into the ribbon-snake head. Bronze sub-surface glow inside the chevron (apprentice tier). The medallion ring around it carries a faint bronze rim accent.

#### 12. Journeyer (Lvl 10) — `level-10.png`
> Hero shape: **two stacked ribbon chevrons** ▼▼ pointing down, the lower chevron slightly larger than the upper, both formed from one continuous folded ribbon path — the upper chevron's lower point flowing seamlessly into the lower chevron's upper edge. The lowest point curls into the ribbon-snake head. Steel sub-surface glow with a warm orange overcoat. The medallion's rim accent shifts to brushed silver.

#### 13. Adept (Lvl 25) — `level-25.png`
> Hero shape: a **three-pointed ribbon star** — sharp triangular star with one point at the top and two angled outward at the bottom, all formed from one folded ribbon with crisp creases. The bottom-right point extends into the ribbon-snake head. Sunshine-gold sub-surface glow inside the star. The medallion's rim accent is rich gold.

#### 14. Master (Lvl 50) — `level-50.png`
> Hero shape: a **closed ribbon laurel ring with a central node** — two laurel branches forming a complete ring, meeting at top and bottom, with a single ribbon orb suspended at the centre of the ring. The orb glows with a soft white-gold light. The ribbon-snake head emerges from one of the laurel-tip crossings at the top. Cool platinum sub-surface glow inside the laurel; warm gold inside the central orb. The medallion's rim accent is platinum.

#### 15. Sovereign (Lvl 100) — `level-100.png`
> Hero shape: a **ribbon crown** — a base band with three ascending ribbon points, the central point tallest, each tip topped by a tiny ribbon orb. The crown floats above a small ribbon laurel half-arc base. The ribbon-snake head replaces the central orb, looking up. Iridescent oil-slick sub-surface glow inside the crown — soft shifts between magenta, cyan, and gold as the ribbon curves catch the rim light. The medallion's rim accent is iridescent.

---

## Cohort 4 — Course mastery

Tracks completion across the catalog. Visual common thread: trophies, shelves, and reading totems.

#### 16. First Capstone — `capstone-first.png`
> Hero shape: a **classic two-handled trophy cup** in coral ribbon — a wide ribbon bowl with two graceful curving handles, sitting on a stout ribbon base. A tiny ribbon ribbon-bow drapes over the rim. The ribbon-snake head emerges from one of the handles, looking forward. Burnished-gold sub-surface glow inside the bowl. A faint sun-flare highlight on the cup's upper rim.

#### 17. Five Books — `books-5.png`
> Hero shape: a **stack of five ribbon book spines standing upright** in a row, each spine slightly different height and width, all parallel and seen straight-on. Faint ribbon-bands run horizontally across each spine (binding stripes). The leftmost spine's top curls forward into the ribbon-snake head. Each spine carries a different sub-surface tint — terracotta, mint, slate, amber, plum — but all unified by the coral surface gloss.

#### 18. Ten Books — `books-10.png`
> Hero shape: a **two-row ribbon shelf** — five spines on the upper shelf, five on the lower, separated by a slim ribbon shelf-board. Each row's spines stand at slight cant angles for rhythm. The rightmost spine of the upper row leans against an open ribbon book (tipped open, a closing companion). The ribbon-snake head emerges from the open book's bookmark.

#### 19. Pack Master — `pack-master.png`
> Hero shape: a **ribbon medallion with a 3×3 checkmark grid embossed on its face** — nine small bevelled square cells, each containing a tight ribbon checkmark. The medallion's rim is engraved with a slim laurel pattern. The ribbon-snake head emerges from the medallion's upper edge, peering down at the grid. Cool emerald sub-surface glow inside the checkmarks; warm amber along the medallion's rim.

#### 20. Tree Walker — finish a whole skill tree — `tree-walker.png`
> Hero shape: a **tall ribbon tree** with a slender vertical trunk and **seven ribbon-leaf branches** fanning outward in symmetric pairs, plus a topping leaf at the crown. Each leaf glows softly with a different language tint (a quiet polyglot nod). The trunk's base ribbon curls outward into the ribbon-snake head, looking up the trunk. A small ribbon root web grounds the tree on the cream floor.

---

## Cohort 5 — Polyglot

Cross-language milestones. Visual common thread: ribbons in increasing knot complexity, each tier weaves more strands.

#### 21. First Tongue — first language run — `polyglot-1.png`
> Hero shape: a **single ribbon glyph** — a stylised speech-balloon in coral ribbon with one rounded side and a small tail at the lower-left, floating at a slight 3/4 angle. Inside the balloon, a faint embossed `< >` caustic (no readable letters). The ribbon-snake head curls out from the balloon's tail. Pale cream sub-surface glow inside the balloon.

#### 22. Tri-Tongue — 3 languages — `polyglot-3.png`
> Hero shape: a **trefoil ribbon knot** — three ribbon loops interwoven in a triangular arrangement, each loop a slightly different tint (warm orange, mint green, slate blue) but all sharing the coral lacquer surface. Where the three loops cross at the centre, a small ribbon orb glows. The ribbon-snake head emerges from one of the loops at the upper-right.

#### 23. Penta-Tongue — 5 languages — `polyglot-5.png`
> Hero shape: a **five-pointed ribbon star** with each point shaded in a distinct sub-surface tint — sun yellow, sky cyan, forest green, plum violet, magenta. The star floats centred in the medallion, sharp creases at each interior angle. The ribbon-snake head replaces the upper-right point, peering down toward the centre.

#### 24. Decagon — 10 languages — `polyglot-10.png`
> Hero shape: a **ten-sided ribbon polygon medallion** — a flat ribbon decagon plate at a slight 3/4 tilt, each of its ten edges glowing with a different sub-surface tint forming a chromatic ring. A small embossed ribbon globe sits at the centre of the polygon. The ribbon-snake head curls out from the upper-right edge.

#### 25. Polyglot — 25+ languages — `polyglot-25.png`
> Hero shape: a **stylised ribbon spire** evoking the Tower of Babel — a tapering vertical column with **five horizontal ribbon-band tiers** stacked from base to summit, each tier glowing with a different sub-surface tint (bottom warm, middle neutral, top cool). The summit narrows into the ribbon-snake head, looking outward. Soft sunbeam rim light from the upper-right reads as enlightenment without being literal.

---

## Cohort 6 — HelloTrade & web3

Trading + crypto milestones. Visual common thread: chart, signal, signature, key motifs from the HelloTrade course.

#### 26. First Trade — first TradeDock send — `trade-first-send.png`
> Hero shape: a **ribbon paper plane** in mid-flight, sharp folded creases along its wings, soaring up and to the right at a 30° angle. Behind it, a faint dotted ribbon trail traces its arc. The plane's tail fin curls into the ribbon-snake head. A pale cyan rim glow on the plane's underside (network-call cue). One background squircle carries a faint `200 OK` caustic.

#### 27. Live Mode — first live trade — `trade-live.png`
> Hero shape: a **stylised ribbon broadcast antenna** — a tall slim ribbon mast with three concentric ribbon arcs radiating outward from the tip (signal waves). The arcs taper from full to faint. The mast's base curls into the ribbon-snake head. A vivid amber sub-surface glow inside the signal arcs (LIVE-mode cue). One background squircle reflects a faint waveform caustic.

#### 28. Order-Book Reader — `orderbook-reader.png`
> Hero shape: a **stacked ribbon order-book glyph** — three short horizontal ribbon bars on top (asks) and three on the bottom (bids), separated by a thin ribbon mid-line (the spread). The top bars glow with a faint coral-red tint, the bottom bars with a faint mint-green tint, both still wearing the coral lacquer surface. The ribbon-snake head emerges from the right end of the top-most ask, looking down at the spread.

#### 29. EIP-712 Signer — first signed message — `eip712-signer.png`
> Hero shape: a **ribbon wax seal** — a circular ribbon disc with a raised emboss in the centre forming a stylised "L" with a small bevelled cross-stroke at the top (a nod to "Libre" without being literal). A short ribbon ribbon-tail trails off the lower-left of the seal. Crimson-red sub-surface glow inside the seal disc (wax-red restraint), warm amber on the embossed glyph. The ribbon-snake head curls out from the trailing ribbon tail.

#### 30. Capstone Trader — HelloTrade capstone done — `capstone-trader.png`
> Hero shape: a **ribbon medallion with a small candlestick chart embossed on its face** — three rising candles (two green-tinted, one red-tinted) with thin ribbon wicks above and below each, all contained within the medallion. A slim ribbon trend-line arcs upward across the candles. The ribbon-snake head emerges from the upper-right of the medallion, peering down at the chart. Burnished gold along the medallion's rim.

---

## Cohort 7 — Quiz & practice

Spaced-review surface badges. Visual common thread: targets, sage motifs, hourglasses.

#### 31. Sharpshooter — 10 quizzes aced — `quiz-sharpshooter.png`
> Hero shape: a **ribbon archery target** — three concentric ribbon rings (outer, middle, inner bullseye) at a slight 3/4 angle, with a single ribbon arrow embedded dead-centre. The arrow's fletching and shaft are coral ribbon; the arrowhead is a sharp folded triangle. The ribbon-snake head curls along the arrow's shaft. Cool emerald inside the bullseye (correct-answer cue), warm coral on the outer rings.

#### 32. Sage — 50 quizzes aced — `quiz-sage.png`
> Hero shape: a **stylised owl silhouette** rendered in coral ribbon — round body, two ear-tufts at the top, two large ribbon-circle eye sockets with small dot pupils, perched on a thin ribbon branch. The owl's head is one continuous fold; the wings tuck against the body as ribbon planes. A faint indigo sub-surface glow inside the eye sockets (wisdom cue). The ribbon-snake head's silhouette is faintly traced into the owl's tail-feather curve, but the owl reads first.

#### 33. Spaced Wizard — 100 practice cards reviewed — `practice-spaced.png`
> Hero shape: a **ribbon hourglass** — two ribbon teardrops mirrored top and bottom, joined at a narrow central pinch, with a slim ribbon-frame on either side connecting top and bottom bulbs. A few ribbon "sand" particles trail through the pinch and pile into the lower bulb. The ribbon-snake head emerges from the upper bulb's top, looking down at the falling sand. Pale gold sub-surface glow inside the sand particles.

#### 34. Perfect Week — 7-day perfect-review streak — `practice-perfect-week.png`
> Hero shape: a **closed ribbon laurel ring with seven small ribbon-bead beads** evenly spaced around its inside circumference. Each bead glows with the soft mint-green of a passed review. At the top of the ring, the two laurel branches' crossed leaf-tips curl into the ribbon-snake head, looking down at the beads. Cool emerald inside the laurel's leaves.

#### 35. Curiosity Cabinet — review every question type — `practice-curiosity.png`
> Hero shape: a **ribbon question-mark cluster** — three ribbon "?" glyphs of slightly different sizes overlapping at offset angles, all sharing one continuous folded ribbon path so they read as a single sculptural cluster. The largest "?" sits in the centre; two smaller flank it. The dot of the largest "?" forms the ribbon-snake head curling forward. Each "?" carries a slightly different sub-surface tint (amber, teal, plum) hinting at the varied question kinds.

---

## Cohort 8 — Speed & marathons

Single-session intensity badges. Visual common thread: motion glyphs (shooting stars, finish lines, time-of-day cues).

#### 36. Sprinter — 5 lessons in one session — `sprint-5.png`
> Hero shape: a **ribbon shooting star** — a five-pointed ribbon star at the upper-right with a long tapering ribbon trail sweeping down and to the left in a graceful arc, fading into ribbon wisps. The trailing tip forms the ribbon-snake head looking back. Vivid amber sub-surface glow along the trail, brightening at the star tip.

#### 37. Day-Long — 10 lessons in one day — `sprint-10.png`
> Hero shape: a **ribbon sun overhead** — a circular ribbon disc with twelve short tapering ribbon rays radiating outward. Beneath the sun, a slim ribbon arc traces a horizon line. The ribbon-snake head replaces one of the rays at the upper-right. Saturated saffron sub-surface glow inside the disc.

#### 38. Marathoner — 20 lessons in one day — `sprint-20.png`
> Hero shape: a **closed ribbon laurel wreath** with a thin **ribbon finish-line tape stretched across its centre** — the tape billowing slightly to one side as if just broken. Tiny ribbon confetti pieces float around the wreath inside the medallion. The ribbon-snake head emerges from the top crossed leaf-tips. Vivid emerald inside the leaves; pale gold on the tape.

#### 39. Night Owl — finish a lesson after midnight — `night-owl.png`
> Hero shape: a **slim ribbon crescent moon** with a small ribbon star tucked into its inner curve, both formed from one continuous folded ribbon. A few faint ribbon-dots scatter around as background stars. The crescent's lower tip curls into the ribbon-snake head, looking up. Cool indigo sub-surface glow inside the crescent; pale silver on the inner star.

#### 40. Dawn Patrol — finish a lesson before 6 am — `dawn-patrol.png`
> Hero shape: a **ribbon sunrise** — a half-disc ribbon sun rising behind a horizon ribbon-arc, with three short ribbon rays fanning upward from the disc's top. The horizon line gently curves. The ribbon-snake head emerges from the upper-right ray, looking out across the horizon. Soft peach-to-coral gradient inside the disc.

---

## Cohort 9 — Crafting & sharing

Author / contributor surface badges. Visual common thread: tools, scrolls, compass roses.

#### 41. Bookbinder — first PDF/EPUB ingested — `bookbinder.png`
> Hero shape: a **ribbon book mid-bind** — a tipped-open book at a 3/4 angle with a ribbon thread looping through three visible binding holes along its spine, the thread trailing off the lower-right corner. The ribbon-snake head replaces the trailing thread end, looking back at the book. Pale parchment cream inside the open pages, faint horizontal text-line caustics. A small ribbon needle floats above the spine.

#### 42. Cartographer — first docs URL crawled — `cartographer.png`
> Hero shape: a **ribbon compass rose** — four cardinal ribbon points (N, E, S, W) and four diagonal half-points, all sharing one continuous folded ribbon centre. A small ribbon needle floats above the rose, tipped with a tiny ribbon arrowhead pointing N. The ribbon-snake head curls along the needle's shaft. Cool slate sub-surface glow inside the rose; warm coral on the needle.

#### 43. Curator — first .academy archive exported — `curator.png`
> Hero shape: a **ribbon scroll partially unfurled** — a horizontal ribbon roll with two slim ribbon-rod ends, the body of the scroll partly opened to reveal a faint embossed library-shelf caustic across its face. A small ribbon wax seal sits in the lower-right corner of the unfurled section. The ribbon-snake head curls out from the top of the right rod. Pale parchment cream inside the unfurled body; crimson-red on the seal.

#### 44. Importer — first archive installed from disk — `importer.png`
> Hero shape: a **ribbon arrow descending into a ribbon folder** — a slim ribbon folder shape (rectangular with a small tab on the upper-left) sits open at the bottom of the medallion; above it, a downward-pointing ribbon arrow approaches its mouth. The arrow's shaft curls along the way into the ribbon-snake head, peering down at the folder. Cool teal sub-surface glow on the arrow; warm amber on the folder's interior.

#### 45. Cloud Mirror — first cross-device sync — `cloud-mirror.png`
> Hero shape: a **ribbon cloud silhouette** — a soft three-bump cloud shape, with a small ribbon checkmark embossed on its face. A faint ribbon arc curves below the cloud, hinting at a second device receiving the sync. The ribbon-snake head emerges from the cloud's right edge. Cool sky-blue sub-surface glow inside the cloud; mint-green on the checkmark.

---

## Cohort 10 — Hidden & wild card

Easter-egg style. Awarded for unusual exploration paths. Visual common thread: a touch more sparkle and less geometric strictness — these badges feel discovered, not earned in sequence.

#### 46. Polyglot Tongue — switch all 6 locales in one session — `easter-polyglot.png`
> Hero shape: a **six-petal ribbon flower** — six teardrop ribbon petals radiating from a central ribbon node, each petal shaded in a different sub-surface tint (one per locale: warm coral, pale cream, mint, indigo, plum, sage). The central node carries a tiny embossed `↻` caustic. The ribbon-snake head emerges from the upper-right petal's tip, peering inward. A scattering of tiny ribbon-sparkle dots floats around the petals.

#### 47. Theme Chameleon — try every theme — `easter-chameleon.png`
> Hero shape: a **ribbon paint-palette** — a kidney-shaped ribbon palette with five small ribbon paint-blobs along its top edge, each blob a different sub-surface tint (coral, mint, slate, plum, gold). A slim ribbon paintbrush rests across the palette's middle, brush tip dipped into the central blob. The ribbon-snake head replaces the brush handle's end, looking back at the palette. A few ribbon-sparkle dots float around the upper rim.

#### 48. Console Whisperer — open the dev console — `easter-console.png`
> Hero shape: a **ribbon magnifying glass** at a 3/4 angle, with a faint embossed `>_` prompt caustic visible inside its glass disc (no readable text, just typographic texture). The handle is a slim ribbon column. The ribbon-snake head curls along the handle's grip-end. Cool slate sub-surface glow inside the glass disc; warm coral on the handle. A tiny ribbon-sparkle floats above the lens.

#### 49. Time Traveler — view a lesson, leave for >30 days, return and finish — `easter-time-traveler.png`
> Hero shape: a **ribbon hourglass set inside a ribbon ring** — the hourglass tilted at a slight angle inside a circular ribbon halo, with two ribbon time-arrows curving around the outside of the ring (one clockwise, one counter-clockwise) suggesting time looping back. A few ribbon-sand grains float between the arrows. The ribbon-snake head replaces one of the time-arrow tips. Cool indigo inside the upper bulb; warm amber inside the lower.

#### 50. Curio — found a hidden lesson / Konami-code action — `easter-curio.png`
> Hero shape: a **ribbon question-mark medallion** — a single bold ribbon "?" centred inside a slightly-fancier ribbon ring than the other badges (the ring is decorated with eight small ribbon-bead points spaced evenly around its circumference). The "?" is one continuous folded ribbon, its dot forming the ribbon-snake head. Soft iridescent oil-slick sub-surface glow inside the "?" — magenta-cyan-gold shifts as the ribbon catches the rim light. A scattering of larger ribbon-sparkle dots floats around the medallion.

---

## Notes for the runtime

- **File naming**: badge IDs above match the achievement-event keys we'll thread through `useAchievements` (a future hook). One-to-one — `streak-7.png` ↔ `event:streak.7`. Use the same kebab-case form when wiring the cell into the achievement-grid component so a designer adding a new badge only needs to drop a PNG with the matching name into `public/achievements/`.
- **Locked state**: the runtime renders the locked-state version by desaturating the badge with `filter: grayscale(0.85) opacity(0.45)` — no separate "locked" PNG needed, the same source asset covers both states. The cohort comments above mention rim-tier accents (bronze/silver/gold/platinum/iridescent) that survive the desaturation just enough to still suggest the tier.
- **Square aspect**: every badge is generated 1024 × 1024 and the runtime resizes to 192 / 96 / 48 px for the various surfaces. Round display crops (the 96-px profile thumbnail clips into a circle) work because the medallion ring sits roughly inside the inscribed circle by design — no hero glyph leaves that circle.
- **No text inside the image**: badge labels are typeset by the runtime so we can localise through the same i18n channel as the rest of the app. Designers, do not bake the badge name into the artwork.
