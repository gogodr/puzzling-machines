import { degToRad } from '@shared/math'
import { frameOf } from '../frame'
import type { ContraptionDefinition } from '../types'

export const SEESAW_HEIGHT = 0.6
export const SEESAW_PLANK = 0.15
export const SEESAW_PIVOT: readonly [number, number] = [0.3, 0.4]
/** Local centres: the pivot sits on the footprint bottom, the plank rests on the pivot top. */
export const SEESAW_PIVOT_Y = -SEESAW_HEIGHT / 2 + SEESAW_PIVOT[1] / 2
export const SEESAW_PLANK_Y = SEESAW_PIVOT_Y + SEESAW_PIVOT[1] / 2 + SEESAW_PLANK / 2

export const seesaw: ContraptionDefinition = {
  type: 'seesaw',
  name: 'Seesaw',
  description: 'A plank on a hinge that tips toward the heavier side.',
  flippable: false,
  defaultParams: { length: 3, limit: 25 },
  footprint: ({ length = 3 }) => ({ width: length, height: SEESAW_HEIGHT }),
  build(world, placed, { length = 3, limit = 25 }) {
    const frame = frameOf(placed)
    const pivot = world.createBody({
      type: 'fixed',
      position: frame.point([0, SEESAW_PIVOT_Y]),
      angle: placed.angle,
    })
    world.addBox(pivot, { width: SEESAW_PIVOT[0], height: SEESAW_PIVOT[1] })
    const plank = world.createBody({
      position: frame.point([0, SEESAW_PLANK_Y]),
      angle: placed.angle,
      jointed: true,
    })
    world.addBox(plank, { width: length, height: SEESAW_PLANK })
    const l = degToRad(limit)
    world.addRevoluteJoint(pivot, plank, [0, SEESAW_PIVOT[1] / 2], [0, -SEESAW_PLANK / 2], [-l, l])
    return { bodies: [plank] }
  },
}
