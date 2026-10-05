/**
 * Simulation constants shared by the in-game <Physics> world and the headless test world (PLAN D3).
 *
 * Body creation order matters for determinism and for snapshot restore:
 * scene statics → fixed contraptions → placed contraptions sorted by id.
 */

export const TIME_STEP = 1 / 120

export const GRAVITY = [0, -9.81, 0] as const

/**
 * Solver settings applied identically by <Physics> props in the game and by World2D.configure in tests.
 * Values match @react-three/rapier 2.2 defaults; they are pinned here so neither side drifts.
 */
export const SOLVER = {
  numSolverIterations: 4,
  numInternalPgsIterations: 1,
  allowedLinearError: 0.001,
  predictionDistance: 0.002,
  minIslandSize: 128,
  maxCcdSubsteps: 1,
  contactNaturalFrequency: 30,
  lengthUnit: 1,
} as const

/** Depth of every collider along Z. Colliders are centred on z = 0 so contacts stay in-plane. */
export const COLLIDER_DEPTH = 1

export const BALL_RADIUS = 0.25

export const MAX_BALL_SPEED = 20

/** Thinnest static wall allowed in scenes. Must exceed MAX_BALL_SPEED * TIME_STEP so CCD is a backstop, not the only guard. */
export const MIN_WALL_THICKNESS = 0.2
