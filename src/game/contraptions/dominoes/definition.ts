import { frameOf } from '../frame'
import type { ContraptionDefinition, ContraptionParams } from '../types'

export const DOMINO: readonly [number, number] = [0.12, 0.7]
export const DOMINO_SPACING = 0.4

export function dominoOffsets({ count = 5 }: ContraptionParams) {
  const n = Math.max(2, Math.round(count))
  const span = (n - 1) * DOMINO_SPACING
  return Array.from({ length: n }, (_, i) => -span / 2 + i * DOMINO_SPACING)
}

export const dominoes: ContraptionDefinition = {
  type: 'dominoes',
  name: 'Dominoes',
  description: 'A row of tiles that topple in a chain. Place them on a surface.',
  flippable: false,
  defaultParams: { count: 5 },
  footprint: (params) => {
    const offsets = dominoOffsets(params)
    return { width: (offsets.at(-1) ?? 0) * 2 + DOMINO[0], height: DOMINO[1] }
  },
  build(world, placed, params) {
    const frame = frameOf(placed)
    const bodies = dominoOffsets(params).map((x) => {
      const body = world.createBody({ position: frame.point([x, 0]), angle: placed.angle })
      world.addBox(body, { width: DOMINO[0], height: DOMINO[1] })
      return body
    })
    return { bodies }
  },
}
