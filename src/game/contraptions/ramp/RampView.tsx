import { Sprite } from '../../render/Sprite'
import type { ContraptionViewProps } from '../views'
import { RAMP_THICKNESS } from './definition'

export function RampView({ params }: ContraptionViewProps) {
  return <Sprite frame="plank" size={[params.length ?? 3, RAMP_THICKNESS * 1.3]} />
}
