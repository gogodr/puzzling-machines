import type { Layout } from '../layout'
import type { RunResult } from '../run'

/**
 * The only data that crosses between the DOM app and the game (PLAN D2). Payloads must be
 * structured-clone safe so the same messages work over postMessage when the game runs in a worker.
 */

/** Presentation flags the app owns; the game only reads them. */
export interface GameSettings {
  cameraFollow: boolean
  reducedMotion: boolean
}

export type AppToGame =
  /** Load a scene, optionally restoring a saved layout. */
  | { type: 'loadScene'; sceneId: string; layout?: Layout }
  /** Leave the result state and return to building with the layout intact. */
  | { type: 'backToBuild' }
  /** Keyboard input captured by the host page, forwarded to the game. */
  | { type: 'key'; key: string; shiftKey: boolean }
  | { type: 'setDebug'; enabled: boolean }
  | { type: 'setSettings'; settings: GameSettings }
  /** Keyboard focus entered or left the board; the tray cursor only exists while it is focused. */
  | { type: 'boardFocus'; focused: boolean; fromEnd: boolean }

export type GameToApp =
  /** The game is listening; the app should send loadScene. Sent on every (re)mount. */
  | { type: 'ready' }
  | { type: 'sceneLoaded'; sceneId: string; sceneName: string }
  /** The player's layout changed; the app persists it. */
  | { type: 'layoutChanged'; sceneId: string; layout: Layout }
  /** `ambience` lists the looping machine sounds for this run (placed and fixed parts); empty outside runs. */
  | { type: 'modeChanged'; sceneId: string; mode: GameMode; ambience: GameAmbience[] }
  /** Sent once per run, right after the mode becomes 'result'. */
  | { type: 'runEnded'; result: RunResult }
  /** In-canvas control asked to return to the host menu. */
  | { type: 'requestExit' }
  /** A sound cue from the game. `intensity` is 0..1 (impact strength). */
  | { type: 'sfx'; name: GameSfx; intensity: number }
  /**
   * Keyboard tray cursor moved. The app needs `index`/`count` synchronously to decide whether Tab
   * stays in the tray or moves focus on; `label` is announced to screen readers.
   */
  | { type: 'trayFocus'; index: number | null; count: number; label: string | null }

/** Cues the game emits; the app maps them to files (docs/AUDIO.md). */
export type GameSfx =
  | 'place'
  | 'rotate'
  | 'remove'
  | 'invalid'
  | 'impactWood'
  | 'impactMetal'
  | 'trampoline'
  | 'launch'
  | 'spinner'
  | 'elevator'

export type GameAmbience = 'conveyor' | 'fan'

export type GameMode = 'build' | 'running' | 'result'
