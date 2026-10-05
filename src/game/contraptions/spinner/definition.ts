import { frameOf } from '../frame'
import type { ContraptionDefinition, ContraptionParams } from '../types'

export const SPINNER_BLADE_THICKNESS = 0.12
export const SPINNER_HUB = 0.25

export function spinnerBlades({ radius = 0.9, blades = 4 }: ContraptionParams) {
  const count = Math.max(2, Math.round(blades))
  return Array.from({ length: count }, (_, i) => {
    const angle = (i * Math.PI * 2) / count
    return {
      angle,
      center: [(Math.cos(angle) * radius) / 2, (Math.sin(angle) * radius) / 2] as const,
      length: radius,
    }
  })
}

export const spinner: ContraptionDefinition = {
  type: 'spinner',
  name: 'Spinner',
  description: 'A motorised paddle wheel that flicks the ball. Flip it to spin the other way.',
  flippable: true,
  defaultParams: { radius: 0.9, speed: 3, blades: 4 },
  footprint: ({ radius = 0.9 }) => ({ width: radius * 2, height: radius * 2 }),
  build(world, placed, params) {
    const frame = frameOf(placed)
    const body = world.createBody({
      type: 'kinematicVelocity',
      position: placed.position,
      angle: placed.angle,
    })
    world.addBox(body, { width: SPINNER_HUB, height: SPINNER_HUB })
    for (const blade of spinnerBlades(params)) {
      world.addBox(body, {
        width: blade.length,
        height: SPINNER_BLADE_THICKNESS,
        offset: frame.offset(blade.center),
        angle: frame.offsetAngle(blade.angle),
      })
    }
    // Unflipped spins clockwise (paddles at the top move toward +X).
    const angvel = -frame.offsetAngle(params.speed ?? 3)
    const [x, y] = placed.position
    return {
      bodies: [body],
      beforeStep() {
        body.setTranslation({ x, y, z: 0 }, true)
        body.setLinvel({ x: 0, y: 0, z: 0 }, true)
        body.setAngvel({ x: 0, y: 0, z: angvel }, true)
      },
    }
  },
}
