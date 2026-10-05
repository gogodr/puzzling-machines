import { MATERIALS } from '../../engine/materials'
import type { ContraptionDefinition } from '../types'

export const RAMP_THICKNESS = 0.2

export const ramp: ContraptionDefinition = {
  type: 'ramp',
  name: 'Ramp',
  description: 'A plank. Tilt it to send the ball rolling.',
  flippable: false,
  defaultParams: { length: 3 },
  footprint: ({ length = 3 }) => ({ width: length, height: RAMP_THICKNESS }),
  build(world, placed, { length = 3 }) {
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    world.addBox(body, { width: length, height: RAMP_THICKNESS, material: MATERIALS.default })
    return {}
  },
}
