import type { PlacedContraption } from '@shared/layout'
import type { Vec2 } from '@shared/math'

type Placement = Pick<PlacedContraption, 'position' | 'angle' | 'flipped'>

/**
 * A contraption's local frame: translate, rotate, then mirror X when flipped. Physics builds bodies
 * with it and views invert it, so a flipped contraption's bodies and meshes always agree.
 */
export function frameOf({ position, angle, flipped }: Placement) {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  const f = flipped ? -1 : 1
  return {
    /** Collider offset inside a body that has the frame's angle: only the mirror applies. */
    offset([x, y]: Vec2): Vec2 {
      return [f * x, y]
    },
    /** Collider angle inside a body that has the frame's angle. */
    offsetAngle(local: number) {
      return f * local
    },
    point([x, y]: Vec2): Vec2 {
      return [position[0] + f * x * c - y * s, position[1] + f * x * s + y * c]
    },
    direction([x, y]: Vec2): Vec2 {
      return [f * x * c - y * s, f * x * s + y * c]
    },
    /** World angle of a symmetric shape drawn at `local` radians in the local frame. */
    angle(local: number) {
      return angle + f * local
    },
    /** Inverse of point() and angle(), for views placing meshes at a body's world pose. */
    toLocal([wx, wy]: Vec2, worldAngle: number): { point: Vec2; angle: number } {
      const dx = wx - position[0]
      const dy = wy - position[1]
      return { point: [f * (dx * c + dy * s), -dx * s + dy * c], angle: f * (worldAngle - angle) }
    },
  }
}

export type Frame = ReturnType<typeof frameOf>
