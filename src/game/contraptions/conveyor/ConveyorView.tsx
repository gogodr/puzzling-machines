import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import { BoxMesh } from '../../render/placeholders'
import { PALETTE } from '../../render/palette'
import { Sprite } from '../../render/Sprite'
import { useGameStore } from '../../state/context'
import type { ContraptionViewProps } from '../views'
import { CONVEYOR_THICKNESS } from './definition'

const MARK_SPACING = 0.45
const ROLLER = CONVEYOR_THICKNESS

/** Belt sprite with tread marks sliding along the top at belt speed. */
export function ConveyorView({ params, live = false }: ContraptionViewProps) {
  const length = params.length ?? 3
  const speed = params.speed ?? 2
  const store = useGameStore()
  const marks = useRef<Group>(null)
  const span = length - 2 * ROLLER
  const count = Math.max(1, Math.floor(span / MARK_SPACING))

  useFrame(() => {
    if (!marks.current) return
    const time = live ? (store.getState().simulation?.time ?? 0) : 0
    const offset = (((speed * time) % MARK_SPACING) + MARK_SPACING) % MARK_SPACING
    marks.current.children.forEach((mark, i) => {
      mark.position.x = -span / 2 + ((i * MARK_SPACING + offset) % (count * MARK_SPACING))
    })
  })

  return (
    <group>
      <Sprite frame="belt" size={[length, CONVEYOR_THICKNESS * 1.25]} />
      <group ref={marks} position={[0, CONVEYOR_THICKNESS / 2 - 0.06, 0.02]}>
        {Array.from({ length: count }, (_, i) => (
          <group key={i}>
            <BoxMesh width={0.14} height={0.04} color={PALETTE.beltMark} opacity={0.8} />
          </group>
        ))}
      </group>
      {/* Direction arrow; the wrapper mirrors it when flipped. */}
      <mesh position={[0, -0.02, 0.03]} rotation={[0, 0, -Math.PI / 2]} raycast={() => null}>
        <circleGeometry args={[0.09, 3]} />
        <meshBasicMaterial color={PALETTE.accent} />
      </mesh>
    </group>
  )
}
