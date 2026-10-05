import { footprintOf } from '../contraptions/registry'
import { BoxMesh } from '../render/placeholders'
import { PALETTE } from '../render/palette'
import { useGame } from '../state/context'
import { ContraptionTransform } from './ContraptionTransform'

/** Translucent first piece of the reference solution, shown after three failed runs. */
export function HintGhost() {
  const hint = useGame((s) => s.hint)
  const building = useGame((s) => s.mode === 'build')
  if (!hint || !building) return null
  const { width, height } = footprintOf(hint)
  return (
    <ContraptionTransform item={hint}>
      <BoxMesh width={width} height={height} color={PALETTE.accent} opacity={0.35} />
    </ContraptionTransform>
  )
}
