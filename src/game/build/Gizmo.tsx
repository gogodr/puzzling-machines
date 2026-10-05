import type { ReactNode } from 'react'
import type { ThreeEvent } from '@react-three/fiber'
import { CONTRAPTIONS } from '../contraptions/registry'
import { Z_LAYER } from '../render/layers'
import { PALETTE } from '../render/palette'
import { BoxMesh } from '../render/placeholders'
import { useGame, useGameStore } from '../state/context'
import { obbCorners } from './geometry'
import { contraptionObb } from './placement'

const RADIUS = 0.3
const SPACING = 0.75
const OFFSET = 0.6
const ICON = '#ffffff'

function GizmoButton({
  x,
  color,
  onPress,
  children,
}: {
  x: number
  color: string
  onPress: () => void
  children: ReactNode
}) {
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    onPress()
  }
  return (
    <group position={[x, 0, 0]}>
      <mesh onPointerDown={onPointerDown}>
        <circleGeometry args={[RADIUS, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <group position={[0, 0, 0.01]}>{children}</group>
    </group>
  )
}

function RotateIcon({ direction }: { direction: 1 | -1 }) {
  return (
    <group scale={[direction, 1, 1]}>
      <mesh raycast={() => null}>
        <ringGeometry args={[0.1, 0.15, 24, 1, Math.PI * 0.3, Math.PI * 1.5]} />
        <meshBasicMaterial color={ICON} />
      </mesh>
      <mesh position={[0.11, 0.1, 0]} rotation={[0, 0, Math.PI / 2]} raycast={() => null}>
        <circleGeometry args={[0.08, 3]} />
        <meshBasicMaterial color={ICON} />
      </mesh>
    </group>
  )
}

function FlipIcon() {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.08, 0, 0]}
          rotation={[0, 0, side > 0 ? 0 : Math.PI]}
          raycast={() => null}
        >
          <circleGeometry args={[0.1, 3]} />
          <meshBasicMaterial color={ICON} />
        </mesh>
      ))}
    </group>
  )
}

function DeleteIcon() {
  return (
    <group>
      {[Math.PI / 4, -Math.PI / 4].map((angle) => (
        <group key={angle} rotation={[0, 0, angle]}>
          <BoxMesh width={0.3} height={0.06} color={ICON} />
        </group>
      ))}
    </group>
  )
}

/** Rotate / flip / delete buttons above the selected contraption. */
export function Gizmo() {
  const store = useGameStore()
  const item = useGame((s) =>
    s.mode === 'build' && !s.drag ? s.layout.find((p) => p.id === s.selectedId) : undefined,
  )
  const maxY = useGame((s) => s.scene?.bounds.maxY ?? 0)
  if (!item) return null

  const top = Math.max(...obbCorners(contraptionObb(item)).map(([, y]) => y))
  const y = Math.min(top + OFFSET, maxY - RADIUS)
  const flippable = CONTRAPTIONS[item.type].flippable
  const buttons = [
    {
      key: 'ccw',
      color: PALETTE.selection,
      onPress: () => store.getState().rotate(1),
      icon: <RotateIcon direction={1} />,
    },
    {
      key: 'cw',
      color: PALETTE.selection,
      onPress: () => store.getState().rotate(-1),
      icon: <RotateIcon direction={-1} />,
    },
    ...(flippable
      ? [
          {
            key: 'flip',
            color: PALETTE.selection,
            onPress: () => store.getState().flip(),
            icon: <FlipIcon />,
          },
        ]
      : []),
    {
      key: 'delete',
      color: PALETTE.invalid,
      onPress: () => store.getState().deleteSelected(),
      icon: <DeleteIcon />,
    },
  ]
  const start = -((buttons.length - 1) * SPACING) / 2

  return (
    <group position={[item.position[0], y, Z_LAYER.hud]}>
      {buttons.map((b, i) => (
        <GizmoButton key={b.key} x={start + i * SPACING} color={b.color} onPress={b.onPress}>
          {b.icon}
        </GizmoButton>
      ))}
    </group>
  )
}
