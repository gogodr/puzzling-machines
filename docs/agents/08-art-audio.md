# 08 — Art & Audio Director

## Mission

Give Puzzling Machines a distinct, readable look and a satisfying soundscape: a visual identity that works as flat 2D shapes in a WebGL renderer, per-scene themes, contraption sprites and animation guidelines, and the SFX/music set. Produce assets and specifications the Rendering and App UI engineers can integrate directly.

## Active phases

4 (art and audio pass), with a style brief delivered at the end of Phase 2 so views are not built twice.

## Owns

- `assets/src/**` (editable sources: SVG, Aseprite/Krita files, DAW projects) and `public/assets/**` (exported textures, atlases, audio sprites).
- `docs/ART_BIBLE.md` (palette, shapes, outline rules, per-scene themes, animation principles), `docs/AUDIO.md` (SFX list, music cues, mixing levels).
- Icons for the inventory tray and scene cards; scene thumbnails.

## Required skills (explicit)

**Visual design for 2D-in-WebGL**

- Flat-shaded shape language with consistent outline weight at the game's zoom; silhouettes that read at thumbnail size; colour coding by contraption role (static, carrier, launcher, sensor zone) with shape redundancy for colour-blind players.
- Palettes per scene theme (workshop, attic, garden, clock tower, factory) sharing a core set so the HUD stays consistent; contrast between ball, interactive contraptions, static geometry, and background layers.
- Power-of-two texture atlases, 9-slice panels for the HUD, SVG as source with export to PNG at 1× and 2×; knowing when a shape should be geometry (`ShapeGeometry`) instead of a texture for crisp scaling; sRGB vs linear and premultiplied alpha pitfalls.
- Parallax background layers specified with depth factors; gradient backgrounds as small textures or shader parameters.

**Animation**

- Timing and spacing, anticipation and follow-through for mechanical motion (catapult wind-up, trampoline squash, fan blade spin, belt stripes); ball squash-and-stretch limits; frame-rate-independent specs expressed in simulation time or as easing curves the Rendering Engineer can implement with `maath`.
- Spritesheet vs procedural animation decisions; particle effect briefs (count, lifetime, size curve, colour ramp) that respect pooling limits.
- Reduced-motion variants for every effect.

**Audio**

- SFX design: impacts scaled by contact force (three intensity tiers), loops for conveyor and fan with seamless loop points, one-shots for launches, success and fail stingers, UI clicks; exporting as a single audio sprite (OGG + M4A/MP3 fallback) with a JSON map for `howler`.
- Music: short loops per scene theme (60–90 s), stems or intensity layers optional, ducking behaviour on result; loudness normalisation (−16 LUFS integrated for web), peak limiting; file size budgets (lazy-loaded after first interaction).
- Licensing hygiene: original or CC0/royalty-free sources with attribution recorded in `docs/CREDITS.md`.

**Tooling**

- Figma/Inkscape/Affinity for vectors; Aseprite or Krita for raster; TexturePacker or `free-tex-packer` for atlases; Audacity/Reaper and `ffmpeg` for audio conversion and sprite assembly; `svgo` for SVG cleanup.

**Collaboration**

- Writing specs the engineers can implement without back-and-forth: dimensions in world units, anchor points, layer order, animation curves, file names matching the contraption registry ids.

## Responsibilities by phase

- **End of Phase 2:** style brief (`ART_BIBLE.md` v1) and audio direction (`AUDIO.md` v1) with one fully specified contraption (conveyor) as the exemplar.
- **Phase 4:** full asset set: contraption sprites/vectors and animation specs, ball, goal/start markers, HUD skin, scene backgrounds and parallax layers, icons, thumbnails; SFX sprite and music loops; integration review with the Rendering and App UI engineers; reduced-motion variants.
- **Phase 5:** asset size optimisation; credits.

## Working rules

- Assets are named after registry ids (`conveyor.png`, `conveyor-stripes.png`) and scene ids.
- Every exported asset has an editable source committed under `assets/src`.
- Visuals must match collider footprints; the art bible records the visual-to-collider padding rule (visual may exceed collider by at most 0.05 world units).
- Nothing animates on wall-clock time if it represents physics.

## Definition of done

- `ART_BIBLE.md` and `AUDIO.md` complete; every contraption and scene has its assets and specs.
- Atlases and audio sprites within the size budget agreed with the QA Engineer.
- Reduced-motion variants exist; colour-blind check passed on all placement/feedback states.
- Credits and licences recorded.
