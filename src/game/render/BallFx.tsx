import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import type { Vec2 } from '@shared/math'
import { useGame, useGameStore } from '../state/context'
import { Z_LAYER } from './layers'
import { PALETTE } from './palette'
import { Sprite } from './Sprite'

const TRAIL_MAX = 56
const TRAIL_SPACING = 0.1
const SPARK_SPEED = 3.2
const IMPACT = 3.4

interface Spark {
  x: number
  y: number
  vx: number
  vy: number
  life: number
}

const EMPTY: [number, number, number][] = [[0, 0, 0]]

/** Fading trail and contact sparks. Skipped when reduced motion is on. */
export function BallFx() {
  const store = useGameStore()
  const reduced = useGame((s) => s.settings.reducedMotion)
  const trail = useRef<Vec2[]>([])
  const sparks = useRef<Spark[]>([])
  const prevV = useRef<Vec2>([0, 0])
  const [points, setPoints] = useState<[number, number, number][]>(EMPTY)
  const [sparkViews, setSparkViews] = useState<Array<{ x: number; y: number; o: number }>>([])
  const publish = useRef(0)

  useFrame((_, dt) => {
    if (reduced) {
      if (trail.current.length || sparks.current.length) {
        trail.current = []
        sparks.current = []
        setPoints(EMPTY)
        setSparkViews([])
      }
      return
    }
    const { simulation, mode } = store.getState()
    if (!simulation || mode === 'build') {
      if (trail.current.length || sparks.current.length) {
        trail.current = []
        sparks.current = []
        setPoints(EMPTY)
        setSparkViews([])
        prevV.current = [0, 0]
      }
      return
    }
    const t = simulation.ball.translation()
    const v = simulation.ball.linvel()
    const last = trail.current.at(-1)
    if (!last || Math.hypot(t.x - last[0], t.y - last[1]) >= TRAIL_SPACING) {
      trail.current.push([t.x, t.y])
      if (trail.current.length > TRAIL_MAX) trail.current.shift()
    }
    const dv = Math.hypot(v.x - prevV.current[0], v.y - prevV.current[1])
    if (dv > IMPACT) {
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + dv
        sparks.current.push({
          x: t.x,
          y: t.y,
          vx: Math.cos(a) * SPARK_SPEED,
          vy: Math.sin(a) * SPARK_SPEED,
          life: 0.28,
        })
      }
    }
    prevV.current = [v.x, v.y]
    sparks.current = sparks.current.filter((s) => {
      s.life -= dt
      s.x += s.vx * dt
      s.y += s.vy * dt
      s.vy -= 12 * dt
      return s.life > 0
    })
    publish.current += dt
    if (publish.current >= 0.05) {
      publish.current = 0
      setPoints(
        trail.current.length >= 2
          ? trail.current.map(([x, y]) => [x, y, Z_LAYER.fx] as [number, number, number])
          : EMPTY,
      )
      setSparkViews(sparks.current.map((s) => ({ x: s.x, y: s.y, o: Math.max(0, s.life / 0.28) })))
    }
  })

  if (reduced) return null
  return (
    <group>
      {points.length >= 2 && (
        <Line points={points} color={PALETTE.ball} lineWidth={2} transparent opacity={0.4} />
      )}
      {sparkViews.map((s, i) => (
        <Sprite
          key={i}
          frame="spark"
          size={[0.3 * s.o + 0.08, 0.3 * s.o + 0.08]}
          center={[s.x, s.y]}
          fit="contain"
          z={Z_LAYER.fx}
          opacity={Math.round(s.o * 4) / 4}
        />
      ))}
    </group>
  )
}
