import { CONTRAPTION_TYPES } from '@shared/layout'
import { firstSteps } from './01-first-steps'
import { defineScene } from './schema'

/**
 * Playground with every contraption. Hidden from the production catalogue. The machine corridor is
 * the First Steps layout (known solvable); the extra space is for trying the rest of the catalogue.
 */
export const sandbox = defineScene({
  id: 'sandbox',
  name: 'Sandbox',
  dev: true,
  backdrop: 'first-steps',
  bounds: { minX: -12, minY: -6, maxX: 12, maxY: 8 },
  statics: [
    { position: [0, -5.9], size: [24, 0.3] },
    { position: [-11.9, 1], size: [0.2, 14] },
    { position: [11.9, 1], size: [0.2, 14] },
    ...firstSteps.statics,
  ],
  buildZones: [{ minX: -11.7, minY: -5.75, maxX: 11.7, maxY: 5.5 }],
  start: firstSteps.start,
  goal: firstSteps.goal,
  inventory: CONTRAPTION_TYPES.map((type) => ({ type, count: 0 })),
  limits: { maxRunTime: 60, stallSeconds: 4 },
  referenceSolution: firstSteps.referenceSolution,
})
