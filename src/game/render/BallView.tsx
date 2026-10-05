import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { BALL_RADIUS } from '../engine/determinism'
import { useGameStore } from '../state/context'
import { Z_LAYER } from './layers'
import { Sprite } from './Sprite'

const SQUASH_IMPACT = 2.5
const SQUASH_MAX = 0.28
const SQUASH_RECOVER = 9

/**
 * Bodies are created imperatively, so nothing syncs meshes for us; read the pose every frame. No
 * interpolation: at 120 Hz physics and 60 Hz display every frame advances exactly two steps.
 *
 * Squash/stretch is purely visual: the outer group aligns with the impact direction and scales,
 * the inner group carries the ball's own spin.
 */
export function BallView() {
  const store = useGameStore()
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const squash = useRef({ amount: 0, axis: 0, vx: 0, vy: 0 })

  useFrame((_, dt) => {
    const o = outer.current
    const i = inner.current
    const { simulation, scene, settings } = store.getState()
    if (!o || !i || !scene) return
    const s = squash.current
    if (!simulation) {
      o.position.set(scene.start.position[0], scene.start.position[1], 0)
      o.rotation.z = 0
      o.scale.set(1, 1, 1)
      i.rotation.z = 0
      s.amount = 0
      return
    }
    const t = simulation.ball.translation()
    const r = simulation.ball.rotation()
    const v = simulation.ball.linvel()
    const dvx = v.x - s.vx
    const dvy = v.y - s.vy
    const dv = Math.hypot(dvx, dvy)
    s.vx = v.x
    s.vy = v.y
    if (!settings.reducedMotion && dv > SQUASH_IMPACT) {
      s.amount = Math.min(SQUASH_MAX, Math.max(s.amount, dv * 0.03))
      s.axis = Math.atan2(dvy, dvx)
    }
    s.amount = Math.max(0, s.amount - s.amount * Math.min(1, dt * SQUASH_RECOVER) - dt * 0.05)
    const spin = 2 * Math.atan2(r.z, r.w)
    o.position.set(t.x, t.y, 0)
    o.rotation.z = s.axis
    o.scale.set(1 - s.amount, 1 + s.amount * 0.6, 1)
    i.rotation.z = spin - s.axis
  })

  return (
    <group ref={outer}>
      <group ref={inner}>
        <Sprite frame="ball" size={[BALL_RADIUS * 2.08, BALL_RADIUS * 2.08]} z={Z_LAYER.ball} fit="contain" />
      </group>
    </group>
  )
}
