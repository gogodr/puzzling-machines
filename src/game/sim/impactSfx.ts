import type { GameSfx } from '@shared/bridge/messages'
import type { ContraptionType } from '@shared/layout'

/** Velocity change (m/s in one step) below which a contact is too soft to hear. */
export const IMPACT_MIN = 1.6
/** Velocity change mapped to full intensity. */
export const IMPACT_FULL = 12

const METAL: ReadonlySet<ContraptionType> = new Set(['pipe', 'pipeCurve', 'funnel', 'pendulum', 'elevator'])

/**
 * Which cue a jolt to the ball makes, given the contraption types it touched that step. Contraptions
 * with a signature sound win over a generic impact; touching only scenery is a wooden thud.
 */
export function impactSfx(
  types: readonly ContraptionType[],
  dv: number,
): { name: GameSfx; intensity: number } | null {
  if (dv < IMPACT_MIN) return null
  const intensity = Math.min(1, (dv - IMPACT_MIN) / (IMPACT_FULL - IMPACT_MIN))
  const has = (t: ContraptionType) => types.includes(t)
  if (has('trampoline')) return { name: 'trampoline', intensity }
  if (has('sling') || has('catapult')) return { name: 'launch', intensity }
  if (has('spinner')) return { name: 'spinner', intensity }
  return { name: types.some((t) => METAL.has(t)) ? 'impactMetal' : 'impactWood', intensity }
}
