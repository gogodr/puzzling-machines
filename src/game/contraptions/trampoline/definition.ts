import { MATERIALS } from '../../engine/materials'
import type { ContraptionDefinition } from '../types'

export const TRAMPOLINE_THICKNESS = 0.25

export const trampoline: ContraptionDefinition = {
  type: 'trampoline',
  name: 'Trampoline',
  description: 'A springy pad that bounces the ball back up.',
  flippable: false,
  defaultParams: { width: 1.5 },
  footprint: ({ width = 1.5 }) => ({ width, height: TRAMPOLINE_THICKNESS }),
  build(world, placed, { width = 1.5 }) {
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    world.addBox(body, { width, height: TRAMPOLINE_THICKNESS, material: MATERIALS.bouncy })
    return {}
  },
}
