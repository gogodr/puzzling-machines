import RAPIER from '@dimforge/rapier3d-compat'
import { BALL_RADIUS, TIME_STEP } from '@game/engine/determinism'
import { World2D } from '@game/engine/physics/world2d'

export interface StepHooks {
  before?: () => void
  after?: () => void
}

/** Steps a World2D the way Simulation does: hooks → world.step → plane projection. */
export function step(w: World2D, hooks: StepHooks = {}) {
  hooks.before?.()
  w.world.step()
  w.projectJointed()
  hooks.after?.()
}

export function run(w: World2D, seconds: number, hooks: StepHooks = {}) {
  const count = Math.round(seconds / TIME_STEP)
  for (let i = 0; i < count; i++) step(w, hooks)
}

/** Restores a snapshot into a new World2D, carrying over which bodies are jointed. */
export function restore(from: World2D, snapshot: Uint8Array) {
  const restored = new World2D(RAPIER.World.restoreSnapshot(snapshot))
  for (const body of from.jointedBodies) restored.jointedBodies.push(restored.world.getRigidBody(body.handle))
  return restored
}

export function addBall(w: World2D, x: number, y: number) {
  const ball = w.createBody({ position: [x, y], ccd: true, canSleep: false })
  w.addBall(ball, { radius: BALL_RADIUS })
  return ball
}

/** Every body's position and rotation, flattened, for exact comparisons. */
export function trace(world: RAPIER.World) {
  const out: number[] = []
  world.forEachRigidBody((b) => {
    const t = b.translation()
    const r = b.rotation()
    out.push(t.x, t.y, t.z, r.x, r.y, r.z, r.w)
  })
  return out
}
