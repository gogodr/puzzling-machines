import type { ComponentType } from 'react'
import type { ContraptionType, PlacedContraption } from '@shared/layout'
import { CatapultView } from './catapult/CatapultView'
import { ConveyorView } from './conveyor/ConveyorView'
import { DominoesView } from './dominoes/DominoesView'
import { ElevatorView } from './elevator/ElevatorView'
import { FanView } from './fan/FanView'
import { FunnelView } from './funnel/FunnelView'
import { PendulumView } from './pendulum/PendulumView'
import { PipeCurveView, PipeView } from './pipe/PipeView'
import { RampView } from './ramp/RampView'
import { SeesawView } from './seesaw/SeesawView'
import { SlingView } from './sling/SlingView'
import { SpinnerView } from './spinner/SpinnerView'
import { TrampolineView } from './trampoline/TrampolineView'
import type { ContraptionParams } from './types'

export interface ContraptionViewProps {
  /** Resolved params (defaults applied). Drawn in local space; the caller applies the transform. */
  params: ContraptionParams
  /** Animate from the running simulation (e.g. belt marks, moving bodies). */
  live?: boolean
  /** The placed contraption, when there is one (not for tray icons); needed to read live bodies. */
  item?: PlacedContraption
}

export const CONTRAPTION_VIEWS: Record<ContraptionType, ComponentType<ContraptionViewProps>> = {
  ramp: RampView,
  conveyor: ConveyorView,
  trampoline: TrampolineView,
  fan: FanView,
  spinner: SpinnerView,
  seesaw: SeesawView,
  pendulum: PendulumView,
  dominoes: DominoesView,
  funnel: FunnelView,
  pipe: PipeView,
  pipeCurve: PipeCurveView,
  catapult: CatapultView,
  sling: SlingView,
  elevator: ElevatorView,
}
