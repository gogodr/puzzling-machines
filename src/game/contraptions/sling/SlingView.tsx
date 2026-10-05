import { useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sprite } from '../../render/Sprite'
import { useVisual } from '../BodyPose'
import type { ContraptionViewProps } from '../views'
import { SLING } from './definition'

/** Rest and stretched drawings from the atlas; the pulled frame shows while the band is drawn back. */
export function SlingView({ live, item }: ContraptionViewProps) {
  const pullOf = useVisual(item, live)
  const [pulled, setPulled] = useState(false)

  useFrame(() => {
    const next = pullOf('pull') > 0.02
    if (next !== pulled) setPulled(next)
  })

  return (
    <Sprite
      frame={pulled ? 'sling_pulled' : 'sling'}
      size={[SLING.width * 1.1, SLING.height * 1.05]}
      fit="contain"
      align={[pulled ? -1 : 0, -1]}
    />
  )
}
