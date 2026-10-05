import type { Layout, PlacedContraption } from '@shared/layout'
import { degToRad, type Vec2 } from '@shared/math'
import { footprintOf } from '../contraptions/registry'
import { BALL_RADIUS } from '../engine/determinism'
import type { SceneDefinition } from '../scenes/schema'
import { obbOverlap, rectContainsObb, rectToObb, type OBB } from './geometry'

export const GRID = 0.25
export const ROTATION_STEP = degToRad(15)

export type PlacementResult = { valid: true } | { valid: false; reason: PlacementError }
export type PlacementError =
  'outsideBuildZone' | 'overlapsScene' | 'overlapsContraption' | 'blocksStartOrGoal'

export function snapToGrid(value: number) {
  return Math.round(value / GRID) * GRID
}

export function snapPoint([x, y]: Vec2): Vec2 {
  return [snapToGrid(x), snapToGrid(y)]
}

/** Normalises to (-π, π] and snaps to the rotation step so repeated rotations stay exact. */
export function snapAngle(angle: number) {
  const steps = Math.round(angle / ROTATION_STEP)
  const turn = Math.round((2 * Math.PI) / ROTATION_STEP)
  let wrapped = ((steps % turn) + turn) % turn
  if (wrapped > turn / 2) wrapped -= turn
  return wrapped * ROTATION_STEP
}

export function contraptionObb(placed: PlacedContraption): OBB {
  const { width, height } = footprintOf(placed)
  return { center: placed.position, half: [width / 2, height / 2], angle: placed.angle }
}

/** Keeps the ball's starting spot clear so a placement never traps it on spawn. */
function startObb(scene: SceneDefinition): OBB {
  const r = BALL_RADIUS + 0.25
  return { center: scene.start.position, half: [r, r], angle: 0 }
}

export function validatePlacement(
  scene: SceneDefinition,
  others: Layout,
  item: PlacedContraption,
): PlacementResult {
  const obb = contraptionObb(item)
  if (!scene.buildZones.some((zone) => rectContainsObb(zone, obb))) {
    return { valid: false, reason: 'outsideBuildZone' }
  }
  if (obbOverlap(obb, startObb(scene)) || obbOverlap(obb, rectToObb(scene.goal))) {
    return { valid: false, reason: 'blocksStartOrGoal' }
  }
  for (const s of scene.statics) {
    const staticObb: OBB = { center: s.position, half: [s.size[0] / 2, s.size[1] / 2], angle: s.angle }
    if (obbOverlap(obb, staticObb)) return { valid: false, reason: 'overlapsScene' }
  }
  for (const other of [...scene.fixed, ...others]) {
    if (other.id !== item.id && obbOverlap(obb, contraptionObb(other))) {
      return { valid: false, reason: 'overlapsContraption' }
    }
  }
  return { valid: true }
}
