import { describe, expect, it } from 'vitest'
import { computeOrthoFraming } from './framing'

const bounds = { minX: -8, minY: -4.5, maxX: 8, maxY: 4.5 }

describe('computeOrthoFraming', () => {
  it('fills a matching 16:9 viewport exactly', () => {
    expect(computeOrthoFraming(bounds, { width: 1600, height: 900 })).toEqual({ zoom: 100, center: [0, 0] })
  })

  it('is limited by height on wide viewports and by width on tall ones', () => {
    expect(computeOrthoFraming(bounds, { width: 3000, height: 900 }).zoom).toBe(100)
    expect(computeOrthoFraming(bounds, { width: 800, height: 2000 }).zoom).toBe(50)
  })

  it('accounts for padding and off-origin bounds', () => {
    const framing = computeOrthoFraming(
      { minX: 0, minY: 0, maxX: 8, maxY: 8 },
      { width: 1000, height: 1000 },
      1,
    )
    expect(framing).toEqual({ zoom: 100, center: [4, 4] })
  })
})
