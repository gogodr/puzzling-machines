import { defineScene } from './schema'

/**
 * Scene 4 is about timing. The ball drops onto the escapement ledge and sits dead still; only a swing
 * can start it. A fixed lift (the moving platform) carries it up to the gallery, which ends at a gap
 * above the goal shelf.
 */
export const clockwork = defineScene({
  id: 'clockwork',
  name: 'Clockwork',
  theme: 'clocktower',
  bounds: { minX: -8, minY: -4.5, maxX: 8, maxY: 4.5 },
  statics: [
    { position: [0, -4.4], size: [16, 0.3] },
    { position: [-7.9, 0], size: [0.2, 9] },
    { position: [7.9, 0], size: [0.2, 9] },
    // Escapement ledge: flat, so a ball dropped on it never moves by itself.
    { position: [-4.65, 0.05], size: [6.3, 0.3] },
    // Catch wall right of the lift, so a fast ball falls back onto the platform.
    { position: [0.1, 0.3], size: [0.2, 3.6] },
    // Gallery the lift tips onto.
    { position: [1.55, 2.25], size: [2.9, 0.3] },
    // Goal shelf, tilted into the right wall.
    { position: [6.9, 1.25], size: [1.8, 0.3], angle: -0.08 },
  ],
  fixed: [
    {
      id: 'lift',
      type: 'elevator',
      position: [-0.75, 1.34],
      angle: 0,
      flipped: false,
      params: { height: 3, speed: 1.5 },
    },
  ],
  buildZones: [{ minX: -7.8, minY: -4.25, maxX: 7.8, maxY: 4.4 }],
  start: { position: [-4.5, 3.6] },
  goal: { minX: 6.1, minY: 1.25, maxX: 7.8, maxY: 2.6 },
  inventory: [
    { type: 'pendulum', count: 1 },
    { type: 'seesaw', count: 1 },
    { type: 'dominoes', count: 1 },
    { type: 'conveyor', count: 1 },
  ],
  limits: { maxRunTime: 40, stallSeconds: 4 },
  referenceSolution: [
    { id: 'p1', type: 'pendulum', position: [-5, 1.25], angle: 0, flipped: true, params: {} },
    { id: 'c1', type: 'conveyor', position: [4.5, 1.75], angle: 0, flipped: false, params: {} },
  ],
})
