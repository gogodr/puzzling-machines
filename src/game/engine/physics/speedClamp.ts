interface Vector3Like {
  x: number
  y: number
  z: number
}

export interface DynamicBodyLike {
  linvel(): Vector3Like
  setLinvel(velocity: Vector3Like, wakeUp: boolean): void
}

/** Caps planar speed to bound tunnelling risk and score rates (PLAN D3). */
export function clampSpeed(body: DynamicBodyLike, maxSpeed: number) {
  const v = body.linvel()
  const speedSq = v.x * v.x + v.y * v.y
  if (speedSq <= maxSpeed * maxSpeed) return
  const k = maxSpeed / Math.sqrt(speedSq)
  body.setLinvel({ x: v.x * k, y: v.y * k, z: 0 }, true)
}
