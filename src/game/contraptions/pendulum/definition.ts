import { degToRad, type Vec2 } from '@shared/math'
import { MATERIALS } from '../../engine/materials'
import { frameOf } from '../frame'
import type { ContraptionDefinition, ContraptionParams } from '../types'

export const PENDULUM_BOB = 0.3
export const PENDULUM_MOUNT: readonly [number, number] = [0.4, 0.15]
export const PENDULUM_WIDTH = 0.8

export function pendulumGeometry({ length = 1.6, swing = 45 }: ContraptionParams) {
  const height = length + PENDULUM_BOB + PENDULUM_MOUNT[1]
  const anchor: Vec2 = [0, height / 2 - PENDULUM_MOUNT[1] / 2]
  const start = degToRad(swing)
  /** Bob position for a swing angle (0 = hanging straight down, positive = toward +X). */
  const bobAt = (angle: number): Vec2 => [
    anchor[0] + Math.sin(angle) * length,
    anchor[1] - Math.cos(angle) * length,
  ]
  return { height, anchor, start, bobAt }
}

export const pendulum: ContraptionDefinition = {
  type: 'pendulum',
  name: 'Pendulum',
  description: 'A heavy bob that swings down and knocks the ball. Flip it to start from the other side.',
  flippable: true,
  defaultParams: { length: 1.6, swing: 45 },
  // Wide enough to cover the raised bob on either side, so it never spawns inside other geometry.
  footprint: (params) => {
    const { height, start } = pendulumGeometry(params)
    const reach = Math.abs(Math.sin(start)) * (params.length ?? 1.6) + PENDULUM_BOB
    return { width: Math.max(PENDULUM_WIDTH, reach * 2), height }
  },
  build(world, placed, params) {
    const frame = frameOf(placed)
    const { anchor, start, bobAt } = pendulumGeometry(params)
    const length = params.length ?? 1.6
    const mount = world.createBody({ type: 'fixed', position: frame.point(anchor), angle: placed.angle })
    world.addBox(mount, { width: PENDULUM_MOUNT[0], height: PENDULUM_MOUNT[1] })
    // The bob starts raised by `swing`; rotating its body by the same angle keeps the joint anchor at (0, L).
    const bob = world.createBody({
      position: frame.point(bobAt(start)),
      angle: frame.angle(start),
      jointed: true,
    })
    world.addBall(bob, { radius: PENDULUM_BOB, material: MATERIALS.heavy })
    world.addPinJoint(mount, bob, [0, 0], [0, length])
    return { bodies: [bob] }
  },
}
