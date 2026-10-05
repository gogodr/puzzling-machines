import { beforeAll, describe, expect, it } from 'vitest'
import type { PlacedContraption } from '@shared/layout'
import { addBall, run } from '@test/physics'
import { TIME_STEP } from '../engine/determinism'
import { loadRapier, type RigidBody, World2D } from '../engine/physics/world2d'
import { CONTRAPTIONS, resolveParams } from './registry'
import type { ContraptionInstance } from './types'

beforeAll(async () => {
  await loadRapier()
})

function place(
  type: PlacedContraption['type'],
  overrides: Partial<PlacedContraption> = {},
): PlacedContraption {
  return { id: 'x', type, position: [0, 0], angle: 0, flipped: false, params: {}, ...overrides }
}

function build(w: World2D, placed: PlacedContraption) {
  w.owner = placed.id
  const instance = CONTRAPTIONS[placed.type].build(w, placed, resolveParams(placed))
  w.owner = null
  return instance
}

function drive(w: World2D, instance: ContraptionInstance, ball: RigidBody, seconds: number) {
  let time = 0
  run(w, seconds, {
    before: () => {
      instance.beforeStep?.({ time, dt: TIME_STEP, ball })
      time += TIME_STEP
    },
  })
}

describe('ramp', () => {
  it('rolls the ball downhill', () => {
    const w = World2D.create()
    build(w, place('ramp', { angle: -0.3 }))
    const ball = addBall(w, -0.5, 0.8)
    run(w, 1)
    expect(ball.linvel().x).toBeGreaterThan(0.5)
    w.free()
  })
})

describe('conveyor', () => {
  it.each([
    [false, 1],
    [true, -1],
  ])('flipped=%s carries the ball in direction %i', (flipped, sign) => {
    const w = World2D.create()
    const instance = build(w, place('conveyor', { flipped, params: { length: 6 } }))
    const ball = addBall(w, 0, 0.45)
    drive(w, instance, ball, 1)
    expect(ball.linvel().x * sign).toBeGreaterThan(1.5)
    w.free()
  })

  it('carries along its own angle', () => {
    const w = World2D.create()
    const instance = build(w, place('conveyor', { angle: 0.2, params: { length: 6, speed: 3 } }))
    const ball = addBall(w, -1, 0.3)
    drive(w, instance, ball, 1)
    expect(ball.translation().y).toBeGreaterThan(0.3)
    w.free()
  })
})

describe('trampoline', () => {
  it('bounces higher than a ramp does', () => {
    const peakAfterBounce = (type: 'trampoline' | 'ramp') => {
      const w = World2D.create()
      build(w, place(type))
      const ball = addBall(w, 0, 3)
      let landed = false
      let peak = 0
      run(w, 2, {
        after: () => {
          const y = ball.translation().y
          if (ball.linvel().y > 0) landed = true
          if (landed) peak = Math.max(peak, y)
        },
      })
      w.free()
      return peak
    }
    const trampoline = peakAfterBounce('trampoline')
    expect(trampoline).toBeGreaterThan(2)
    expect(trampoline).toBeGreaterThan(peakAfterBounce('ramp') + 1)
  })
})

describe('fan', () => {
  it('pushes a hovering ball along the stream, and the other way when flipped', () => {
    const blow = (flipped: boolean) => {
      const w = World2D.create()
      const instance = build(w, place('fan', { flipped }))
      const ball = addBall(w, flipped ? -1.2 : 1.2, 0)
      ball.setLinvel({ x: 0, y: 0, z: 0 }, true)
      drive(w, instance, ball, 0.4)
      const vx = ball.linvel().x
      w.free()
      return vx
    }
    expect(blow(false)).toBeGreaterThan(2)
    expect(blow(true)).toBeLessThan(-2)
  })
})

describe('spinner', () => {
  it('flicks a ball that sits on a blade', () => {
    const w = World2D.create()
    const instance = build(w, place('spinner', { params: { speed: 6 } }))
    const ball = addBall(w, 0.55, 0.55)
    drive(w, instance, ball, 0.6)
    expect(Math.hypot(ball.linvel().x, ball.linvel().y)).toBeGreaterThan(1)
    w.free()
  })
})

describe('seesaw', () => {
  it('tips toward a ball dropped on one end', () => {
    const w = World2D.create()
    const instance = build(w, place('seesaw'))
    addBall(w, 1.2, 1.2)
    run(w, 1)
    const plank = instance.bodies?.[0]
    expect(plank).toBeDefined()
    expect(plank!.rotation().z).toBeLessThan(-0.1)
    w.free()
  })
})

