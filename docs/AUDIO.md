# Audio brief (for ElevenLabs)

The game already plays these files when they exist and stays silent when they do not, so you can add them one at a time. Drop each file into `public/audio/` with the **exact file name** below. Reload the page; no code change is needed.

## Delivery format

|          | Sound effects                                                                 | Music                                                |
| -------- | ----------------------------------------------------------------------------- | ---------------------------------------------------- |
| Format   | MP3, 44.1 kHz, 128–192 kbps (OGG also fine — keep the `.mp3` name or tell me) | MP3, 44.1 kHz, 160–192 kbps                          |
| Channels | Mono is fine                                                                  | Stereo                                               |
| Loudness | Peak around −3 dBFS, no long silence at the start                             | Around −16 LUFS integrated, quieter than SFX         |
| Start    | Sound begins within the first 10 ms (the game triggers it on impact)          | —                                                    |
| Loops    | Marked "loop": must loop seamlessly (ElevenLabs Sound Effects → **Loop** on)  | All music loops; end should flow back into the start |

**Overall mood:** a cozy, tactile toy-workshop puzzle game. Wooden parts, brass, rubber, small motors. Playful and warm, never harsh. Think wooden toys and marble runs, not arcade lasers.

Pitch and volume are varied by the game (impacts get faster playback for harder hits), so record each sound at a **neutral medium intensity**.

## Sound effects

Durations are targets for the ElevenLabs "duration" setting. Prompts are starting points; adjust freely.

### Interface

| File            | When it plays                       | Duration | Prompt                                                                          |
| --------------- | ----------------------------------- | -------- | ------------------------------------------------------------------------------- |
| `ui-click.mp3`  | Any menu/panel button               | 0.15 s   | Soft wooden toy button click, short and dry, cozy UI sound                      |
| `ui-locked.mp3` | Clicking a locked scene             | 0.3 s    | Muted low wooden knock with a tiny rattle, gentle "not yet" denial sound        |
| `unlock.mp3`    | A new scene unlocks after a success | 1.2 s    | Small brass padlock clicking open followed by a bright two-note music box chime |

### Building

| File          | When it plays                               | Duration | Prompt                                                                       |
| ------------- | ------------------------------------------- | -------- | ---------------------------------------------------------------------------- |
| `place.mp3`   | A part is dropped into the scene            | 0.3 s    | Wooden toy block set down firmly on a wooden table, short satisfying clunk   |
| `rotate.mp3`  | A part is rotated 15°                       | 0.15 s   | Single small ratchet click of a wooden gear, crisp and light                 |
| `remove.mp3`  | A part is deleted                           | 0.35 s   | Quick soft whoosh with a light wooden pop, object lifted away                |
| `invalid.mp3` | A drop is rejected (overlap / outside zone) | 0.3 s    | Soft rubbery double bonk, gentle error sound, not harsh                      |
| `run.mp3`     | Run is pressed                              | 0.8 s    | Wooden lever pulled down with a ratchet, then a small motor whirring to life |

### Machine (during a run)

| File                       | When it plays                                                     | Duration | Prompt                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------- |
| `impact-wood.mp3`          | Ball hits a ramp, wall, plank, domino                             | 0.25 s   | Small hard rubber ball bouncing once on a wooden plank, single clean tock                                                 |
| `impact-metal.mp3`         | Ball hits a pipe, funnel, elevator or steel part                  | 0.3 s    | Small rubber ball striking a thin steel sheet, short metallic tink with light ring                                        |
| `trampoline.mp3`           | Ball bounces on a trampoline                                      | 0.5 s    | Cartoon springy boing of a small trampoline, bouncy coil spring, playful                                                  |
| `launch.mp3`               | Sling or catapult fires                                           | 0.6 s    | Rubber band slingshot twang followed by a quick airy whoosh                                                               |
| `spinner.mp3`              | Ball is struck by the paddle wheel                                | 0.3 s    | Wooden paddle slapping a rubber ball, quick flick with a soft whoosh                                                      |
| `conveyor-loop.mp3` (loop) | While a run has a conveyor in it (placed or built into the scene) | 4 s      | Seamless loop of a small rubber conveyor belt running over rollers, soft steady mechanical hum with faint rhythmic clicks |
| `fan-loop.mp3` (loop)      | While a run has a fan in it                                       | 4 s      | Seamless loop of a small electric desk fan blowing steadily, soft whoosh and gentle motor hum                             |
| `elevator.mp3`             | Elevator starts lifting                                           | 1.5 s    | Small wooden toy elevator lifting with a winch, rope creak and gear clicks                                                |

### Outcome

| File            | When it plays                          | Duration | Prompt                                                                                        |
| --------------- | -------------------------------------- | -------- | --------------------------------------------------------------------------------------------- |
| `success.mp3`   | Ball reaches the goal                  | 1.8 s    | Bright cheerful music box and xylophone flourish with a tiny bell ding, celebratory and short |
| `fail.mp3`      | Run fails (fell out, stalled, timeout) | 1.0 s    | Soft comic descending wooden xylophone "womp womp", gentle and friendly                       |
| `highscore.mp3` | A name is saved to the leaderboard     | 1.5 s    | Sparkling ascending glockenspiel arpeggio with a soft cymbal shimmer                          |

## Music

All tracks loop. Keep them light so the machine sounds stay in front. The game plays the music at about 45% volume and lowers it further while the result panel is open.

| File                     | Where                        | Length   | Prompt                                                                                                                                     |
| ------------------------ | ---------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `music-menu.mp3`         | Main menu, scene select      | 60–90 s  | Warm cozy instrumental, plucked acoustic guitar, music box and soft upright bass, gentle curious mood, 90 BPM, loopable                    |
| `music-first-steps.mp3`  | Scene 1 — workshop           | 90–120 s | Light playful workshop tune, marimba, ukulele and brushed snare, tinkering and curious, 100 BPM, loopable                                  |
| `music-up-the-wall.mp3`  | Scene 2 — attic              | 90–120 s | Dreamy dusty attic theme, celesta, soft strings pizzicato and warm clarinet, gentle wonder, 92 BPM, loopable                               |
| `music-the-gap.mp3`      | Scene 3 — rooftops at sunset | 90–120 s | Breezy golden-hour rooftop tune, whistling melody, acoustic guitar and light hand percussion, adventurous but relaxed, 108 BPM, loopable   |
| `music-clockwork.mp3`    | Scene 4 — clock tower        | 90–120 s | Ticking clockwork theme, pizzicato strings, harpsichord and woodblock keeping a steady tick-tock, precise and mysterious, 96 BPM, loopable |
| `music-grand-finale.mp3` | Scene 5 — factory            | 90–120 s | Upbeat bustling toy factory theme, brass section stabs, xylophone runs and bouncy bass, triumphant and busy, 116 BPM, loopable             |

## How the game uses them

- Audio lives on the page side (`src/app/audio/`), driven by bridge messages, so it keeps working when the game moves to a worker in Phase 5.
- The **Sound** setting mutes everything. Audio starts after the first click (browser autoplay rules).
- `impact-*` playback speed rises with hit strength (about 0.85×–1.3×) and is rate-limited so rolling does not machine-gun.
- Missing files are skipped silently; the browser console lists which ones were not found once.
- Building sounds (`place`, `rotate`, `remove`, `invalid`) are cued by the game itself, so mouse and keyboard building sound the same.
