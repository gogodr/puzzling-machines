import { dynamicBodiesIn } from '../../engine/physics/sensors'
import { frameOf } from '../frame'
import type { ContraptionDefinition } from '../types'

export const FAN_HOUSING: readonly [number, number] = [0.5, 0.9]
/** Width of the air stream, across the blowing direction. */
export const FAN_STREAM = 0.9

export const fan: ContraptionDefinition = {
  type: 'fan',
  name: 'Fan',
  description: 'Blows the ball along its air stream; weaker further away. Point it up to lift.',
  flippable: true,
  defaultParams: { range: 3, strength: 18 },
  footprint: () => ({ width: FAN_HOUSING[0], height: FAN_HOUSING[1] }),
  build(world, placed, { range = 3, strength = 18 }) {
    const frame = frameOf(placed)
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    world.addBox(body, { width: FAN_HOUSING[0], height: FAN_HOUSING[1] })
    const face = FAN_HOUSING[0] / 2
    const stream = world.addBox(body, {
      width: range,
      height: FAN_STREAM,
      offset: frame.offset([face + range / 2, 0]),
      sensor: true,
    })
    const [dx, dy] = frame.direction([1, 0])
    const [ox, oy] = frame.point([face, 0])

    return {
      beforeStep({ dt }) {
        for (const rider of dynamicBodiesIn(world.world, stream)) {
          const p = rider.translation()
          const along = (p.x - ox) * dx + (p.y - oy) * dy
          // Acceleration rather than force so the fan pushes every body the same way regardless of mass.
          const a = strength * Math.min(1, Math.max(0, 1 - along / range)) * dt
          const v = rider.linvel()
          rider.setLinvel({ x: v.x + dx * a, y: v.y + dy * a, z: 0 }, true)
        }
      },
    }
  },
}
