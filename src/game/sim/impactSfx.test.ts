import { describe, expect, it } from 'vitest'
import { IMPACT_FULL, IMPACT_MIN, impactSfx } from './impactSfx'

describe('impactSfx', () => {
  it('ignores soft contacts', () => {
    expect(impactSfx(['ramp'], IMPACT_MIN - 0.01)).toBeNull()
  })

  it('prefers a contraption signature sound over a generic impact', () => {
    expect(impactSfx(['ramp', 'trampoline'], 5)?.name).toBe('trampoline')
    expect(impactSfx(['sling'], 5)?.name).toBe('launch')
    expect(impactSfx(['catapult'], 5)?.name).toBe('launch')
    expect(impactSfx(['spinner'], 5)?.name).toBe('spinner')
  })

  it('picks metal or wood from what was hit', () => {
    expect(impactSfx(['pipe'], 5)?.name).toBe('impactMetal')
    expect(impactSfx(['ramp'], 5)?.name).toBe('impactWood')
    expect(impactSfx([], 5)?.name).toBe('impactWood')
  })

  it('scales intensity from threshold to full', () => {
    expect(impactSfx([], IMPACT_MIN)?.intensity).toBe(0)
    expect(impactSfx([], IMPACT_FULL)?.intensity).toBe(1)
    expect(impactSfx([], IMPACT_FULL * 3)?.intensity).toBe(1)
  })
})
