import type { Vec2 } from '@shared/math'
import { MATERIALS, type MaterialPreset } from '../engine/materials'
import type { RigidBody, World2D } from '../engine/physics/world2d'
import type { Frame } from './frame'

export const WALL_THICKNESS = 0.12

/** A wall from `a` to `b` in local space; thickness is centred on the segment. */
export interface Segment {
  a: Vec2
  b: Vec2
}

export function segmentBox({ a, b }: Segment, overlap = 0) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  return {
    center: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] as Vec2,
    length: Math.hypot(dx, dy) + overlap,
    angle: Math.atan2(dy, dx),
  }
}

/** Adds segments as colliders on a body that has the frame's position and angle. */
export function addWalls(
  world: World2D,
  body: RigidBody,
  frame: Frame,
  segments: readonly Segment[],
  { thickness = WALL_THICKNESS, overlap = 0, material = MATERIALS.default as MaterialPreset } = {},
) {
  for (const segment of segments) {
    const { center, length, angle } = segmentBox(segment, overlap)
    world.addBox(body, {
      width: length,
      height: thickness,
      offset: frame.offset(center),
      angle: frame.offsetAngle(angle),
      material,
    })
  }
}

/** Points along a circular arc (radians, counter-clockwise from `from` to `to`). */
export function arcSegments(
  center: Vec2,
  radius: number,
  from: number,
  to: number,
  count: number,
): Segment[] {
  const step = (to - from) / count
  return Array.from({ length: count }, (_, i) => {
    const a0 = from + i * step
    const a1 = a0 + step
    return {
      a: [center[0] + radius * Math.cos(a0), center[1] + radius * Math.sin(a0)],
      b: [center[0] + radius * Math.cos(a1), center[1] + radius * Math.sin(a1)],
    }
  })
}
