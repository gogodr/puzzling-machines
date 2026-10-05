import { Box } from '../render/placeholders'
import { Sprite } from '../render/Sprite'
import { segmentBox, WALL_THICKNESS, type Segment } from './walls'

export function WallsView({
  segments,
  color,
  frame,
  overlap = 0,
  thickness = WALL_THICKNESS,
  overdraw = 1,
}: {
  segments: readonly Segment[]
  color?: string
  /** Atlas frame stretched along each segment; falls back to a flat colour. */
  frame?: string
  overlap?: number
  thickness?: number
  /** Draw the sprite this much thicker than the collider so outlines stay visible. */
  overdraw?: number
}) {
  return (
    <group>
      {segments.map((segment, i) => {
        const { center, length, angle } = segmentBox(segment, overlap)
        return frame ? (
          <Sprite key={i} frame={frame} center={center} size={[length, thickness * overdraw]} angle={angle} />
        ) : (
          <Box key={i} center={center} size={[length, thickness]} angle={angle} color={color ?? '#888'} />
        )
      })}
    </group>
  )
}
