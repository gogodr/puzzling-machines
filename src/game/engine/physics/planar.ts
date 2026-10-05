import { quatFromAngle, type Quat } from '@shared/math'

type AxisFlags = readonly [boolean, boolean, boolean]

/** Axis locks applied to every body so the 3D engine behaves as a 2D one (PLAN D1). */
export const PLANAR_TRANSLATIONS = [true, true, false] as const satisfies AxisFlags
export const PLANAR_ROTATIONS = [false, false, true] as const satisfies AxisFlags

/**
 * Rapier 0.19 freezes revolute joints on bodies whose X/Y rotations are locked (docs/PHYSICS.md).
 * Jointed bodies therefore lock only Z translation and are re-projected onto the plane after every
 * step with projectToPlane, because the hinge alone lets them drift off-plane under contact load.
 */
export const JOINTED_ROTATIONS = [true, true, true] as const satisfies AxisFlags

export function planarRotations(jointed: boolean): AxisFlags {
  return jointed ? JOINTED_ROTATIONS : PLANAR_ROTATIONS
}

interface Vector3Like {
  x: number
  y: number
  z: number
}

export interface RotatingBodyLike {
  rotation(): Quat
  setRotation(rotation: Quat, wakeUp: boolean): void
  angvel(): Vector3Like
  setAngvel(velocity: Vector3Like, wakeUp: boolean): void
}

/** Removes any X/Y rotation and spin, keeping the Z angle and Z angular velocity. */
export function projectToPlane(body: RotatingBodyLike) {
  const r = body.rotation()
  if (r.x === 0 && r.y === 0) return
  body.setRotation(quatFromAngle(2 * Math.atan2(r.z, r.w)), false)
  body.setAngvel({ x: 0, y: 0, z: body.angvel().z }, false)
}

/** Hinge axis for every 2D joint. */
export const PLANAR_JOINT_AXIS = [0, 0, 1] as const

export type BodyType2D = 'dynamic' | 'fixed' | 'kinematicPosition' | 'kinematicVelocity'
