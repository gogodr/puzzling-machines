import { describe, expect, it } from 'vitest'
import { SCENE_CATALOG } from '@shared/scenes'
import { snapAngle, snapPoint, validatePlacement } from '../build/placement'
import { simulateRun } from '../sim/simulateRun'
import type { Layout } from '@shared/layout'
import { grandFinale } from './05-grand-finale'
import { SCENES } from './registry'
import { sandbox } from './sandbox'

/**
 * Reference-solution scores, verified identical in the browser. A change here means physics or scoring
 * behaviour changed: confirm it is intended, then update the number (and expect saved scores to shift).
 */
const GOLDEN_SCORES: Record<string, number> = {
  'first-steps': 297,
  'up-the-wall': 246,
  'the-gap': 169,
  clockwork: 298,
  'grand-finale': 356,
}

describe('scene registry', () => {
  it('matches the shared catalogue', () => {
    expect(SCENES.filter((s) => !s.dev).map((s) => ({ id: s.id, name: s.name }))).toEqual(
      SCENE_CATALOG.map((s) => ({ id: s.id, name: s.name })),
    )
  })
})

describe.each(SCENES.filter((s) => !s.dev).map((s) => [s.id, s] as const))('scene %s', (_id, scene) => {
  it('is not solved by an empty layout', async () => {
    const result = await simulateRun(scene, [])
    expect(result.outcome.kind).toBe('fail')
  })

  it('reference solution is reachable with grid and rotation snapping', () => {
    for (const item of scene.referenceSolution) {
      expect(snapPoint(item.position), item.id).toEqual(item.position)
      expect(snapAngle(item.angle), item.id).toBeCloseTo(item.angle, 12)
    }
  })

  it('reference solution is a legal layout', () => {
    const placed = scene.referenceSolution
    placed.forEach((item, i) => {
      const others = placed.filter((_, j) => j !== i)
      expect(validatePlacement(scene, others, item), item.id).toEqual({ valid: true })
    })
  })

  it('reference solution reaches the goal', async () => {
    const result = await simulateRun(scene, scene.referenceSolution)
    expect(result.outcome).toEqual({ kind: 'success' })
    expect(result.score).toBe(GOLDEN_SCORES[scene.id])
  })

  it('scores deterministically', async () => {
    const a = await simulateRun(scene, scene.referenceSolution)
    const b = await simulateRun(scene, scene.referenceSolution)
    expect(b).toEqual(a)
  })

  it('does not depend on layout order', async () => {
    const a = await simulateRun(scene, scene.referenceSolution)
    const b = await simulateRun(scene, [...scene.referenceSolution].reverse())
    expect(b).toEqual(a)
  })
})

describe('grand finale', () => {
  it('also has a low road: bridge the pit and ride the factory lift', async () => {
    const lowRoad: Layout = [
      { id: 'b1', type: 'ramp', position: [-1.75, -5.5], angle: 0, flipped: false, params: {} },
    ]
    expect(validatePlacement(grandFinale, [], lowRoad[0]!)).toEqual({ valid: true })
    const result = await simulateRun(grandFinale, lowRoad)
    expect(result.outcome).toEqual({ kind: 'success' })
  })
})

describe('sandbox', () => {
  it('is not solved empty and is solved by its reference layout', async () => {
    expect((await simulateRun(sandbox, [])).outcome.kind).toBe('fail')
    const result = await simulateRun(sandbox, sandbox.referenceSolution)
    expect(result.outcome).toEqual({ kind: 'success' })
    expect(result.score).toBeGreaterThan(0)
  })

  it('reference solution is a legal, snapped layout', () => {
    for (const item of sandbox.referenceSolution) {
      expect(snapPoint(item.position), item.id).toEqual(item.position)
      expect(snapAngle(item.angle), item.id).toBeCloseTo(item.angle, 12)
    }
    sandbox.referenceSolution.forEach((item, i) => {
      const others = sandbox.referenceSolution.filter((_, j) => j !== i)
      expect(validatePlacement(sandbox, others, item), item.id).toEqual({ valid: true })
    })
  })
})
