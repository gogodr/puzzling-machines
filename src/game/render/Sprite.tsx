import { forwardRef } from 'react'
import type { Mesh } from 'three'
import {
  ATLAS_URL,
  frameAspect,
  frameGeometry,
  spriteMaterial,
  useBitmapTexture,
  type FrameName,
} from './atlas'
import { Z_LAYER } from './layers'

export type SpriteFit = 'stretch' | 'contain' | 'width' | 'height'

export interface SpriteProps {
  frame: FrameName
  /** Box the sprite is fitted into, in world units. */
  size: readonly [number, number]
  center?: readonly [number, number]
  angle?: number
  z?: number
  opacity?: number
  /** Tint multiplied into the texture. */
  color?: string
  /**
   * stretch: fill the box exactly. contain: largest size with the frame's proportions inside the box.
   * width / height: match that side, derive the other from the frame's proportions.
   */
  fit?: SpriteFit
  /** Where the drawing sits inside the box when proportions differ: -1 bottom/left, 0 centre, 1 top/right. */
  align?: readonly [number, number]
}

export function spriteSize(
  frame: FrameName,
  [w, h]: readonly [number, number],
  fit: SpriteFit,
): [number, number] {
  const aspect = frameAspect(frame)
  switch (fit) {
    case 'stretch':
      return [w, h]
    case 'width':
      return [w, w / aspect]
    case 'height':
      return [h * aspect, h]
    case 'contain':
      return w / h > aspect ? [h * aspect, h] : [w, w / aspect]
  }
}

/** One atlas frame on a quad. All sprites share the atlas texture, so a whole scene is a single image. */
export const Sprite = forwardRef<Mesh, SpriteProps>(function Sprite(
  {
    frame,
    size,
    center = [0, 0],
    angle = 0,
    z = Z_LAYER.contraption,
    opacity = 1,
    color,
    fit = 'stretch',
    align = [0, 0],
  },
  ref,
) {
  const texture = useBitmapTexture(ATLAS_URL)
  const [w, h] = spriteSize(frame, size, fit)
  const ox = (align[0] * (size[0] - w)) / 2
  const oy = (align[1] * (size[1] - h)) / 2
  const c = Math.cos(angle)
  const s = Math.sin(angle)
  return (
    <mesh
      ref={ref}
      geometry={frameGeometry(frame)}
      material={spriteMaterial(texture, opacity, color)}
      position={[center[0] + ox * c - oy * s, center[1] + ox * s + oy * c, z]}
      rotation={[0, 0, angle]}
      scale={[w, h, 1]}
      raycast={() => null}
    />
  )
})
