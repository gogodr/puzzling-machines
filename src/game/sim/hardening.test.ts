import { describe, expect, it } from 'vitest'
import { CONTRAPTION_TYPES, type Layout, type PlacedContraption } from '@shared/layout'
import { addBall, run } from '@test/physics'
import { BALL_RADIUS, MAX_BALL_SPEED, MIN_WALL_THICKNESS, TIME_STEP } from '../engine/determinism'
import { loadRapier, World2D } from '../engine/physics/world2d'
import { sandbox } from '../scenes/sandbox'
import { B_TOUCH, TOUCH_DECAY } from '../scoring/ScoreTracker'
import { defineScene } from '../scenes/schema'
import { simulateRun } from './simulateRun'

const loopScene = defineScene({
  id: 'loop-harness',
  name: 'Loop',
  bounds: { minX: -6, minY: -3, maxX: 6, maxY: 3 },
  statics: [
    { position: [0, -1.2], size: [8, 0.3] },
    { position: [-3.2, 0.4], size: [0.3, 2.8] },
    { position: [3.2, 0.4], size: [0.3, 2.8] },
    { position: [0, 1.6], size: [6.8, 0.3] },
  ],
  buildZones: [{ minX: -5, minY: -2, maxX: 5, maxY: 2 }],
  start: { position: [-1.5, -0.7] },
  goal: { minX: 4.5, minY: 2.2, maxX: 5.5, maxY: 2.8 },
  inventory: [
    { type: 'conveyor', count: 2 },
    { type: 'fan', count: 1 },
  ],
  limits: { maxRunTime: 8, stallSeconds: 20 },
  referenceSolution: [
    { id: 'c1', type: 'conveyor', position: [-1.25, -0.9], angle: 0, flipped: false, params: { length: 3 } },
    { id: 'c2', type: 'conveyor', position: [1.25, 0.6], angle: 0, flipped: true, params: { length: 3 } },
    {
      id: 'f1',
      type: 'fan',
      position: [2.4, -0.4],
      angle: Math.PI / 2,
      flipped: false,
      params: { range: 2, strength: 22 },
    },
  ],
})

describe('simulation hardening', () => {
  it('does not let a max-speed ball tunnel through the thinnest allowed wall', async () => {
    await loadRapier()
    const w = World2D.create()
    const wall = w.createBody({ type: 'fixed', position: [2, 0] })
    w.addBox(wall, { width: MIN_WALL_THICKNESS, height: 4 })
    const ball = addBall(w, 0, 0)
    ball.setLinvel({ x: MAX_BALL_SPEED, y: 0, z: 0 }, true)
    run(w, 0.5)
    expect(ball.translation().x).toBeLessThan(2 - MIN_WALL_THICKNESS / 2 - BALL_RADIUS + 0.05)
    w.free()
  })

  it('ends a looping machine at the time cap with a finite, converging score', async () => {
    const result = await simulateRun(loopScene, loopScene.referenceSolution)
    expect(result.outcome).toEqual({ kind: 'fail', reason: 'timeout' })
    expect(result.runTime).toBeCloseTo(loopScene.limits.maxRunTime, 2)
    const cap = B_TOUCH / (1 - TOUCH_DECAY)
    expect(result.breakdown.bonus).toBeLessThan(result.breakdown.touched * cap + 1)
    expect(result.score).toBe(0)
  })

  it('keeps every sandbox body in the XY plane for 20 s', async () => {
    await loadRapier()
    const w = World2D.create()
    const layout: Layout = CONTRAPTION_TYPES.map((type, i) => {
      const col = i % 5
      const row = Math.floor(i / 5)
      return {
        id: `p${i}`,
        type,
        position: [-8 + col * 4, 4 - row * 3.5],
        angle: 0,
        flipped: false,
        params: {},
      } satisfies PlacedContraption
    })
    const { Simulation } = await import('./Simulation')
    const sim = new Simulation(w, sandbox, layout)
    for (let i = 0; i < 20 / TIME_STEP; i++) {
      sim.beforeStep()
      w.world.step()
      sim.afterStep()
    }
    let maxZ = 0
    let maxOff = 0
    w.world.forEachRigidBody((b) => {
      const t = b.translation()
      const r = b.rotation()
      maxZ = Math.max(maxZ, Math.abs(t.z))
      maxOff = Math.max(maxOff, Math.abs(r.x), Math.abs(r.y))
    })
    expect(maxZ).toBeLessThan(1e-6)
    expect(maxOff).toBeLessThan(1e-6)
    w.free()
  })
})
