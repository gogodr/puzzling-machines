import { useLayoutEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGame, useGameStore } from '../state/context'
import { computeOrthoFraming, type Bounds2D } from './framing'

const FOLLOW_WEIGHT = 0.28
const FOLLOW_DAMP = 4

export function FitCamera({ bounds, padding = 0 }: { bounds: Bounds2D; padding?: number }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const store = useGameStore()
  const follow = useGame((s) => s.settings.cameraFollow)
  const reduced = useGame((s) => s.settings.reducedMotion)
  const framing = useMemo(() => computeOrthoFraming(bounds, size, padding), [bounds, size, padding])

  useLayoutEffect(() => {
    camera.zoom = framing.zoom
    camera.position.set(framing.center[0], framing.center[1], camera.position.z)
    camera.updateProjectionMatrix()
  }, [camera, framing])

  useFrame((_, dt) => {
    const restX = framing.center[0]
    const restY = framing.center[1]
    if (!follow || reduced) {
      camera.position.x = restX
      camera.position.y = restY
      return
    }
    const { simulation, mode } = store.getState()
    let targetX = restX
    let targetY = restY
    if (simulation && mode !== 'build') {
      const t = simulation.ball.translation()
      targetX = restX + (t.x - restX) * FOLLOW_WEIGHT
      targetY = restY + (t.y - restY) * FOLLOW_WEIGHT
    }
    const k = Math.min(1, dt * FOLLOW_DAMP)
    camera.position.x += (targetX - camera.position.x) * k
    camera.position.y += (targetY - camera.position.y) * k
  })

  return null
}
