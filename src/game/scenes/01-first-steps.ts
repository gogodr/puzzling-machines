import { degToRad } from '@shared/math'
import { defineScene } from './schema'

/**
 * Scene 1 teaches placement. The ball rolls off a shelf at the top left; the goal is a cup at the bottom
 * right whose wall is too tall to roll over, so the player must carry the ball across and drop it in.
 */
export const firstSteps = defineScene({
  id: 'first-steps',
  name: 'First Steps',
  bounds: { minX: -8, minY: -4.5, maxX: 8, maxY: 4.5 },
  statics: [
    // Floor and side walls.
    { position: [0, -4.4], size: [16, 0.3] },
    { position: [-7.9, 0], size: [0.2, 9] },
    { position: [7.9, 0], size: [0.2, 9] },
    // Start shelf, tilted so the ball rolls right.
    { position: [-6.15, 3], size: [3.5, 0.25], angle: -0.12 },
    // Goal cup wall.
    { position: [5, -3.4], size: [0.3, 1.7] },
  ],
  buildZones: [{ minX: -7.8, minY: -4.25, maxX: 7.8, maxY: 2.6 }],
  start: { position: [-7.4, 3.6] },
  goal: { minX: 5.15, minY: -4.25, maxX: 7.8, maxY: -3.2 },
  inventory: [
    { type: 'ramp', count: 2 },
    { type: 'conveyor', count: 1 },
    { type: 'trampoline', count: 1 },
  ],
  limits: { maxRunTime: 30, stallSeconds: 3 },
  referenceSolution: [
    { id: 'r1', type: 'ramp', position: [-3, 0.5], angle: degToRad(-15), flipped: false, params: {} },
    { id: 'c1', type: 'conveyor', position: [1.25, -1], angle: 0, flipped: false, params: {} },
    { id: 'r2', type: 'ramp', position: [4.25, -1.75], angle: degToRad(-15), flipped: false, params: {} },
  ],
})
