import type { ContraptionType, Layout, PlacedContraption } from '@shared/layout'
import type { RunOutcome, RunResult } from '@shared/run'
import { CONTRAPTIONS, resolveParams } from '../contraptions/registry'
import type { ContraptionInstance, StepContext } from '../contraptions/types'
import { BALL_RADIUS, MAX_BALL_SPEED, TIME_STEP } from '../engine/determinism'
import { MATERIALS } from '../engine/materials'
import { clampSpeed } from '../engine/physics/speedClamp'
import type { Collider, RigidBody, World2D } from '../engine/physics/world2d'
import type { SceneDefinition } from '../scenes/schema'
import { MOTION_THRESHOLD, ScoreTracker, TOUCH_GAP } from '../scoring/ScoreTracker'

/** Seconds the ball centre must stay inside the goal. */
export const GOAL_HOLD_SECONDS = 0.3
/** How far past the scene bounds the ball may go before the run fails. */
export const OUT_OF_BOUNDS_MARGIN = 1

function byId(a: PlacedContraption, b: PlacedContraption) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
}

/**
 * One run of a scene: builds every body and owns the per-step pipeline (PLAN D3). The game calls
 * beforeStep/afterStep from <Physics> callbacks; headless code calls them around world.step(). Both
 * paths therefore run identical code on identically configured worlds.
 */
export class Simulation {
  readonly ball: RigidBody
  readonly score = new ScoreTracker()
  outcome: RunOutcome | null = null
  /** Steps taken, including any after the outcome while the result screen shows. */
  steps = 0
  /** Simulated seconds from start to outcome. */
  runTime = 0
  /** Contraption ids the ball touched in the latest step (sorted). Read-only for presentation. */
  touches: readonly string[] = []
  /** Contraption ids the ball started touching in the latest step, i.e. not touching the step before. */
  newTouches: readonly string[] = []

  private readonly ballCollider: Collider
  private readonly instances: ContraptionInstance[] = []
  private readonly byContraption = new Map<string, ContraptionInstance>()
  private readonly lastContact = new Map<string, number>()
  private readonly types = new Map<string, ContraptionType>()
  private goalTime = 0
  private stillTime = 0

  constructor(
    readonly world: World2D,
    readonly scene: SceneDefinition,
    readonly layout: Layout,
  ) {
    // Creation order is part of determinism: statics, fixed contraptions, placed sorted by id, ball.
    for (const s of scene.statics) {
      const body = world.createBody({ type: 'fixed', position: s.position, angle: s.angle })
      world.addBox(body, { width: s.size[0], height: s.size[1], material: MATERIALS[s.material] })
    }
    for (const placed of [...scene.fixed, ...[...layout].sort(byId)]) {
      world.owner = placed.id
      const instance = CONTRAPTIONS[placed.type].build(world, placed, resolveParams(placed))
      this.instances.push(instance)
      this.byContraption.set(placed.id, instance)
      this.types.set(placed.id, placed.type)
    }
    world.owner = null
    this.ball = world.createBody({ position: scene.start.position, ccd: true, canSleep: false })
    this.ballCollider = world.addBall(this.ball, { radius: BALL_RADIUS })
    const [vx, vy] = scene.start.velocity
    this.ball.setLinvel({ x: vx, y: vy, z: 0 }, true)
  }

  /** Simulated seconds since the run started; keeps counting after the outcome (drives animation). */
  get time() {
    return this.steps * TIME_STEP
  }

  instance(id: string) {
    return this.byContraption.get(id)
  }

  typeOf(id: string) {
    return this.types.get(id)
  }

  /** Contraptions keep working after the outcome so the machine stays coherent on the result screen. */
  beforeStep() {
    const ctx: StepContext = { time: this.time, dt: TIME_STEP, ball: this.ball }
    for (const instance of this.instances) instance.beforeStep?.(ctx)
  }

  afterStep() {
    this.steps++
    this.world.projectJointed()
    clampSpeed(this.ball, MAX_BALL_SPEED)
    if (this.outcome) return

    const v = this.ball.linvel()
    const speed = Math.hypot(v.x, v.y)
    this.score.sample(speed, TIME_STEP)
    this.recordTouches()
    this.runTime = this.time
    this.outcome = this.evaluate(speed)
  }

  /** Contraptions the ball is touching (contacts) or inside (sensors) this step. */
  private touching() {
    const world = this.world.world
    const ids = new Set<string>()
    world.contactPairsWith(this.ballCollider, (other) => {
      const id = this.world.ownerOf(other)
      if (id === null || ids.has(id)) return
      world.contactPair(this.ballCollider, other, (manifold) => {
        if (manifold.numContacts() > 0) ids.add(id)
      })
    })
    world.intersectionPairsWith(this.ballCollider, (other) => {
      const id = this.world.ownerOf(other)
      if (id !== null) ids.add(id)
    })
    return ids
  }

  private recordTouches() {
    // Sorted so bonus accumulation order never depends on Rapier's pair iteration order.
    const touches = [...this.touching()].sort()
    const previous = new Set(this.touches)
    this.newTouches = touches.filter((id) => !previous.has(id))
    this.touches = touches
    for (const id of touches) {
      const last = this.lastContact.get(id)
      if (last === undefined || this.time - last > TOUCH_GAP) this.score.touch(id)
      this.lastContact.set(id, this.time)
    }
  }

  private evaluate(speed: number): RunOutcome | null {
    const { x, y } = this.ball.translation()
    const { bounds, goal, limits } = this.scene
    const m = OUT_OF_BOUNDS_MARGIN
    if (x < bounds.minX - m || x > bounds.maxX + m || y < bounds.minY - m || y > bounds.maxY + m) {
      return { kind: 'fail', reason: 'outOfBounds' }
    }

    const inGoal = x > goal.minX && x < goal.maxX && y > goal.minY && y < goal.maxY
    this.goalTime = inGoal ? this.goalTime + TIME_STEP : 0
    if (this.goalTime >= GOAL_HOLD_SECONDS) return { kind: 'success' }

    const held = this.instances.some((i) => i.holdsBall?.())
    this.stillTime = speed < MOTION_THRESHOLD && !held ? this.stillTime + TIME_STEP : 0
    if (!inGoal && this.stillTime >= limits.stallSeconds) return { kind: 'fail', reason: 'stalled' }

    if (this.runTime >= limits.maxRunTime) return { kind: 'fail', reason: 'timeout' }
    return null
  }

  result(): RunResult {
    const outcome = this.outcome ?? { kind: 'fail', reason: 'timeout' }
    const breakdown = this.score.breakdown(outcome.kind === 'success')
    return {
      sceneId: this.scene.id,
      outcome,
      score: breakdown.total,
      breakdown,
      runTime: this.runTime,
      contraptionsUsed: this.layout.length,
    }
  }
}
