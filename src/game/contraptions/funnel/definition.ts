import type { ContraptionParams } from '../types'
import { frameOf } from '../frame'
import { addWalls, WALL_THICKNESS, type Segment } from '../walls'
import type { ContraptionDefinition } from '../types'

/** The bottom opening; wide enough for the ball (0.5) with clearance. */
export const FUNNEL_GAP = 0.7

export function funnelSegments({ width = 2, height = 1.2 }: ContraptionParams): Segment[] {
  const top = height / 2 - WALL_THICKNESS / 2
  const bottom = -height / 2 + WALL_THICKNESS / 2
  const outer = width / 2 - WALL_THICKNESS / 2
  const inner = FUNNEL_GAP / 2 + WALL_THICKNESS / 2
  return [
    { a: [-outer, top], b: [-inner, bottom] },
    { a: [inner, bottom], b: [outer, top] },
  ]
}

export const funnel: ContraptionDefinition = {
  type: 'funnel',
  name: 'Funnel',
  description: 'Catches a falling ball and drops it out of the bottom.',
  flippable: false,
  defaultParams: { width: 2, height: 1.2 },
  footprint: ({ width = 2, height = 1.2 }) => ({ width, height }),
  build(world, placed, params) {
    const frame = frameOf(placed)
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    addWalls(world, body, frame, funnelSegments(params))
    return {}
  },
}
