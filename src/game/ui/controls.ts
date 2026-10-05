import type { GameStore } from '../state/gameStore'

/** Grid cells per arrow press; Shift moves faster. */
const NUDGE = 1
const NUDGE_FAST = 4

const ARROWS: Record<string, readonly [number, number]> = {
  arrowleft: [-1, 0],
  arrowright: [1, 0],
  arrowup: [0, 1],
  arrowdown: [0, -1],
}

/** The one Run button: Run in build mode, Stop while running, Edit on the result screen. */
export function toggleRun(store: GameStore) {
  const s = store.getState()
  if (s.mode === 'build') s.startRun()
  else s.backToBuild()
}

/**
 * Moves the keyboard tray cursor. Stepping past either end clears it, which is when the host lets
 * Tab move focus off the board.
 */
export function cycleTray(store: GameStore, direction: 1 | -1) {
  const { scene, trayCursor, mode, setTrayCursor } = store.getState()
  if (!scene || mode !== 'build') return
  const count = scene.inventory.length
  const next = trayCursor === null ? (direction > 0 ? 0 : count - 1) : trayCursor + direction
  setTrayCursor(next >= 0 && next < count ? next : null)
}

/** Keyboard shortcuts; keys arrive over the bridge from whoever owns the DOM. */
export function handleKey(store: GameStore, key: string, shiftKey: boolean) {
  const s = store.getState()
  const lower = key.toLowerCase()
  const arrow = ARROWS[lower]
  if (arrow) {
    const step = shiftKey ? NUDGE_FAST : NUDGE
    s.nudge(arrow[0] * step, arrow[1] * step)
    return
  }
  switch (lower) {
    case 'r':
      s.rotate(shiftKey ? 1 : -1)
      break
    case 'f':
      s.flip()
      break
    case 'delete':
    case 'backspace':
      s.deleteSelected()
      break
    case ' ':
      toggleRun(store)
      break
    case 'tab':
      cycleTray(store, shiftKey ? -1 : 1)
      break
    case 'enter': {
      const entry = s.trayCursor === null ? undefined : s.scene?.inventory[s.trayCursor]
      if (entry) s.placeFromTray(entry.type)
      break
    }
    case 'escape':
      if (s.drag) s.cancelDrag()
      else s.select(null)
      break
  }
}
