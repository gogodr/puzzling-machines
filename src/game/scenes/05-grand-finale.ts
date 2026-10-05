import { degToRad } from '@shared/math'
import { defineScene } from './schema'

/**
 * Scene 5 is the open finale. Two routes reach the cup: the low road bridges the furnace pit and lets
 * the factory belt and lift do the rest; the high road builds across the roof and drops in from
 * above. Longer machines touch more parts and score far more.
 */
export const grandFinale = defineScene({
  id: 'grand-finale',
  name: 'Grand Finale',
  theme: 'factory',
  bounds: { minX: -12, minY: -6, maxX: 12, maxY: 7 },
  statics: [
    { position: [-11.9, 0.5], size: [0.2, 13] },
    { position: [11.9, 0.5], size: [0.2, 13] },
    // Start shelf.
    { position: [-9.75, 5], size: [4.5, 0.25], angle: -0.12 },
    // Factory floor, split by the furnace pit (x -3 … -0.5).
    { position: [-7.45, -5.9], size: [8.9, 0.3] },
    { position: [2.9, -5.9], size: [6.8, 0.3] },
    // Dividing wall with a tunnel along the floor.
    { position: [0.15, -1], size: [0.3, 7] },
    // Lift backstop, also holding up the cup platform.
    { position: [7.85, -2.5], size: [0.2, 6.7] },
    // Cup platform, tilted into the right wall.
    { position: [9.775, 0.85], size: [4.05, 0.3], angle: -0.04 },
  ],
  fixed: [
    {
      id: 'belt',
      type: 'conveyor',
      position: [3.25, -5.6],
      angle: 0,
      flipped: false,
      params: { length: 4, speed: 3 },
    },
    {
      id: 'lift',
      type: 'elevator',
      position: [7, -2.06],
      angle: 0,
      flipped: false,
      params: { height: 7.5, speed: 2.5 },
    },
  ],
  buildZones: [{ minX: -11.75, minY: -5.75, maxX: 11.75, maxY: 6.75 }],
  start: { position: [-11.2, 5.6] },
  goal: { minX: 8.1, minY: 0.9, maxX: 11.8, maxY: 2.6 },
  inventory: [
    { type: 'ramp', count: 3 },
    { type: 'conveyor', count: 2 },
    { type: 'trampoline', count: 2 },
    { type: 'fan', count: 2 },
    { type: 'spinner', count: 2 },
    { type: 'seesaw', count: 1 },
    { type: 'pendulum', count: 1 },
    { type: 'dominoes', count: 2 },
    { type: 'funnel', count: 2 },
    { type: 'pipe', count: 2 },
    { type: 'pipeCurve', count: 2 },
    { type: 'catapult', count: 1 },
    { type: 'sling', count: 1 },
    { type: 'elevator', count: 1 },
  ],
  limits: { maxRunTime: 60, stallSeconds: 4 },
  referenceSolution: [
    { id: 'c1', type: 'conveyor', position: [-6, 4.25], angle: 0, flipped: false, params: {} },
    { id: 'c2', type: 'conveyor', position: [-2.75, 4.25], angle: 0, flipped: false, params: {} },
    { id: 'r1', type: 'ramp', position: [0.75, 3.5], angle: degToRad(-15), flipped: false, params: {} },
    { id: 'r2', type: 'ramp', position: [4.25, 2.75], angle: 0, flipped: false, params: {} },
  ],
})
