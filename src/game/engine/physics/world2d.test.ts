import RAPIER from '@dimforge/rapier3d-compat'
import { beforeAll, describe, expect, it } from 'vitest'
import { addBall, restore, run, step, trace } from '@test/physics'
import { BALL_RADIUS, MAX_BALL_SPEED, MIN_WALL_THICKNESS, TIME_STEP } from '../determinism'
import { CombineRule, MATERIALS } from '../materials'
import { clampSpeed } from './speedClamp'
import { stepConveyor } from './treadmill'
import { loadRapier, World2D } from './world2d'

beforeAll(async () => {
  await loadRapier()
})

function addGround(w: World2D, y = 0) {
  const ground = w.createBody({ type: 'fixed', position: [0, y] })
  w.addBox(ground, { width: 40, height: 0.5 })
  return ground
}

function addConveyor(w: World2D, anchor: [number, number], width: number, speed: number) {
  const body = w.createBody({ type: 'kinematicVelocity', position: anchor })
  const surface = w.addBox(body, { width, height: 0.2, material: MATERIALS.belt })
  return { body, surface, step: () => stepConveyor(w.world, body, surface, anchor, [speed, 0]) }
}

function addSeesaw(w: World2D, x: number, y: number) {
  const pivot = w.createBody({ type: 'fixed', position: [x, y] })
  w.addBox(pivot, { width: 0.3, height: 0.5 })
  const plank = w.createBody({ position: [x, y + 0.325], jointed: true })
  w.addBox(plank, { width: 4, height: 0.15 })
  w.addRevoluteJoint(pivot, plank, [0, 0.25], [0, -0.075])
  return plank
}

/** Ramp, conveyor, seesaw and several balls: the Phase 0 spike. */
function buildSpike(w: World2D) {
  addGround(w, -4.25)
  const ramp = w.createBody({ type: 'fixed', position: [-5, 2.2], angle: -0.3 })
  w.addBox(ramp, { width: 5, height: 0.2 })
  const conveyor = addConveyor(w, [-0.5, -0.5], 4, 2)
  const plank = addSeesaw(w, 4, -3.75)
  const balls = [addBall(w, -6.8, 3.6), addBall(w, -1.5, 1), addBall(w, 5.5, 3)]
  const hooks = {
    before: conveyor.step,
    after: () => balls.forEach((b) => clampSpeed(b, MAX_BALL_SPEED)),
  }
  return { balls, plank, conveyor, hooks }
}

describe('World2D', () => {
  it('drops a ball that settles on the ground in-plane', () => {
    const w = World2D.create()
    addGround(w)
    const ball = addBall(w, 0, 3)
    run(w, 3)
    const t = ball.translation()
    expect(t.y).toBeCloseTo(0.25 + BALL_RADIUS, 2)
    expect(t.z).toBe(0)
    expect(Math.hypot(ball.linvel().x, ball.linvel().y)).toBeLessThan(0.05)
    w.free()
  })

  it('keeps every body in the XY plane through 30 s of the spike', () => {
    const w = World2D.create()
    const { hooks } = buildSpike(w)
    let maxZ = 0
    let maxOffAxisRotation = 0
    for (let i = 0; i < 30 / TIME_STEP; i++) {
      step(w, hooks)
      w.world.forEachRigidBody((b) => {
        const t = b.translation()
        const r = b.rotation()
        maxZ = Math.max(maxZ, Math.abs(t.z))
        maxOffAxisRotation = Math.max(maxOffAxisRotation, Math.abs(r.x), Math.abs(r.y))
      })
    }
    expect(maxZ).toBeLessThan(1e-6)
    expect(maxOffAxisRotation).toBeLessThan(1e-6)
    w.free()
  })

  it('conveyor carries a resting ball at close to belt speed and stays anchored', () => {
    const w = World2D.create()
    const conveyor = addConveyor(w, [0, 0], 8, 2)
    const ball = addBall(w, -3, 0.1 + BALL_RADIUS + 0.01)
    run(w, 1.5, { before: conveyor.step })
    expect(ball.linvel().x).toBeGreaterThan(1.8)
    expect(ball.translation().x).toBeGreaterThan(-3 + 2)
    expect(conveyor.body.translation().x).toBeCloseTo(0, 1)
    w.free()
  })

  it('seesaw tips toward a ball dropped on one end and stays in-plane', () => {
    const w = World2D.create()
    const plank = addSeesaw(w, 0, 0)
    addBall(w, 1.7, 1.5)
    run(w, 1)
    // Negative Z rotation = clockwise = right end down.
    expect(plank.rotation().z).toBeLessThan(-0.1)
    expect(Math.abs(plank.rotation().x) + Math.abs(plank.rotation().y)).toBeLessThan(1e-6)
    expect(Math.abs(plank.translation().z)).toBeLessThan(1e-6)
    w.free()
  })

  it('is deterministic: two identical runs produce identical state', () => {
    const once = () => {
      const w = World2D.create()
      const { hooks } = buildSpike(w)
      run(w, 10, hooks)
      const out = trace(w.world)
      w.free()
      return out
    }
    expect(once()).toEqual(once())
  })

  it('restores a snapshot that replays identically', () => {
    const w = World2D.create()
    const spike = buildSpike(w)
    run(w, 1, spike.hooks)
    const snapshot = w.world.takeSnapshot()
    run(w, 3, spike.hooks)
    const original = trace(w.world)

    const restored = restore(w, snapshot)
    const body = restored.world.getRigidBody(spike.conveyor.body.handle)
    const surface = restored.world.getCollider(spike.conveyor.surface.handle)
    const balls = spike.balls.map((b) => restored.world.getRigidBody(b.handle))
    run(restored, 3, {
      before: () => stepConveyor(restored.world, body, surface, [-0.5, -0.5], [2, 0]),
      after: () => balls.forEach((b) => clampSpeed(b, MAX_BALL_SPEED)),
    })
    expect(trace(restored.world)).toEqual(original)
    w.free()
    restored.free()
  })
})

describe('known Rapier behaviour', () => {
  // If this starts failing, Rapier fixed the bug and `jointed` bodies can use full planar locks again.
  it('locking X/Y rotation freezes a revolute joint (why bodies have `jointed`)', () => {
    const w = World2D.create()
    const pivot = w.createBody({ type: 'fixed', position: [0, 0] })
    w.addBox(pivot, { width: 0.3, height: 0.5 })
    const plank = w.createBody({ position: [0, 0.325], jointed: false })
    w.addBox(plank, { width: 4, height: 0.15 })
    w.addRevoluteJoint(pivot, plank, [0, 0.25], [0, -0.075])
    addBall(w, 1.7, 1.5)
    run(w, 1)
    expect(Math.abs(plank.rotation().z)).toBeLessThan(0.01)
    w.free()
  })
})

describe('engine constants', () => {
  it('mirrors Rapier combine rule values', () => {
    expect(CombineRule.Average).toBe(RAPIER.CoefficientCombineRule.Average)
    expect(CombineRule.Min).toBe(RAPIER.CoefficientCombineRule.Min)
    expect(CombineRule.Multiply).toBe(RAPIER.CoefficientCombineRule.Multiply)
    expect(CombineRule.Max).toBe(RAPIER.CoefficientCombineRule.Max)
  })

  it('keeps the thinnest wall thicker than one step of travel at max speed', () => {
    expect(MIN_WALL_THICKNESS).toBeGreaterThan(MAX_BALL_SPEED * TIME_STEP)
  })
})