describe('pendulum', () => {
  it('swings down from its raised start', () => {
    const w = World2D.create()
    const instance = build(w, place('pendulum'))
    const bob = instance.bodies?.[0]
    expect(bob).toBeDefined()
    const startX = bob!.translation().x
    run(w, 0.8)
    expect(bob!.translation().x).toBeLessThan(startX - 0.2)
    w.free()
  })

  it.each([false, true])('flipped=%s keeps a steady swing on its arm', (flipped) => {
    const w = World2D.create()
    const instance = build(w, place('pendulum', { flipped }))
    const bob = instance.bodies![0]!
    const pivot = { x: 0, y: 0.95 }
    const start = bob.translation()
    let maxArm = 0
    let minArm = Infinity
    let farSide = 0
    run(w, 6, {
      after: () => {
        const t = bob.translation()
        const arm = Math.hypot(t.x - pivot.x, t.y - pivot.y)
        maxArm = Math.max(maxArm, arm)
        minArm = Math.min(minArm, arm)
        farSide = Math.max(farSide, -Math.sign(start.x) * t.x)
      },
    })
    expect(minArm).toBeGreaterThan(1.55)
    expect(maxArm).toBeLessThan(1.65)
    expect(farSide).toBeGreaterThan(1)
    w.free()
  })
})

describe('dominoes', () => {
  it('topples the last tile after the first is struck', () => {
    const w = World2D.create()
    const floor = w.createBody({ type: 'fixed', position: [0, -0.5] })
    w.addBox(floor, { width: 8, height: 0.3 })
    const instance = build(w, place('dominoes', { position: [0, 0] }))
    const striker = addBall(w, -1.3, 0.2)
    striker.setLinvel({ x: 6, y: 0, z: 0 }, true)
    run(w, 2)
    const last = instance.bodies?.at(-1)
    expect(last).toBeDefined()
    expect(Math.abs(last!.rotation().z)).toBeGreaterThan(0.4)
    w.free()
  })
})

describe('funnel', () => {
  it('drops a ball through its gap', () => {
    const w = World2D.create()
    build(w, place('funnel'))
    const ball = addBall(w, -0.6, 1.4)
    run(w, 1.5)
    expect(ball.translation().y).toBeLessThan(-0.6)
    w.free()
  })
})

describe('pipe', () => {
  it('guides a ball from one end to the other', () => {
    const w = World2D.create()
    build(w, place('pipe', { params: { length: 4 } }))
    const ball = addBall(w, -1.6, 0)
    ball.setLinvel({ x: 4, y: 0, z: 0 }, true)
    run(w, 1)
    expect(ball.translation().x).toBeGreaterThan(1)
    expect(Math.abs(ball.translation().y)).toBeLessThan(0.4)
    w.free()
  })
})

describe('pipeCurve', () => {
  it('turns a falling ball to the right', () => {
    const w = World2D.create()
    build(w, place('pipeCurve'))
    const ball = addBall(w, -0.4, 0.9)
    run(w, 1.2)
    expect(ball.translation().x).toBeGreaterThan(0.5)
    expect(ball.linvel().x).toBeGreaterThan(0.5)
    w.free()
  })
})

describe('catapult', () => {
  it('launches a ball that sits in the cup', () => {
    const w = World2D.create()
    const instance = build(w, place('catapult'))
    const ball = addBall(w, -0.75, 0.55)
    let peakVy = 0
    let time = 0
    run(w, 1.2, {
      before: () => {
        instance.beforeStep?.({ time, dt: TIME_STEP, ball })
        time += TIME_STEP
      },
      after: () => {
        peakVy = Math.max(peakVy, ball.linvel().y)
      },
    })
    expect(peakVy).toBeGreaterThan(3)
    w.free()
  })
})

describe('sling', () => {
  it('holds then fires the ball along its facing', () => {
    const w = World2D.create()
    const instance = build(w, place('sling'))
    const ball = addBall(w, 0, 0.2)
    drive(w, instance, ball, 0.7)
    expect(ball.linvel().x).toBeGreaterThan(4)
    expect(ball.linvel().y).toBeGreaterThan(4)
    w.free()
  })
})

describe('elevator', () => {
  it('lifts a ball that lands on the platform', () => {
    const w = World2D.create()
    const instance = build(w, place('elevator', { params: { height: 3, speed: 3 } }))
    const ball = addBall(w, 0, -1.4)
    drive(w, instance, ball, 2)
    expect(ball.translation().y).toBeGreaterThan(0.5)
    w.free()
  })
})
