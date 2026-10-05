import type { ContraptionType, PlacedContraption } from '@shared/layout'
import { catapult } from './catapult/definition'
import { conveyor } from './conveyor/definition'
import { dominoes } from './dominoes/definition'
import { elevator } from './elevator/definition'
import { fan } from './fan/definition'
import { funnel } from './funnel/definition'
import { pendulum } from './pendulum/definition'
import { pipe, pipeCurve } from './pipe/definition'
import { ramp } from './ramp/definition'
import { seesaw } from './seesaw/definition'
import { sling } from './sling/definition'
import { spinner } from './spinner/definition'
import { trampoline } from './trampoline/definition'
import type { ContraptionDefinition, ContraptionParams, Footprint } from './types'

export const CONTRAPTIONS: Record<ContraptionType, ContraptionDefinition> = {
  ramp,
  conveyor,
  trampoline,
  fan,
  spinner,
  seesaw,
  pendulum,
  dominoes,
  funnel,
  pipe,
  pipeCurve,
  catapult,
  sling,
  elevator,
}

export function resolveParams(placed: Pick<PlacedContraption, 'type' | 'params'>): ContraptionParams {
  return { ...CONTRAPTIONS[placed.type].defaultParams, ...placed.params }
}

export function footprintOf(placed: Pick<PlacedContraption, 'type' | 'params'>): Footprint {
  return CONTRAPTIONS[placed.type].footprint(resolveParams(placed))
}
