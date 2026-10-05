import { defineScene } from './schema'

/**
 * Scene 3: two rooftops with a hole between them. Rolling off the left roof falls out of the
 * machine; the player has to launch the ball across.
 */
export const theGap = defineScene({
  id: 'the-gap',
  name: 'The Gap',
  theme: 'rooftops',
  bounds: { minX: -10, minY: -5, maxX: 10, maxY: 5.5 },
  statics: [
    { position: [-9.9, 0.25], size: [0.2, 10] },
    { position: [9.9, 0.25], size: [0.2, 10] },
    // Start shelf dumps onto a short flat runway. The sling sits in the gap just past the edge.
    { position: [-8.75, 0.4], size: [2, 0.25], angle: -0.15 },
    { position: [-6.5, 0], size: [2.4, 0.3] },
    // Right rooftop and goal cup.
    { position: [5.5, 0], size: [8, 0.3] },
    { position: [9.35, 0.7], size: [0.25, 1.2] },
  ],
  buildZones: [{ minX: -9.7, minY: -2, maxX: 9.7, maxY: 4.5 }],
  start: { position: [-9.2, 0.7] },
  goal: { minX: 2.0, minY: 0.15, maxX: 9.2, maxY: 1.5 },
  inventory: [
    { type: 'sling', count: 1 },
    { type: 'catapult', count: 1 },
    { type: 'spinner', count: 1 },
    { type: 'ramp', count: 2 },
  ],
  limits: { maxRunTime: 25, stallSeconds: 3 },
  referenceSolution: [
    { id: 's1', type: 'sling', position: [-4.75, 0.25], angle: 0, flipped: false, params: {} },
  ],
})
