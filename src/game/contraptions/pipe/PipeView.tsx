import { PALETTE } from '../../render/palette'
import { Z_LAYER } from '../../render/layers'
import { Sprite } from '../../render/Sprite'
import type { ContraptionViewProps } from '../views'
import { WallsView } from '../WallsView'
import { WALL_THICKNESS } from '../walls'
import { PIPE_BORE, PIPE_HEIGHT, pipeCurveGeometry } from './definition'

/** The tube is drawn see-through so the ball stays visible inside it. */
export function PipeView({ params }: ContraptionViewProps) {
  const length = params.length ?? 3
  return <Sprite frame="pipe" size={[length, PIPE_HEIGHT * 1.1]} opacity={0.82} />
}

export function PipeCurveView({ params }: ContraptionViewProps) {
  const radius = params.radius ?? 1.3
  const { center, segments } = pipeCurveGeometry(params)
  return (
    <group>
      <mesh position={[center[0], center[1], Z_LAYER.contraption - 0.01]} raycast={() => null}>
        <ringGeometry args={[radius - PIPE_BORE / 2, radius + PIPE_BORE / 2, 32, 1, Math.PI, Math.PI / 2]} />
        <meshBasicMaterial color={PALETTE.pipeInner} transparent opacity={0.7} />
      </mesh>
      <WallsView
        segments={segments}
        frame="steel_bar"
        color={PALETTE.pipe}
        overlap={WALL_THICKNESS}
        overdraw={1.4}
      />
    </group>
  )
}
