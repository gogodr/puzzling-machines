import { defineScene } from './schema'

/**
 * Scene 2: the goal is on a high attic landing. The left floor ends at a well; rolling in falls
 * out of the machine. An elevator in the well lifts the ball onto the landing.
 */
export const upTheWall = defineScene({
  id: 'up-the-wall',
  name: 'Up the Wall',
  theme: 'attic',
  bounds: { minX: -8, minY: -5, maxX: 8, maxY: 6.5 },
  statics: [
    { position: [-7.9, 0.75], size: [0.2, 11.5] },
    { position: [7.9, 0.75], size: [0.2, 11.5] },
    // Left attic floor. The well to its right has no floor.
    { position: [-5, -1.85], size: [5.5, 0.3] },
    // Start shelf, tilted so the ball rolls toward the well.
    { position: [-6.5, -1.45], size: [2.6, 0.25], angle: -0.12 },
    // Keeps a riding ball from bouncing off the left side of the lift.
    { position: [-2.35, 2.5], size: [0.25, 4.5] },
    // High landing and far cup wall — already in the attic; the lift has to reach it.
    { position: [2.75, 4.1], size: [6.4, 0.25] },
    { position: [5.75, 4.8], size: [0.25, 1.2] },
  ],
  buildZones: [{ minX: -7.7, minY: -4.8, maxX: 7.7, maxY: 4.6 }],
  start: { position: [-7.2, -1] },
  goal: { minX: 0, minY: 4.25, maxX: 5.6, maxY: 5.5 },
  inventory: [
    { type: 'elevator', count: 1, params: { height: 6, speed: 2 } },
    { type: 'fan', count: 1, params: { range: 5, strength: 28 } },
    { type: 'trampoline', count: 1 },
    { type: 'ramp', count: 1 },
  ],
  limits: { maxRunTime: 40, stallSeconds: 4 },
  referenceSolution: [
    {
      id: 'e1',
      type: 'elevator',
      position: [-1.25, 1.25],
      angle: 0,
      flipped: false,
      params: { height: 6, speed: 2 },
    },
  ],
})
