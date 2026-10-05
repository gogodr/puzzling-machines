import { Z_LAYER } from './layers'

/** Flat placeholder geometry used until the art pass (Phase 4). */

export function BoxMesh({
  width,
  height,
  color,
  z = Z_LAYER.contraption,
  opacity = 1,
}: {
  width: number
  height: number
  color: string
  z?: number
  opacity?: number
}) {
  return (
    <mesh position={[0, 0, z]} raycast={() => null}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

/** A rectangle centred at `center`, rotated by `angle` radians. */
export function Box({
  center,
  size,
  angle = 0,
  color,
  z = Z_LAYER.contraption,
  opacity = 1,
}: {
  center: readonly [number, number]
  size: readonly [number, number]
  angle?: number
  color: string
  z?: number
  opacity?: number
}) {
  return (
    <mesh position={[center[0], center[1], z]} rotation={[0, 0, angle]} raycast={() => null}>
      <planeGeometry args={[size[0], size[1]]} />
      <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </mesh>
  )
}

export function Disc({
  center = [0, 0],
  radius,
  color,
  z = Z_LAYER.contraption,
  segments = 32,
}: {
  center?: readonly [number, number]
  radius: number
  color: string
  z?: number
  segments?: number
}) {
  return (
    <mesh position={[center[0], center[1], z]} raycast={() => null}>
      <circleGeometry args={[radius, segments]} />
      <meshBasicMaterial color={color} />
    </mesh>
  )
}

/** A disc with a stripe so rolling is visible. */
export function BallMesh({ radius, color }: { radius: number; color: string }) {
  return (
    <group position={[0, 0, Z_LAYER.ball]}>
      <mesh raycast={() => null}>
        <circleGeometry args={[radius, 32]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, 0, 0.01]} raycast={() => null}>
        <planeGeometry args={[radius * 1.6, radius * 0.25]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    </group>
  )
}
