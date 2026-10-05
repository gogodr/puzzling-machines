import type { Collider, RigidBody, World } from '@dimforge/rapier3d-compat'

/** Dynamic bodies overlapping a sensor, ordered by handle so results never depend on pair order. */
export function dynamicBodiesIn(world: World, sensor: Collider): RigidBody[] {
  const bodies = new Map<number, RigidBody>()
  world.intersectionPairsWith(sensor, (other) => {
    const body = other.parent()
    if (body?.isDynamic()) bodies.set(body.handle, body)
  })
  return [...bodies.values()].sort((a, b) => a.handle - b.handle)
}

export function sensorContains(world: World, sensor: Collider, body: RigidBody) {
  let found = false
  world.intersectionPairsWith(sensor, (other) => {
    if (other.parent()?.handle === body.handle) found = true
  })
  return found
}
