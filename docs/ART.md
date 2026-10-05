# Art pipeline

All bitmap art is generated with **Qwen-Image** on the `image-gen-sas` Runpod endpoints (text-to-image, LoRA strength 0) and packed by `art/build_atlas.py`. Geometry, outlines, build zones and goal boxes are still drawn in code from the scene theme (`src/game/render/themes.ts`), so physics shapes and art can never drift apart.

## Files

| Path                                            | What                                                        | Committed                                                  |
| ----------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------- |
| `art/raw/*.png`                                 | Raw generations (source of truth, ~15 MB)                   | yes — regenerating costs GPU time and is not bit-identical |
| `art/manifest.json`                             | Sheet grids, frame names, background → scene mapping        | yes                                                        |
| `art/build_atlas.py`                            | Keys, splits, packs and exports everything below            | yes                                                        |
| `public/assets/atlas.webp`                      | One sprite atlas, 2048×1392, 26 frames, ~375 KB             | yes (build output, served as-is)                           |
| `src/game/render/atlas.json`                    | Frame rectangles, imported by `render/atlas.ts`             | yes                                                        |
| `public/assets/bg/<scene>.webp` / `-thumb.webp` | Full backdrop (20–55 KB) and scene-card thumbnail (4–11 KB) | yes                                                        |
| `public/assets/key-art.webp`                    | Main menu art (~70 KB)                                      | yes                                                        |

Total art download for the whole demo is about 650 KB.

Rebuild after changing anything in `art/raw` or the manifest (needs Python with Pillow, NumPy, SciPy):

```powershell
python art/build_atlas.py
```

## How the atlas is built

1. Sprite sheets are generated as a grid of separate objects on flat magenta (`#FF00FF`).
2. Each sheet is chroma-keyed: alpha comes from "magentaness" (`min(R, B) − G`) relative to the border colour, and the background is un-mixed from soft edges so outlines keep no pink fringe.
3. Opaque connected components are grouped by the grid cell holding their centroid, trimmed, and specks from neighbouring cells are dropped.
4. Compact sprites are scaled to at most 320 px on their longest side, long ones (planks, belts, pipes) to 1024 px.
5. Frames are shelf-packed with 6 px of extruded padding, so linear filtering never samples a neighbour, and saved as WebP (quality 90).

At runtime `preloadAtlas()` starts the single texture download when the game module loads; every sprite shares one material and one texture, and each `Sprite` only gets a UV-mapped plane.

## Animation

There are no frame-by-frame sequences. Each animated part has a second pose generated in the same sheet (so the style matches), and the game swaps frames on state changes:

| Frames                             | Used when                                 |
| ---------------------------------- | ----------------------------------------- |
| `trampoline` / `trampoline_squash` | Pad squashes for a moment after a bounce  |
| `sling` / `sling_pulled`           | Band is pulled back until the sling fires |
| `flag` / `flag_celebrate`          | Goal flag celebrates once the run is won  |

Continuous motion (fan and spinner rotation, belt stripes, ball spin and squash/stretch, confetti, sparks, the fail puff) is done with transforms on single frames. **Reduced motion** turns off the decorative effects (squash/stretch, sparks, confetti, the puff, camera follow) but keeps motion that shows what the machine is doing (fan blades, belt stripes, rotating parts).

## Generation settings

All images: `python scripts/generate.py --lora-strength 0 --width W --height H --prompt <text> --out <path>` from the `image-gen-sas` project. Prompts are positive-only (no negative prompt). Seeds are recorded so a single image can be revisited; results are close but not guaranteed identical on a different worker.

### Sprite sheets

Shared style suffix:

> Flat vector cartoon style for a clean mobile puzzle game, thick dark navy outlines, simple cel shading with one soft highlight per object, warm palette of honey wood, polished brass, teal steel, charcoal rubber and tomato red, side view, every object fully visible and separated, on a perfectly uniform flat pure magenta background color #FF00FF.

