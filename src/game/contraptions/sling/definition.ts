import { degToRad, type Vec2 } from '@shared/math'
import { sensorContains } from '../../engine/physics/sensors'
import { frameOf } from '../frame'
import type { ContraptionDefinition } from '../types'

export const SLING = {
  width: 1,
  height: 1.2,
  stem: { center: [0, -0.4] as Vec2, size: [0.14, 0.4] as Vec2 },
  pocket: { center: [0, 0.2] as Vec2, size: [0.7, 0.6] as Vec2 },
  /** Launch direction in local space, before mirroring. */
  launchAngle: degToRad(45),
} as const

/** Seconds the band stretches before release, and how far it pulls the ball back. */
export const SLING_HOLD = 0.5
export const SLING_PULL = 0.3
const COOLDOWN = 0.8

type Phase = 'idle' | 'holding' | 'cooldown'

export const sling: ContraptionDefinition = {
  type: 'sling',
  name: 'Sling',
  description: 'Catches the ball in its pocket, pulls back and fires it at 45°. Flip to fire the other way.',
  flippable: true,
  defaultParams: { power: 9 },
  footprint: () => ({ width: SLING.width, height: SLING.height }),
  build(world, placed, { power = 9 }) {
    const frame = frameOf(placed)
    const body = world.createBody({ type: 'fixed', position: placed.position, angle: placed.angle })
    world.addBox(body, {
      width: SLING.stem.size[0],
      height: SLING.stem.size[1],
      offset: frame.offset(SLING.stem.center),
    })
    const pocket = world.addBox(body, {
      width: SLING.pocket.size[0],
      height: SLING.pocket.size[1],
      offset: frame.offset(SLING.pocket.center),
      sensor: true,
    })
    const [dx, dy] = frame.direction([Math.cos(SLING.launchAngle), Math.sin(SLING.launchAngle)])
    const [cx, cy] = frame.point(SLING.pocket.center)

    let phase: Phase = 'idle'
    let since = 0
    const visual = { pull: 0 }

    return {
      visual,
      holdsBall: () => phase === 'holding',
      beforeStep({ time, ball }) {
        const elapsed = time - since
        if (phase === 'idle' && sensorContains(world.world, pocket, ball)) {
          phase = 'holding'
          since = time
        } else if (phase === 'cooldown' && elapsed >= COOLDOWN) {
          phase = 'idle'
        }
        if (phase !== 'holding') {
          visual.pull = 0
          return
        }
        if (elapsed < SLING_HOLD) {
          visual.pull = (elapsed / SLING_HOLD) * SLING_PULL
          ball.setTranslation({ x: cx - dx * visual.pull, y: cy - dy * visual.pull, z: 0 }, true)
          ball.setLinvel({ x: 0, y: 0, z: 0 }, true)
          ball.setAngvel({ x: 0, y: 0, z: 0 }, true)
          return
        }
        ball.setTranslation({ x: cx, y: cy, z: 0 }, true)
        ball.setLinvel({ x: dx * power, y: dy * power, z: 0 }, true)
        visual.pull = 0
        phase = 'cooldown'
        since = time
      },
    }
  },
}
