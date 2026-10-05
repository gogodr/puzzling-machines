import { Plane, Vector3 } from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import type { Vec2 } from '@shared/math'

const PHYSICS_PLANE = new Plane(new Vector3(0, 0, 1), 0)
const hit = new Vector3()

/** Pointer position on the physics plane (z = 0), regardless of which mesh was hit. */
export function pointerWorld(e: ThreeEvent<PointerEvent>): Vec2 | null {
  return e.ray.intersectPlane(PHYSICS_PLANE, hit) ? [hit.x, hit.y] : null
}

/** Keeps pointer events flowing to the grabbed object while dragging, even off-canvas. */
export function capturePointer(e: ThreeEvent<PointerEvent>) {
  ;(e.target as unknown as { setPointerCapture(id: number): void }).setPointerCapture(e.pointerId)
}
