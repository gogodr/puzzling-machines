import { useRef } from 'react'
import { useAfterPhysicsStep, useBeforePhysicsStep } from '@react-three/rapier'
import type { ContraptionType } from '@shared/layout'
import { World2D } from '../engine/physics/world2d'
import { useGameStore } from '../state/context'
import { impactSfx } from './impactSfx'
import { Simulation } from './Simulation'

/**
 * Drives a Simulation from inside <Physics>. The simulation is built on the first step rather than in
 * an effect, so StrictMode's double-mounted effects cannot create bodies twice.
 */
export function SimulationRunner() {
  const store = useGameStore()
  const sim = useRef<Simulation | null>(null)
  const before = useRef({ x: 0, y: 0 })

  useBeforePhysicsStep((world) => {
    if (!sim.current) {
      const { scene, layout, mode, setSimulation } = store.getState()
      if (!scene || mode !== 'running') return
      sim.current = new Simulation(new World2D(world), scene, layout)
      setSimulation(sim.current)
    }
    const v = sim.current.ball.linvel()
    before.current = { x: v.x, y: v.y }
    sim.current.beforeStep()
  })

  useAfterPhysicsStep(() => {
    const s = sim.current
    if (!s) return
    const ended = s.outcome
    s.afterStep()
    if (!ended) emitSounds(s)
    if (!ended && s.outcome) store.getState().endRun(s.result())
  })

  /** Presentation only: reads the step's results, never feeds back into the simulation. */
  function emitSounds(s: Simulation) {
    const { emitSfx } = store.getState()
    const types = (ids: readonly string[]) =>
      ids.map((id) => s.typeOf(id)).filter((t): t is ContraptionType => t !== undefined)
    const fresh = types(s.newTouches)
    if (fresh.includes('elevator')) emitSfx('elevator')
    const v = s.ball.linvel()
    const cue = impactSfx(types(s.touches), Math.hypot(v.x - before.current.x, v.y - before.current.y))
    if (cue) emitSfx(cue.name, cue.intensity)
  }

  return null
}
