import type { Collider, RigidBody, World } from '@dimforge/rapier3d-compat'
import type { Vec2 } from '@shared/math'

/** Fraction of the gap to belt speed closed per step for bodies touching a conveyor. */
export const CONVEYOR_GRIP = 0.15

/**
 * Conveyor (PLAN D1). Two parts:
 * - Treadmill: a velocity-based kinematic body keeps a constant surface velocity and is snapped back to
 *   its anchor before every step so it never travels.
 * - Grip: friction alone only drives a rolling ball to 2/7 of belt speed (the rest goes into spin), so
 *   touching dynamic bodies are nudged toward belt speed along the belt direction.
 * Replace both with contact modification (tangent velocity) once rapier.js exposes it.
 */
export function stepConveyor(
  world: World,
  body: RigidBody,
  surface: Collider,
  anchor: Vec2,
  velocity: Vec2,
  grip = CONVEYOR_GRIP,
) {
  body.setTranslation({ x: anchor[0], y: anchor[1], z: 0 }, true)
  body.setLinvel({ x: velocity[0], y: velocity[1], z: 0 }, true)

  const speed = Math.hypot(velocity[0], velocity[1])
  if (speed === 0) return
  const tx = velocity[0] / speed
  const ty = velocity[1] / speed

  world.contactPairsWith(surface, (other) => {
    const rider = other.parent()
    if (!rider?.isDynamic()) return
    let touching = false
    world.contactPair(surface, other, (manifold) => {
      if (manifold.numContacts() > 0) touching = true
    })
    if (!touching) return
    const v = rider.linvel()
    const dv = (speed - (v.x * tx + v.y * ty)) * grip
    rider.setLinvel({ x: v.x + tx * dv, y: v.y + ty * dv, z: 0 }, true)
  })
}
