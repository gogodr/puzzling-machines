import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { BALL_RADIUS } from '../../engine/determinism'
import { Sprite } from '../../render/Sprite'
import { useGameStore } from '../../state/context'
import { frameOf } from '../frame'
import type { ContraptionViewProps } from '../views'
import { TRAMPOLINE_THICKNESS } from './definition'

const SQUASH_TIME = 0.12
const DRAW_HEIGHT = 0.45

/**
 * The pad top lines up with the collider top; the frame and springs hang below it. Swaps to the
 * squashed frame briefly whenever the ball is on the pad (view-side check, physics untouched).
 */
export function TrampolineView({ params, live, item }: ContraptionViewProps) {
  const width = params.width ?? 1.5
  const store = useGameStore()
  const [squashed, setSquashed] = useState(false)
  const since = useRef(-1)

  useFrame(() => {
    const sim = live && item ? store.getState().simulation : null
    let on = false
    if (sim) {
      const t = sim.ball.translation()
      const local = frameOf(item!).toLocal([t.x, t.y], 0).point
      on =
        Math.abs(local[0]) < width / 2 + 0.05 &&
        local[1] > 0 &&
        local[1] < TRAMPOLINE_THICKNESS / 2 + BALL_RADIUS + 0.06
      if (on) since.current = sim.time
      on = since.current >= 0 && sim.time - since.current < SQUASH_TIME
    }
    if (on !== squashed) setSquashed(on)
  })

  const top = TRAMPOLINE_THICKNESS / 2
  return (
    <Sprite
      frame={squashed ? 'trampoline_squash' : 'trampoline'}
      size={[width * 1.08, DRAW_HEIGHT]}
      center={[0, top - DRAW_HEIGHT / 2 + 0.04]}
    />
  )
}
