import type { ContraptionType, PlacedContraption } from '@shared/layout'
import type { RigidBody, World2D } from '../engine/physics/world2d'

export type ContraptionParams = Record<string, number>

export interface Footprint {
  width: number
  height: number
}

export interface StepContext {
  /** Simulated seconds since the run started. */
  time: number
  dt: number
  ball: RigidBody
}

export interface ContraptionInstance {
  /** Runs before every physics step, in creation order. */
  beforeStep?(ctx: StepContext): void
  /** True while the contraption deliberately holds the ball still (pauses stall detection). */
  holdsBall?(): boolean
  /** Bodies that move during a run, in a fixed order; views read their poses by index. */
  bodies?: readonly RigidBody[]
  /** Read-only display values for views (e.g. sling stretch); never read by physics. */
  visual?: Readonly<Record<string, number>>
}

/**
 * A contraption plugin (PLAN D4): pure data and physics, no React. Views live in `views.tsx` so this
 * module runs headless in tests and in a worker.
 */
export interface ContraptionDefinition {
  type: ContraptionType
  name: string
  description: string
  /** Whether flipping mirrors behaviour (e.g. reverses a conveyor). */
  flippable: boolean
  defaultParams: ContraptionParams
  /** Axis-aligned size in local space, centred on the contraption position. Used for placement. */
  footprint(params: ContraptionParams): Footprint
  /** Creates the contraption's bodies. `params` already has defaults applied. */
  build(world: World2D, placed: PlacedContraption, params: ContraptionParams): ContraptionInstance
}
