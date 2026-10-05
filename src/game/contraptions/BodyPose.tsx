import { useRef, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Vec2 } from '@shared/math'
import { useGameStore } from '../state/context'
import { frameOf } from './frame'
import type { ContraptionViewProps } from './views'

/**
 * Places children at a contraption body's pose, in the contraption's local frame (the parent
 * ContraptionTransform supplies the world transform). Falls back to `rest` outside a run.
 */
export function BodyPose({
  item,
  live,
  index = 0,
  rest,
  restAngle = 0,
  children,
}: Pick<ContraptionViewProps, 'item' | 'live'> & {
  index?: number
  rest: Vec2
  restAngle?: number
  children: ReactNode
}) {
  const store = useGameStore()
  const ref = useRef<Group>(null)

  useFrame(() => {
    const group = ref.current
    if (!group) return
    const body = live && item ? store.getState().simulation?.instance(item.id)?.bodies?.[index] : undefined
    if (!body || !item) {
      group.position.set(rest[0], rest[1], 0)
      group.rotation.z = restAngle
      return
    }
    const t = body.translation()
    const r = body.rotation()
    const local = frameOf(item).toLocal([t.x, t.y], 2 * Math.atan2(r.z, r.w))
    group.position.set(local.point[0], local.point[1], 0)
    group.rotation.z = local.angle
  })

  return (
    <group ref={ref} position={[rest[0], rest[1], 0]} rotation={[0, 0, restAngle]}>
      {children}
    </group>
  )
}

/** A display value from a running contraption instance (e.g. sling pull); 0 outside a run. */
export function useVisual(item: ContraptionViewProps['item'], live: boolean | undefined) {
  const store = useGameStore()
  return (key: string) =>
    (live && item ? store.getState().simulation?.instance(item.id)?.visual?.[key] : undefined) ?? 0
}
