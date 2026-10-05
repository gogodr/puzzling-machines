export type Vec2 = readonly [x: number, y: number]

export interface Quat {
  x: number
  y: number
  z: number
  w: number
}

/** Rotation about the Z axis. The single place where 2D angles become quaternions, for both renderer and physics. */
export function quatFromAngle(angle: number): Quat {
  const half = angle / 2
  return { x: 0, y: 0, z: Math.sin(half), w: Math.cos(half) }
}

export function quatTupleFromAngle(angle: number): [number, number, number, number] {
  const q = quatFromAngle(angle)
  return [q.x, q.y, q.z, q.w]
}

export const degToRad = (degrees: number) => (degrees * Math.PI) / 180
