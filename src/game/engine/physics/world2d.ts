import RAPIER from '@dimforge/rapier3d-compat'
import { quatFromAngle, type Vec2 } from '@shared/math'
import { COLLIDER_DEPTH, GRAVITY, SOLVER, TIME_STEP } from '../determinism'
import { MATERIALS, type MaterialPreset } from '../materials'
import {
  PLANAR_JOINT_AXIS,
  PLANAR_TRANSLATIONS,
  planarRotations,
  projectToPlane,
  type BodyType2D,
} from './planar'

/**
 * The only way to create physics bodies (PLAN D1). Wraps a Rapier world — the one owned by <Physics>
 * in the game, or a fresh one in tests — and builds bodies locked to the XY plane.
 */

export type Rapier = typeof RAPIER
export type { RigidBody, Collider, World } from '@dimforge/rapier3d-compat'

let rapierReady: Promise<Rapier> | null = null

/** Only needed outside <Physics>, which initialises Rapier itself. */
export function loadRapier(): Promise<Rapier> {
  rapierReady ??= RAPIER.init().then(() => RAPIER)
  return rapierReady
}

export interface BodySpec2D {
  type?: BodyType2D
  position: Vec2
  angle?: number
  ccd?: boolean
  canSleep?: boolean
  /** Set for bodies attached by a joint; see planarRotations. */
  jointed?: boolean
}

export interface BoxSpec2D {
  width: number
  height: number
  offset?: Vec2
  angle?: number
  material?: MaterialPreset
  sensor?: boolean
}

export interface BallSpec2D {
  radius: number
  material?: MaterialPreset
}

function bodyDescFor(type: BodyType2D): RAPIER.RigidBodyDesc {
  switch (type) {
    case 'dynamic':
      return RAPIER.RigidBodyDesc.dynamic()
    case 'fixed':
      return RAPIER.RigidBodyDesc.fixed()
    case 'kinematicPosition':
      return RAPIER.RigidBodyDesc.kinematicPositionBased()
    case 'kinematicVelocity':
      return RAPIER.RigidBodyDesc.kinematicVelocityBased()
  }
}

function applyMaterial(desc: RAPIER.ColliderDesc, material: MaterialPreset) {
  return desc
    .setFriction(material.friction)
    .setRestitution(material.restitution)
    .setDensity(material.density)
    .setFrictionCombineRule(material.frictionCombineRule)
    .setRestitutionCombineRule(material.restitutionCombineRule)
}

/** Applies the shared world settings. <Physics> sets the same values from SOLVER via props. */
export function configureWorld(world: RAPIER.World) {
  world.gravity = { x: GRAVITY[0], y: GRAVITY[1], z: GRAVITY[2] }
  world.timestep = TIME_STEP
  const p = world.integrationParameters
  p.numSolverIterations = SOLVER.numSolverIterations
  p.numInternalPgsIterations = SOLVER.numInternalPgsIterations
  p.normalizedAllowedLinearError = SOLVER.allowedLinearError
  p.minIslandSize = SOLVER.minIslandSize
  p.maxCcdSubsteps = SOLVER.maxCcdSubsteps
  p.normalizedPredictionDistance = SOLVER.predictionDistance
  world.lengthUnit = SOLVER.lengthUnit
  p.contact_natural_frequency = SOLVER.contactNaturalFrequency
}

export class World2D {
  readonly jointedBodies: RAPIER.RigidBody[] = []

  constructor(readonly world: RAPIER.World) {}

  /** A standalone world for tests and headless simulation. Call loadRapier() first. */
  static create() {
    const world = new RAPIER.World({ x: GRAVITY[0], y: GRAVITY[1], z: GRAVITY[2] })
    configureWorld(world)
    return new World2D(world)
  }

  createBody({
    type = 'dynamic',
    position,
    angle = 0,
    ccd = false,
    canSleep = true,
    jointed = false,
  }: BodySpec2D) {
    const desc = bodyDescFor(type)
      .setTranslation(position[0], position[1], 0)
      .setRotation(quatFromAngle(angle))
      .enabledTranslations(...PLANAR_TRANSLATIONS)
      .enabledRotations(...planarRotations(jointed))
      .setCcdEnabled(ccd)
      .setCanSleep(canSleep)
    const body = this.world.createRigidBody(desc)
    if (jointed) this.jointedBodies.push(body)
    return body
  }

  addBox(body: RAPIER.RigidBody, spec: BoxSpec2D) {
    const { width, height, offset = [0, 0], angle = 0, material = MATERIALS.default, sensor = false } = spec
    const desc = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, COLLIDER_DEPTH / 2)
      .setTranslation(offset[0], offset[1], 0)
      .setRotation(quatFromAngle(angle))
      .setSensor(sensor)
    // Kinematic cups (catapult, elevator) only see the ball if kinematic–dynamic pairs are enabled.
    if (sensor) desc.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL)
    return this.track(this.world.createCollider(applyMaterial(desc, material), body))
  }

  addBall(body: RAPIER.RigidBody, { radius, material = MATERIALS.ball }: BallSpec2D) {
    return this.track(
      this.world.createCollider(applyMaterial(RAPIER.ColliderDesc.ball(radius), material), body),
    )
  }

  /** Contraption id that colliders created from now on belong to; null for scene geometry and the ball. */
  owner: string | null = null
  private readonly owners = new Map<number, string>()

  private track(collider: RAPIER.Collider) {
    if (this.owner !== null) this.owners.set(collider.handle, this.owner)
    return collider
  }

  ownerOf(collider: RAPIER.Collider) {
    return this.owners.get(collider.handle) ?? null
  }

  /** Hinge about Z; dynamic bodies on either side must be created with `jointed`. Limits are radians. */
  addRevoluteJoint(
    a: RAPIER.RigidBody,
    b: RAPIER.RigidBody,
    anchorA: Vec2,
    anchorB: Vec2,
    limits?: readonly [number, number],
  ) {
    const [ax, ay, az] = PLANAR_JOINT_AXIS
    const params = RAPIER.JointData.revolute(
      { x: anchorA[0], y: anchorA[1], z: 0 },
      { x: anchorB[0], y: anchorB[1], z: 0 },
      { x: ax, y: ay, z: az },
    )
    if (limits) {
      params.limitsEnabled = true
      params.limits = [limits[0], limits[1]]
    }
    const joint = this.world.createImpulseJoint(params, a, b, true)
    joint.setContactsEnabled(false)
    return joint
  }

  /**
   * Point-to-point pin: keeps the anchors together without constraining rotation. Use it instead of a
   * revolute joint for round bobs far from their pivot, where the revolute's angular locks blow up
   * (PHYSICS.md, "Long-arm revolute joints are unstable"). The Z translation lock keeps it planar.
   */
  addPinJoint(a: RAPIER.RigidBody, b: RAPIER.RigidBody, anchorA: Vec2, anchorB: Vec2) {
    const params = RAPIER.JointData.spherical(
      { x: anchorA[0], y: anchorA[1], z: 0 },
      { x: anchorB[0], y: anchorB[1], z: 0 },
    )
    const joint = this.world.createImpulseJoint(params, a, b, true)
    joint.setContactsEnabled(false)
    return joint
  }

  /** Must run after every world step (PHYSICS.md, "Rotation locks freeze revolute joints"). */
  projectJointed() {
    for (const body of this.jointedBodies) projectToPlane(body)
  }

  free() {
    this.world.free()
  }
}
