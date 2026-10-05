import type { ContraptionViewProps } from '../views'
import { WallsView } from '../WallsView'
import { funnelSegments } from './definition'

export function FunnelView({ params }: ContraptionViewProps) {
  return <WallsView segments={funnelSegments(params)} frame="steel_bar" overdraw={1.8} overlap={0.06} />
}
