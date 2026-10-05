import type { ReactNode } from 'react'
import type { PlacedContraption } from '@shared/layout'

/** World transform for a contraption; flipping mirrors the local X axis. */
export function ContraptionTransform({
  item,
  children,
}: {
  item: Pick<PlacedContraption, 'position' | 'angle' | 'flipped'>
  children: ReactNode
}) {
  return (
    <group position={[item.position[0], item.position[1], 0]} rotation={[0, 0, item.angle]}>
      <group scale={[item.flipped ? -1 : 1, 1, 1]}>{children}</group>
    </group>
  )
}
