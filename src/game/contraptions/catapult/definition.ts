import { degToRad, quatFromAngle, type Vec2 } from '@shared/math'
import { sensorContains } from '../../engine/physics/sensors'
import { frameOf } from '../frame'
import type { ContraptionDefinition } from '../types'

/** Local layout (footprint 2.2 × 0.9 centred on the position). The cup is at the -X end. */
export const CATAPULT = {
  width: 2.2,
  height: 0.9,
  base: { center: [0.4, -0.2] as Vec2, size: [0.3, 0.5] as Vec2 },
  pivot: [0.4, 0.1] as Vec2,
  /** Arm parts relative to the pivot, in the arm's own frame. */
  plank: { center: [-0.4, 0] as Vec2, size: [2.2, 0.12] as Vec2 },
  outerLip: { center: [-1.45, 0.14] as Vec2, size: [0.1, 0.16] as Vec2 },
  innerLip: { center: [-0.85, 0.1] as Vec2, size: [0.08, 0.08] as Vec2 },
  cup: { center: [-1.15, 0.3] as Vec2, size: [0.5, 0.45] as Vec2 },
} as const

/** Seconds the ball must sit in the cup before the arm fires. */
const ARM_DELAY = 0.25
const HOLD = 0.4
const RETURN_SPEED = 1.5
const COOLDOWN = 0.5

type Phase = 'rest' | 'armed' | 'swing' | 'hold' | 'return' | 'cooldown'

export const catapult: ContraptionDefinition = {
  type: 'catapult',
  name: 'Catapult',
  description: 'Fires when the ball lands in its cup. Launch angle is 90° minus the sweep.',
  flippable: true,
  defaultParams: { power: 8, sweep: 45 },
  footprint: () => ({ width: CATAPULT.width, height: CATAPULT.height }),
  build(world, placed, { power = 8, sweep = 45 }) {
    const frame = frameOf(placed)
    const base = world.createBody({
      type: 'fixed',
      position: frame.point(CATAPULT.base.center),
      angle: placed.angle,
    })
    world.addBox(base, { width: CATAPULT.base.size[0], height: CATAPULT.base.size[1] })

    const arm = world.createBody({
      type: 'kinematicPosition',
      position: frame.point(CATAPULT.pivot),
      angle: placed.angle,
    })
    for (const part of [CATAPULT.plank, CATAPULT.outerLip, CATAPULT.innerLip]) {
      world.addBox(arm, { width: part.size[0], height: part.size[1], offset: frame.offset(part.center) })
    }
    const cup = world.addBox(arm, {
      width: CATAPULT.cup.size[0],
      height: CATAPULT.cup.size[1],
      offset: frame.offset(CATAPULT.cup.center),
      sensor: true,
    })

    const target = -degToRad(sweep)
    const restCup = frame.point([
      CATAPULT.pivot[0] + CATAPULT.cup.center[0],
      CATAPULT.pivot[1] + CATAPULT.cup.center[1],
    ])
    // Geometric cup test: a sensor on a kinematic arm does not reliably see the ball until the arm has moved.
    const inCup = (ball: { translation(): { x: number; y: number } }) => {
      const p = ball.translation()
      return Math.hypot(p.x - restCup[0], p.y - restCup[1]) < 0.4
    }
    let phase: Phase = 'rest'
    let since = 0
    let angle = 0

    const go = (next: Phase, time: number) => {
      phase = next
      since = time
    }

    return {
      bodies: [arm],
      holdsBall: () => phase === 'armed',
      beforeStep({ time, dt, ball }) {
        const elapsed = time - since
        switch (phase) {
          case 'rest':
            if (inCup(ball) || sensorContains(world.world, cup, ball)) go('armed', time)
            break
          case 'armed':
            if (!inCup(ball) && !sensorContains(world.world, cup, ball)) go('rest', time)
            else if (elapsed >= ARM_DELAY) go('swing', time)
            break
          case 'swing':
            angle = Math.max(target, angle - power * dt)
            if (angle === target) go('hold', time)
            break
          case 'hold':
            if (elapsed >= HOLD) go('return', time)
            break
          case 'return':
            angle = Math.min(0, angle + RETURN_SPEED * dt)
            if (angle === 0) go('cooldown', time)
            break
          case 'cooldown':
            if (elapsed >= COOLDOWN) go('rest', time)
            break
        }
        arm.setNextKinematicRotation(quatFromAngle(frame.angle(angle)))
      },
    }
  },
}
