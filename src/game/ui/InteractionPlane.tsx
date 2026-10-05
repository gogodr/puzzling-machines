import type { ThreeEvent } from '@react-three/fiber'
import { useGameStore } from '../state/context'
import { pointerWorld } from './pointer'

const SIZE = 1000
const Z = -10

/**
 * Invisible plane behind everything. It receives every pointer move/up (nothing in front stops those),
 * so drags work no matter which mesh was grabbed, and a press on empty space clears the selection.
 */
export function InteractionPlane() {
  const store = useGameStore()

  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!store.getState().drag) return
    const point = pointerWorld(e)
    if (point) store.getState().moveDrag(point)
  }

  return (
    <mesh
      position={[0, 0, Z]}
      onPointerDown={() => store.getState().select(null)}
      onPointerMove={onPointerMove}
      onPointerUp={() => store.getState().endDrag()}
      onPointerCancel={() => store.getState().cancelDrag()}
    >
      <planeGeometry args={[SIZE, SIZE]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
