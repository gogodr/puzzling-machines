import type { Vec2 } from '@shared/math'
import type { Rect } from '../scenes/schema'

/** The in-canvas tray sits below the scene bounds, in world units. */
export const TRAY_GAP = 0.2
export const TRAY_ROW_HEIGHT = 2
export const TRAY_SLOT_WIDTH = 2.6
export const TRAY_SLOT_MARGIN = 0.15
export const RUN_BUTTON_SIZE: readonly [number, number] = [2.4, 1.1]
/** Room reserved on the right of the first row for score + Run. */
export const TRAY_RUN_RESERVE = 5.2

/** Space kept clear above the scene for the host page's header. */
export const HEADER_ROOM = 0.7
/** World units of margin around the framed area. */
export const CAMERA_PADDING = 0.25

export function trayColumns(bounds: Rect) {
  const usable = bounds.maxX - bounds.minX - TRAY_RUN_RESERVE
  return Math.max(1, Math.floor(usable / TRAY_SLOT_WIDTH))
}

export function trayRows(bounds: Rect, inventoryCount: number) {
  return Math.max(1, Math.ceil(Math.max(1, inventoryCount) / trayColumns(bounds)))
}

export function trayRect(bounds: Rect, inventoryCount = 1): Rect {
  const maxY = bounds.minY - TRAY_GAP
  return {
    minX: bounds.minX,
    maxX: bounds.maxX,
    minY: maxY - trayRows(bounds, inventoryCount) * TRAY_ROW_HEIGHT,
    maxY,
  }
}

/** World-space centre of inventory slot `index`. */
export function traySlotCenter(bounds: Rect, index: number, inventoryCount = 1): Vec2 {
  const cols = trayColumns(bounds)
  const tray = trayRect(bounds, inventoryCount)
  const col = index % cols
  const row = Math.floor(index / cols)
  return [
    tray.minX + TRAY_SLOT_MARGIN + TRAY_SLOT_WIDTH / 2 + col * TRAY_SLOT_WIDTH,
    tray.maxY - TRAY_ROW_HEIGHT / 2 - row * TRAY_ROW_HEIGHT,
  ]
}

export interface FramedScene {
  bounds: Rect
  inventory: readonly unknown[]
}

/** Everything the camera must show: the scene plus the tray. */
export function frameBounds(scene: FramedScene): Rect {
  return {
    ...scene.bounds,
    minY: trayRect(scene.bounds, scene.inventory.length).minY,
    maxY: scene.bounds.maxY + HEADER_ROOM,
  }
}
