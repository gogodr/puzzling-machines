import type { Vec2 } from '@shared/math'

/** Oriented box: centre, half extents and rotation about Z. */
export interface OBB {
  center: Vec2
  half: Vec2
  angle: number
}

export interface RectLike {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export function obbCorners({ center, half, angle }: OBB): Vec2[] {
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return [
    [-half[0], -half[1]],
    [half[0], -half[1]],
    [half[0], half[1]],
    [-half[0], half[1]],
  ].map(([x = 0, y = 0]) => [center[0] + x * c - y * s, center[1] + x * s + y * c] as const)
}

export function rectToObb(r: RectLike): OBB {
  return {
    center: [(r.minX + r.maxX) / 2, (r.minY + r.maxY) / 2],
    half: [(r.maxX - r.minX) / 2, (r.maxY - r.minY) / 2],
    angle: 0,
  }
}

function project(corners: Vec2[], axis: Vec2) {
  let min = Infinity
  let max = -Infinity
  for (const [x, y] of corners) {
    const d = x * axis[0] + y * axis[1]
    min = Math.min(min, d)
    max = Math.max(max, d)
  }
  return [min, max] as const
}

/** Separating axis test. Boxes that only touch, or overlap by less than `tolerance`, do not overlap. */
export function obbOverlap(a: OBB, b: OBB, tolerance = 1e-4) {
  const ca = obbCorners(a)
  const cb = obbCorners(b)
  for (const angle of [a.angle, a.angle + Math.PI / 2, b.angle, b.angle + Math.PI / 2]) {
    const axis: Vec2 = [Math.cos(angle), Math.sin(angle)]
    const [minA, maxA] = project(ca, axis)
    const [minB, maxB] = project(cb, axis)
    if (maxA - minB <= tolerance || maxB - minA <= tolerance) return false
  }
  return true
}

export function rectContainsObb(r: RectLike, obb: OBB, tolerance = 1e-6) {
  return obbCorners(obb).every(
    ([x, y]) =>
      x >= r.minX - tolerance &&
      x <= r.maxX + tolerance &&
      y >= r.minY - tolerance &&
      y <= r.maxY + tolerance,
  )
}
