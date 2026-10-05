import { Sprite } from '../../render/Sprite'
import { BodyPose } from '../BodyPose'
import type { ContraptionViewProps } from '../views'
import { DOMINO, dominoOffsets } from './definition'

export function DominoesView({ params, live, item }: ContraptionViewProps) {
  return (
    <group>
      {dominoOffsets(params).map((x, i) => (
        <BodyPose key={i} item={item} live={live} index={i} rest={[x, 0]}>
          <Sprite frame="domino" size={[DOMINO[0] * 1.6, DOMINO[1] * 1.04]} />
        </BodyPose>
      ))}
    </group>
  )
}
