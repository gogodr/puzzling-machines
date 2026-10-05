import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { PALETTE } from '../../render/palette'
import { Box } from '../../render/placeholders'
import { Sprite } from '../../render/Sprite'
import { useGameStore } from '../../state/context'
import type { ContraptionViewProps } from '../views'
import { FAN_HOUSING, FAN_STREAM } from './definition'

const STREAKS = 3
const STREAK_SPEED = 2.5

export function FanView({ params, live = false }: ContraptionViewProps) {
  const range = params.range ?? 3
  const store = useGameStore()
  const blur = useRef<Group>(null)
  const streaks = useRef<Group>(null)
  const face = FAN_HOUSING[0] / 2

  useFrame(() => {
    const time = live ? (store.getState().simulation?.time ?? 0) : 0
    if (blur.current) {
      blur.current.visible = live
      blur.current.scale.y = 0.75 + 0.25 * Math.cos(time * 40)
    }
    streaks.current?.children.forEach((streak, i) => {
      const t = (time * STREAK_SPEED + (i * range) / STREAKS) % range
      streak.position.x = face + t
      streak.visible = live
    })
  })

  return (
    <group>
      <Sprite frame="fan" size={[0.95, FAN_HOUSING[1] * 1.15]} center={[-0.05, 0]} fit="contain" />
      <group ref={blur} position={[face - 0.02, 0.12, 0.03]}>
        <Box center={[0, 0]} size={[0.08, FAN_HOUSING[1] * 0.6]} color={PALETTE.air} opacity={0.6} />
      </group>
      {/* The air stream: faint so it reads as a zone, not a solid. */}
      <Box center={[face + range / 2, 0]} size={[range, FAN_STREAM]} color={PALETTE.air} opacity={0.22} />
      <group ref={streaks}>
        {Array.from({ length: STREAKS }, (_, i) => (
          <group key={i} position={[0, (i - 1) * 0.25, 0]}>
            <Box center={[0, 0]} size={[0.4, 0.04]} color={PALETTE.air} z={0.06} />
          </group>
        ))}
      </group>
    </group>
  )
}
