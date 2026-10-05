import type { Vec2 } from '@shared/math'
import { MATERIALS } from '../../engine/materials'
import { stepConveyor } from '../../engine/physics/treadmill'
import type { ContraptionDefinition } from '../types'

export const CONVEYOR_THICKNESS = 0.3

/** Belt surface velocity in world space. Unflipped belts carry toward local +X. */
export function conveyorVelocity(angle: number, flipped: boolean, speed: number): Vec2 {
  const s = flipped ? -speed : speed
  return [Math.cos(angle) * s, Math.sin(angle) * s]
}

export const conveyor: ContraptionDefinition = {
  type: 'conveyor',
  name: 'Conveyor',
  description: 'A moving belt. Flip it to reverse direction.',
  flippable: true,
  defaultParams: { length: 3, speed: 2 },
  footprint: ({ length = 3 }) => ({ width: length, height: CONVEYOR_THICKNESS }),
  build(world, placed, { length = 3, speed = 2 }) {
    const body = world.createBody({
      type: 'kinematicVelocity',
      position: placed.position,
      angle: placed.angle,
    })
    const surface = world.addBox(body, {
      width: length,
      height: CONVEYOR_THICKNESS,
      material: MATERIALS.belt,
    })
    const velocity = conveyorVelocity(placed.angle, placed.flipped, speed)
    return { beforeStep: () => stepConveyor(world.world, body, surface, placed.position, velocity) }
  },
}