| File                   | Size      | Seed       | Prompt (before the suffix)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ---------------------- | --------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `sheet-a-parts.png`    | 2048×1536 | 1968419643 | A game sprite sheet of twelve separate objects arranged in an evenly spaced grid of four columns and three rows, one object centered in each cell with wide empty space around it. Row one: a glossy tomato-red rubber ball with a single white stripe; a wooden paddle wheel with four flat paddles and a polished brass hub, front view; a small teal electric fan seen from the side facing right, blades visible behind a round grille; the same teal fan with its blades rotated to a different angle. Row two: a trampoline seen from the side with a charcoal frame, coiled steel springs and an orange bouncy pad; the same trampoline with the pad pressed down and the springs compressed; a wooden Y-shaped slingshot with a tan rubber band, front view; the same slingshot with the band pulled far back and stretched. Row three: a checkered finish flag on a brass pole; the same finish flag waving with golden confetti bursting around it; a heavy dark iron wrecking ball with a ring on top; a single upright black domino tile with white pips. |
| `sheet-b-hardware.png` | 2048×1024 | 1425913730 | A game sprite sheet of eight separate objects arranged in an evenly spaced grid of four columns and two rows, one object centered in each cell with wide empty space around it. Row one: a brass wall bracket with a round pivot ring for hanging a pendulum; a triangular wooden seesaw fulcrum block; a sturdy wooden catapult A-frame stand with a brass axle on top; a steel pulley wheel housing for the top of an elevator shaft. Row two: a teal metal pipe bent in a smooth quarter-circle elbow, open at both ends; a bright yellow four-pointed sparkle star; a soft round white dust puff cloud; a polished brass cogwheel.                                                                                                                                                                                                                                                                                                                                                                                                                                |
| `sheet-c-long.png`     | 2048×2048 | 2401174454 | A game sprite sheet of seven separate long thin horizontal objects stacked in seven evenly spaced rows, each object spanning almost the full width of the image, centered in its row with empty space above and below. Top to bottom: a long thin honey-colored wooden plank; a long thin conveyor belt with charcoal rubber tread and small round steel rollers at both ends; a long thin painted blue wooden seesaw plank; a long thin wooden catapult arm beam with a small wooden scoop bucket at its left end; a long thin steel elevator platform with yellow bumper caps at both ends; a long thin straight teal metal pipe seen from the side, open at both ends; a long thin brushed steel bar.                                                                                                                                                                                                                                                                                                                                                              |

The second fan pose in sheet A is generated but unused (`null` in the manifest); the fan spins its single frame instead.

### Backgrounds (1536×864)

Shared style suffix — kept muted and low-contrast so parts stay readable on top:

> Soft flat vector illustration game background, muted desaturated colors, low contrast, gentle gradients and simple shapes, calm and uncluttered with a large quiet open area in the middle so foreground game pieces stay readable, no characters, wide 16:9 composition.

| File                  | Seed       | Prompt (before the suffix)                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bg-first-steps.png`  | 114732814  | A cozy woodworking workshop interior seen straight on: a long bare wooden workbench running along the bottom edge with a clean empty top, a pegboard wall with neatly hanging hand tools in the upper middle, a warm window on the left and tall shelves of boxes on the right, soft afternoon sunlight, cream and honey-brown tones. _(Suffix ends with "only furniture and tools" instead of "no characters"; the first attempt put a figurine on the bench.)_ |
| `bg-up-the-wall.png`  | 2064877328 | A tall dusty attic interior seen straight on, slanted wooden roof beams, a round porthole window high on the right letting in a cool beam of light, stacked trunks and boxes in the lower corners, dusty lavender and warm brown tones.                                                                                                                                                                                                                          |
| `bg-the-gap.png`      | 2804890817 | Two tiled garden rooftops seen from the side at golden hour with a wide gap of sky between them, distant city silhouettes, potted plants and a chimney on the roofs, peach and soft teal sky.                                                                                                                                                                                                                                                                    |
| `bg-clockwork.png`    | 226385424  | The interior of an old clock tower seen straight on, giant brass gears and cogwheels along the edges, the back of a huge translucent clock face glowing softly in the upper middle, wooden floorboards, warm amber and deep teal tones.                                                                                                                                                                                                                          |
| `bg-grand-finale.png` | 4162857219 | A bright toy factory floor seen straight on, overhead pipes and ducts along the top, rows of machines and crates along the bottom, tall industrial windows with daylight, soft steel blue and warm orange tones.                                                                                                                                                                                                                                                 |

### Key art (1536×864, seed 3544514094)

> Title key art for a cozy puzzle game about Rube Goldberg machines: a glossy red ball rolling down a chain of wooden ramps, a teal fan, a brass pulley, a slingshot, a checkered goal flag and golden cogs, arranged as a playful contraption across a warm workshop wall. Flat vector cartoon illustration with thick navy outlines and cel shading, warm honey, brass, teal and tomato-red palette, soft gradient background, balanced wide composition with a calm open area in the middle for the menu.

The title is set in HTML over the image, not painted into it; generated lettering was unreliable.

## Adding or replacing art

- **New sprite:** add it to a sheet prompt (or a new sheet) in a free grid cell, name the cell in `art/manifest.json`, rebuild, then use `<Sprite frame="name" size={[w, h]} />`. Keep the shared style suffix verbatim.
- **New scene backdrop:** generate `art/raw/bg-<scene>.png` with the background suffix, map it in `manifest.backgrounds`, rebuild. Scenes without their own file can borrow one with `backdrop: '<scene-id>'` in the scene definition.
- **Theme colours** for statics, build zones and the goal live in `THEMES` (`src/game/render/themes.ts`); pick them from the backdrop so walls read as part of the room.
- Check the result in the browser and in `SCREENSHOTS=1 npx playwright test screenshots` — a backdrop that is too busy behind the play area is the most common problem.
