import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import { useGame, useGameStore } from '../state/context'
import { ATLAS_URL, frameGeometry, spriteMaterial, useBitmapTexture } from './atlas'
import { Z_LAYER } from './layers'
import { spriteSize } from './Sprite'

const CONFETTI = 36
const CONFETTI_COLORS = ['#e63946', '#ffb703', '#52b788', '#4361ee', '#9d4edd', '#f4a261']
const CONFETTI_LIFE = 1.8
const PUFF_LIFE = 0.7

/** Stable pseudo-random in [0, 1) so the burst looks scattered without impure renders. */
function hash(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453
  return x - Math.floor(x)
}

const PARTICLES = Array.from({ length: CONFETTI }, (_, i) => ({
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  vx: (hash(i, 1) - 0.5) * 7,
  vy: 4 + hash(i, 2) * 5,
  spin: (hash(i, 3) - 0.5) * 18,
  w: 0.1 + hash(i, 4) * 0.08,
}))

function Confetti({ origin }: { origin: readonly [number, number] }) {
  const group = useRef<Group>(null)
  const age = useRef(0)

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    age.current = Math.min(CONFETTI_LIFE, age.current + dt)
    const t = age.current
    g.visible = t < CONFETTI_LIFE
    g.children.forEach((child, i) => {
      const p = PARTICLES[i]
      if (!p) return
      child.position.set(origin[0] + p.vx * t, origin[1] + p.vy * t - 6 * t * t, Z_LAYER.fx)
      child.rotation.z = p.spin * t
      const m = (child as Mesh).material as { opacity: number }
      m.opacity = 1 - t / CONFETTI_LIFE
    })
  })

  return (
    <group ref={group}>
      {PARTICLES.map((p, i) => (
        <mesh key={i} raycast={() => null}>
          <planeGeometry args={[p.w, p.w * 0.55]} />
          <meshBasicMaterial color={p.color} transparent />
        </mesh>
      ))}
    </group>
  )
}

function Puff({ origin }: { origin: readonly [number, number] }) {
  const mesh = useRef<Mesh>(null)
  const age = useRef(0)
  const texture = useBitmapTexture(ATLAS_URL)
  const material = useMemo(() => spriteMaterial(texture).clone(), [texture])
  const [w, h] = spriteSize('puff', [1, 1], 'contain')

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    age.current = Math.min(PUFF_LIFE, age.current + dt)
    const k = age.current / PUFF_LIFE
    m.visible = k < 1
    const s = 0.5 + k * 1.3
    m.scale.set(w * s, h * s, 1)
    material.opacity = 1 - k
  })

  return (
    <mesh
      ref={mesh}
      geometry={frameGeometry('puff')}
      material={material}
      position={[origin[0], origin[1], Z_LAYER.fx]}
      raycast={() => null}
    />
  )
}

/** Goal celebration and fail puff, keyed on the run so each result plays once. */
export function OutcomeFx() {
  const store = useGameStore()
  const result = useGame((s) => s.result)
  const runId = useGame((s) => s.runId)
  const reduced = useGame((s) => s.settings.reducedMotion)
  if (!result || reduced) return null
  const { scene, simulation } = store.getState()
  if (!scene) return null
  if (result.outcome.kind === 'success') {
    const { goal } = scene
    return <Confetti key={runId} origin={[(goal.minX + goal.maxX) / 2, goal.minY + 0.3]} />
  }
  if (!simulation) return null
  const t = simulation.ball.translation()
  return <Puff key={runId} origin={[t.x, t.y]} />
}
