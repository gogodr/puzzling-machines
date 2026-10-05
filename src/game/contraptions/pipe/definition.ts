import { MATERIALS } from '../../engine/materials'
import { frameOf } from '../frame'
import type { ContraptionDefinition, ContraptionParams } from '../types'
import { addWalls, arcSegments, WALL_THICKNESS, type Segment } from '../walls'

/** Inside clearance of every pipe; the ball is 0.5 across. */
export const PIPE_BORE = 0.65
export const PIPE_HEIGHT = PIPE_BORE + 2 * WALL_THICKNESS
const WALL_CENTER = PIPE_BORE / 2 + WALL_THICKNESS / 2
const ARC_SEGMENTS = 8

export function pipeSegments({ length = 3 }: ContraptionParams): Segment[] {
  return [-1, 1].map((side) => ({
    a: [-length / 2, side * WALL_CENTER],
    b: [length / 2, side * WALL_CENTER],
  }))
}

/**
 * Quarter bend: enters at the top moving down, leaves at the right moving right. The arc centre sits
 * at the top-right corner of the footprint so the footprint stays centred on the position.
 */
export function pipeCurveGeometry({ radius = 1.3 }: ContraptionParams) {
  const outer = radius + PIPE_BORE / 2 + WALL_THICKNESS
  const center: [number, number] = [outer / 2, outer / 2]
  const segments = [
    ...arcSegments(center, radius - WALL_CENTER, Math.PI, Math.PI * 1.5, ARC_SEGMENTS),
    ...arcSegments(center, radius + WALL_CENTER, Math.PI, Math.PI * 1.5, ARC_SEGMENTS),
  ]
  return { size: outer, center, segments }
}

export const pipe: ContraptionDefinition = {
  type: 'pipe',
  name: 'Pipe',
  description: 'A straight tube that keeps the ball on course.',
  flippable: false,
  defaultParams: { length: 3 },
  footprint: ({ length = 3 }) => ({ width: length, height: PIPE_HEIGHT }),
  build(world, placed, params) {
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    addWalls(world, body, frameOf(placed), pipeSegments(params), { material: MATERIALS.slippery })
    return {}
  },
}

export const pipeCurve: ContraptionDefinition = {
  type: 'pipeCurve',
  name: 'Bend',
  description: 'A quarter-circle tube that turns the ball 90°.',
  flippable: true,
  defaultParams: { radius: 1.3 },
  footprint: (params) => {
    const { size } = pipeCurveGeometry(params)
    return { width: size, height: size }
  },
  build(world, placed, params) {
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    // Overlap closes the gaps between straight segments on the outside of the bend.
    addWalls(world, body, frameOf(placed), pipeCurveGeometry(params).segments, {
      overlap: WALL_THICKNESS,
      material: MATERIALS.slippery,
    })
    return {}
  },
}
