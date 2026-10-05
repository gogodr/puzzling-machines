import { Sprite } from '../../render/Sprite'
import { BodyPose } from '../BodyPose'
import type { ContraptionViewProps } from '../views'
import { CATAPULT } from './definition'

export function CatapultView({ live, item }: ContraptionViewProps) {
  const baseTop = CATAPULT.base.center[1] + CATAPULT.base.size[1] / 2
  return (
    <group>
      <Sprite
        frame="catapult_stand"
        center={[
          CATAPULT.base.center[0],
          (baseTop + CATAPULT.base.center[1] - CATAPULT.base.size[1] / 2) / 2,
        ]}
        size={[0.7, CATAPULT.base.size[1] + 0.12]}
        fit="contain"
        align={[0, -1]}
        z={-0.01}
      />
      <BodyPose item={item} live={live} rest={CATAPULT.pivot}>
        <Sprite
          frame="catapult_arm"
          center={[CATAPULT.plank.center[0], 0.12]}
          size={[CATAPULT.plank.size[0] * 1.04, 0.5]}
          fit="width"
          align={[0, -1]}
        />
      </BodyPose>
    </group>
  )
}
