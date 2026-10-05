import type { Layout } from '@shared/layout'
import { loadRapier, World2D } from '../engine/physics/world2d'
import type { SceneDefinition } from '../scenes/schema'
import { Simulation } from './Simulation'

/** Runs a whole scene without rendering; used by solvability tests and tuning. */
export async function simulateRun(
  scene: SceneDefinition,
  layout: Layout,
  onStep?: (sim: Simulation) => void,
) {
  await loadRapier()
  const world = World2D.create()
  try {
    const sim = new Simulation(world, scene, layout)
    while (!sim.outcome) {
      sim.beforeStep()
      world.world.step()
      sim.afterStep()
      onStep?.(sim)
    }
    return sim.result()
  } finally {
    world.free()
  }
}
