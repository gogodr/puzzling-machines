import { Sprite } from '../../render/Sprite'
import { BodyPose } from '../BodyPose'
import type { ContraptionViewProps } from '../views'
import { SEESAW_PIVOT, SEESAW_PIVOT_Y, SEESAW_PLANK, SEESAW_PLANK_Y } from './definition'

export function SeesawView({ params, live, item }: ContraptionViewProps) {
  const length = params.length ?? 3
  return (
    <group>
      <Sprite
        frame="fulcrum"
        center={[0, SEESAW_PIVOT_Y]}
        size={[SEESAW_PIVOT[0] * 2.2, SEESAW_PIVOT[1] * 1.15]}
        fit="contain"
        align={[0, -1]}
      />
      <BodyPose item={item} live={live} rest={[0, SEESAW_PLANK_Y]}>
        <Sprite frame="seesaw_plank" size={[length, SEESAW_PLANK * 1.4]} z={0.01} />
      </BodyPose>
    </group>
  )
}
