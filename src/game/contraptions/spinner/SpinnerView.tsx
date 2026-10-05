import { Sprite } from '../../render/Sprite'
import { BodyPose } from '../BodyPose'
import type { ContraptionViewProps } from '../views'

export function SpinnerView({ params, live, item }: ContraptionViewProps) {
  const radius = params.radius ?? 0.9
  // The drawing's paddles sit on the diagonals; rotate so they line up with the collider blades.
  return (
    <BodyPose item={item} live={live} rest={[0, 0]}>
      <Sprite frame="spinner" size={[radius * 2.3, radius * 2.3]} angle={Math.PI / 4} fit="contain" />
    </BodyPose>
  )
}
