import { describe, expect, it } from 'vitest'
import type { RunResult } from '@shared/run'
import { degToRad } from '@shared/math'
import { GRID, validatePlacement } from '../build/placement'
import { firstSteps } from '../scenes/01-first-steps'
import { handleKey } from '../ui/controls'
import { createGameStore, remaining } from './gameStore'

function setup() {
  const store = createGameStore()
  store.getState().loadScene(firstSteps)
  return store
}

const result: RunResult = {
  sceneId: 'first-steps',
  outcome: { kind: 'success' },
  score: 10,
  breakdown: { timeInMotion: 1, distance: 1, motion: 7, touched: 0, bonus: 0, multiplier: 1.5, total: 10 },
  runTime: 1,
  contraptionsUsed: 0,
}

describe('game store', () => {
  it('places a contraption from the tray at a snapped position', () => {
    const store = setup()
    store.getState().beginTrayDrag('ramp', [0.1, 0.1])
    expect(remaining(store.getState(), 'ramp')).toBe(1)
    store.getState().moveDrag([1.13, -0.4])
    store.getState().endDrag()
    const { layout, selectedId } = store.getState()
    expect(layout).toHaveLength(1)
    expect(layout[0]?.position).toEqual([1.25, -0.5])
    expect(selectedId).toBe(layout[0]?.id)
  })

  it('discards an invalid drop from the tray and restores an invalid move', () => {
    const store = setup()
    const s = store.getState
    s().beginTrayDrag('ramp', [0, 0])
    s().moveDrag([0, 3.5])
    expect(s().drag?.valid).toBe(false)
    s().endDrag()
    expect(s().layout).toHaveLength(0)
    expect(remaining(s(), 'ramp')).toBe(2)

    s().beginTrayDrag('ramp', [0, 0])
    s().endDrag()
    const id = s().layout[0]!.id
    s().beginMoveDrag(id, [0.5, 0])
    s().moveDrag([0.5, 3.5])
    s().endDrag()
    expect(s().layout[0]?.position).toEqual([0, 0])
  })

  it('stops at the inventory count', () => {
    const store = setup()
    const s = store.getState
    s().beginTrayDrag('conveyor', [0, 0])
    s().endDrag()
    s().beginTrayDrag('conveyor', [0, -2])
    expect(s().drag).toBeNull()
  })

  it('rotates, flips and deletes the selection', () => {
    const store = setup()
    const s = store.getState
    s().beginTrayDrag('conveyor', [0, 0])
    s().endDrag()
    s().rotate(1)
    s().flip()
    expect(s().layout[0]?.angle).toBeCloseTo(degToRad(15))
    expect(s().layout[0]?.flipped).toBe(true)
    s().deleteSelected()
    expect(s().layout).toHaveLength(0)
  })

  it('does not flip contraptions that are not flippable', () => {
    const store = setup()
    const s = store.getState
    s().beginTrayDrag('ramp', [0, 0])
    s().endDrag()
    s().flip()
    expect(s().layout[0]?.flipped).toBe(false)
  })

  it('shows a reference-piece hint after three failed runs', () => {
    const store = setup()
    const fail: RunResult = { ...result, outcome: { kind: 'fail', reason: 'stalled' }, score: 0 }
    for (let i = 0; i < 3; i++) {
      store.getState().startRun()
      store.getState().endRun(fail)
      store.getState().backToBuild()
    }
    expect(store.getState().failCount).toBe(3)
    expect(store.getState().hint).toEqual(firstSteps.referenceSolution[0])
  })

  it('locks editing outside build mode and walks the mode machine', () => {
    const store = setup()
    const s = store.getState
    s().startRun()
    expect(s().mode).toBe('running')
    expect(s().runId).toBe(1)
    s().beginTrayDrag('ramp', [0, 0])
    expect(s().drag).toBeNull()
    s().endRun(result)
    expect(s().mode).toBe('result')
    expect(s().result).toBe(result)
    s().backToBuild()
    expect(s().mode).toBe('build')
    expect(s().result).toBeNull()
  })

  it('sanitises a saved layout and continues ids after it', () => {
    const store = createGameStore()
    const [r1, c1, r2] = firstSteps.referenceSolution
    const ok = { ...r1!, id: 'p7' }
    const overlapping = { ...r1!, id: 'p8' }
    const tooMany = { ...r1!, id: 'p9', position: [0, 2] as [number, number] }
    store
      .getState()
      .loadScene(firstSteps, [ok, overlapping, { ...r2!, id: 'p3' }, tooMany, { ...c1!, id: 'p4' }])
    expect(store.getState().layout.map((p) => p.id)).toEqual(['p7', 'p3', 'p4'])
    expect(store.getState().nextId).toBe(8)
  })
})

describe('keyboard building', () => {
  it('Tab walks the tray and steps off either end', () => {
    const store = setup()
    const count = firstSteps.inventory.length
    handleKey(store, 'Tab', false)
    expect(store.getState().trayCursor).toBe(0)
    for (let i = 1; i < count; i++) handleKey(store, 'Tab', false)
    expect(store.getState().trayCursor).toBe(count - 1)
    handleKey(store, 'Tab', false)
    expect(store.getState().trayCursor).toBeNull()
    handleKey(store, 'Tab', true)
    expect(store.getState().trayCursor).toBe(count - 1)
  })

  it('Enter places the highlighted part on a legal spot and selects it', () => {
    const store = setup()
    handleKey(store, 'Tab', false)
    handleKey(store, 'Enter', false)
    const { layout, selectedId, sfx } = store.getState()
    expect(layout).toHaveLength(1)
    expect(layout[0]?.type).toBe(firstSteps.inventory[0]?.type)
    expect(selectedId).toBe(layout[0]?.id)
    expect(validatePlacement(firstSteps, [], layout[0]!)).toEqual({ valid: true })
    expect(sfx?.name).toBe('place')
  })

  it('finds a free spot next to parts already on the board', () => {
    const store = setup()
    handleKey(store, 'Tab', false)
    handleKey(store, 'Enter', false)
    handleKey(store, 'Enter', false)
    const [a, b] = store.getState().layout
    expect(b).toBeDefined()
    expect(validatePlacement(firstSteps, [a!], b!)).toEqual({ valid: true })
  })

  it('arrows nudge the selected part by grid cells and refuse illegal moves', () => {
    const store = setup()
    handleKey(store, 'Tab', false)
    handleKey(store, 'Enter', false)
    const start = store.getState().layout[0]!.position
    handleKey(store, 'ArrowRight', false)
    handleKey(store, 'ArrowUp', true)
    expect(store.getState().layout[0]!.position).toEqual([start[0] + GRID, start[1] + 4 * GRID])
    for (let i = 0; i < 60; i++) handleKey(store, 'ArrowUp', true)
    const moved = store.getState().layout[0]!
    expect(validatePlacement(firstSteps, [], moved)).toEqual({ valid: true })
    expect(store.getState().sfx?.name).toBe('invalid')
  })

  it('emits build cues for rotate and remove', () => {
    const store = setup()
    handleKey(store, 'Tab', false)
    handleKey(store, 'Enter', false)
    handleKey(store, 'r', false)
    expect(store.getState().sfx?.name).toBe('rotate')
    handleKey(store, 'Delete', false)
    expect(store.getState().sfx?.name).toBe('remove')
    expect(store.getState().layout).toHaveLength(0)
  })
})
