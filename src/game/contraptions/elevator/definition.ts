import { degToRad, quatFromAngle, type Vec2 } from '@shared/math'
import { sensorContains } from '../../engine/physics/sensors'
import { frameOf } from '../frame'
import type { ContraptionDefinition, ContraptionParams } from '../types'

export const ELEVATOR = {
  width: 1.4,
  platform: [1.2, 0.12] as Vec2,
  /** Low lips: they stop a resting ball rolling off but let it out when the platform tips. */
  lip: [0.06, 0.12] as Vec2,
  rider: { center: [0, 0.35] as Vec2, size: [1.1, 0.5] as Vec2 },
  tip: degToRad(45),
} as const

const LOAD_DELAY = 0.3
const TIP_TIME = 0.4
const TIPPED_HOLD = 0.8

type Phase = 'waiting' | 'loaded' | 'up' | 'tip' | 'tipped' | 'untip' | 'down'

/** Platform centre heights in local space: bottom and top of travel. */
export function elevatorTravel({ height = 3 }: ContraptionParams) {
  const footprint = height + 0.5
  const bottom = -footprint / 2 + 0.15
  return { footprint, bottom, top: bottom + height }
}

export const elevator: ContraptionDefinition = {
  type: 'elevator',
  name: 'Elevator',
  description: 'Lifts the ball when it lands on the platform, then tips it out at the top. Flip to tip left.',
  flippable: true,
  defaultParams: { height: 3, speed: 1.5 },
  footprint: (params) => ({ width: ELEVATOR.width, height: elevatorTravel(params).footprint }),
  build(world, placed, params) {
    const frame = frameOf(placed)
    const { bottom, top } = elevatorTravel(params)
    const speed = params.speed ?? 1.5
    const platform = world.createBody({
      type: 'kinematicPosition',
      position: frame.point([0, bottom]),
      angle: placed.angle,
    })
    world.addBox(platform, { width: ELEVATOR.platform[0], height: ELEVATOR.platform[1] })
    const lipX = ELEVATOR.platform[0] / 2 - ELEVATOR.lip[0] / 2
    for (const side of [-1, 1]) {
      world.addBox(platform, {
        width: ELEVATOR.lip[0],
        height: ELEVATOR.lip[1],
        offset: frame.offset([side * lipX, ELEVATOR.platform[1] / 2]),
      })
    }
    const rider = world.addBox(platform, {
      width: ELEVATOR.rider.size[0],
      height: ELEVATOR.rider.size[1],
      offset: frame.offset(ELEVATOR.rider.center),
      sensor: true,
    })

    let phase: Phase = 'waiting'
    let since = 0
    let y = bottom
    let tilt = 0
    const go = (next: Phase, time: number) => {
      phase = next
      since = time
    }

    return {
      bodies: [platform],
      holdsBall: () => phase === 'loaded' || phase === 'up' || phase === 'tip',
      beforeStep({ time, dt, ball }) {
        const elapsed = time - since
        const carrying = sensorContains(world.world, rider, ball)
        switch (phase) {
          case 'waiting':
            if (carrying) go('loaded', time)
            break
          case 'loaded':
            if (!carrying) go('waiting', time)
            else if (elapsed >= LOAD_DELAY) go('up', time)
            break
          case 'up':
            y = Math.min(top, y + speed * dt)
            if (y === top) go('tip', time)
            break
          case 'tip':
            tilt = Math.min(1, elapsed / TIP_TIME)
            if (tilt === 1) go('tipped', time)
            break
          case 'tipped':
            if (elapsed >= TIPPED_HOLD) go('untip', time)
            break
          case 'untip':
            tilt = Math.max(0, 1 - elapsed / TIP_TIME)
            if (tilt === 0) go('down', time)
            break
          case 'down':
            y = Math.max(bottom, y - speed * dt)
            if (y === bottom) go('waiting', time)
            break
        }
        const [px, py] = frame.point([0, y])
        platform.setNextKinematicTranslation({ x: px, y: py, z: 0 })
        // Tipping lowers the +X side (clockwise in the local frame).
        platform.setNextKinematicRotation(quatFromAngle(frame.angle(-ELEVATOR.tip * tilt)))
      },
    }
  },
}
