import { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import type { Mesh } from 'three'
import { spriteMaterial, useBitmapTexture } from './atlas'
import { Z_LAYER } from './layers'

const PARALLAX = 0.85
const OVERSCAN = 1.15

/**
 * Painted scene background, cover-fitted to whatever the camera sees. It trails the camera at a
 * slightly lower speed when camera-follow is on, which reads as depth.
 */
export function Backdrop({ url, center }: { url: string; center: readonly [number, number] }) {
  const texture = useBitmapTexture(url)
  const mesh = useRef<Mesh>(null)
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const image = texture.image as ImageBitmap
  const aspect = image.width / image.height

  useFrame(() => {
    const m = mesh.current
    if (!m) return
    const viewW = (size.width / camera.zoom) * OVERSCAN
    const viewH = (size.height / camera.zoom) * OVERSCAN
    const [w, h] = viewW / viewH > aspect ? [viewW, viewW / aspect] : [viewH * aspect, viewH]
    m.scale.set(w, h, 1)
    m.position.set(
      center[0] + (camera.position.x - center[0]) * PARALLAX,
      center[1] + (camera.position.y - center[1]) * PARALLAX,
      Z_LAYER.backdrop,
    )
  })

  return (
    <mesh ref={mesh} material={spriteMaterial(texture)} raycast={() => null}>
      <planeGeometry args={[1, 1]} />
    </mesh>
  )
}
