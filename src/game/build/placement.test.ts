import { describe, expect, it } from 'vitest'
import type { PlacedContraption } from '@shared/layout'
import { degToRad } from '@shared/math'
import { firstSteps } from '../scenes/01-first-steps'
import { obbOverlap, rectContainsObb } from './geometry'
import { snapAngle, snapPoint, validatePlacement } from './placement'

const ramp = (position: [number, number], angle = 0, id = 'a'): PlacedContraption => ({
  id,
  type: 'ramp',
  position,
  angle,
  flipped: false,
  params: {},
})

describe('geometry', () => {
  it('detects overlap of rotated boxes and ignores touching ones', () => {
    const a = { center: [0, 0] as const, half: [1, 0.1] as const, angle: 0 }
    expect(obbOverlap(a, { center: [1.5, 0], half: [1, 0.1], angle: 0 })).toBe(true)
    expect(obbOverlap(a, { center: [2, 0], half: [1, 0.1], angle: 0 })).toBe(false)
    expect(obbOverlap(a, { center: [0, 0.5], half: [1, 0.1], angle: Math.PI / 4 })).toBe(true)
    expect(obbOverlap(a, { center: [0, 1.5], half: [1, 0.1], angle: Math.PI / 4 })).toBe(false)
  })

  it('checks rect containment of a rotated box', () => {
    const r = { minX: -1, minY: -1, maxX: 1, maxY: 1 }
    expect(rectContainsObb(r, { center: [0, 0], half: [0.9, 0.1], angle: 0 })).toBe(true)
    expect(rectContainsObb(r, { center: [0, 0], half: [0.9, 0.1], angle: Math.PI / 4 })).toBe(true)
    expect(rectContainsObb(r, { center: [0.5, 0], half: [0.9, 0.1], angle: 0 })).toBe(false)
  })
})

describe('snapping', () => {
  it('snaps points to the 0.25 grid', () => {
    expect(snapPoint([0.13, -0.37])).toEqual([0.25, -0.25])
  })

  it('snaps angles to 15° and wraps', () => {
    expect(snapAngle(degToRad(14))).toBeCloseTo(degToRad(15))
    expect(snapAngle(degToRad(375))).toBeCloseTo(degToRad(15))
    expect(snapAngle(degToRad(-195))).toBeCloseTo(degToRad(165))
  })
})

describe('validatePlacement', () => {
  it('accepts a free spot in the build zone', () => {
    expect(validatePlacement(firstSteps, [], ramp([0, 0]))).toEqual({ valid: true })
  })

  it('rejects positions outside the build zone', () => {
    expect(validatePlacement(firstSteps, [], ramp([0, 3.5]))).toMatchObject({ reason: 'outsideBuildZone' })
  })

  it('rejects overlap with scene geometry', () => {
    expect(validatePlacement(firstSteps, [], ramp([5, -2.75], Math.PI / 2))).toMatchObject({
      reason: 'overlapsScene',
    })
  })

  it('rejects overlap with other contraptions but not with itself', () => {
    const other = ramp([0.5, 0], 0, 'b')
    expect(validatePlacement(firstSteps, [other], ramp([0, 0]))).toMatchObject({
      reason: 'overlapsContraption',
    })
    expect(validatePlacement(firstSteps, [ramp([0, 0])], ramp([0, 0]))).toEqual({ valid: true })
  })

  it('keeps the goal clear', () => {
    const short = { ...ramp([6.5, -3.5]), params: { length: 2 } }
    expect(validatePlacement(firstSteps, [], short)).toMatchObject({ reason: 'blocksStartOrGoal' })
  })
})
