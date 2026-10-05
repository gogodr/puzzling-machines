import { describe, expect, it } from 'vitest'
import { B_TOUCH, COMPLETION_MULTIPLIER, K_SPEED, K_TIME, ScoreTracker, TOUCH_DECAY } from './ScoreTracker'

describe('ScoreTracker', () => {
  it('accrues time and speed points only above the motion threshold', () => {
    const t = new ScoreTracker()
    t.sample(0.1, 1)
    expect(t.motion).toBe(0)
    t.sample(2, 1)
    expect(t.motion).toBeCloseTo(K_TIME + K_SPEED * 2)
    expect(t.timeInMotion).toBe(1)
    expect(t.distance).toBe(2)
  })

  it('applies the completion multiplier only on success', () => {
    const t = new ScoreTracker()
    t.sample(1, 2)
    const motion = (K_TIME + K_SPEED) * 2
    expect(t.breakdown(true).total).toBe(Math.round(motion * COMPLETION_MULTIPLIER))
    expect(t.breakdown(false).total).toBe(0)
    expect(t.breakdown(false).motion).toBe(Math.floor(motion))
  })

  it('gives a diminishing bonus for repeat touches of the same contraption', () => {
    const t = new ScoreTracker()
    t.touch('a')
    t.touch('a')
    t.touch('b')
    expect(t.bonus).toBeCloseTo(B_TOUCH + B_TOUCH * TOUCH_DECAY + B_TOUCH)
    expect(t.touched).toBe(2)
    const repeats = Array.from({ length: 20 }, (_, i) => B_TOUCH * TOUCH_DECAY ** i).reduce(
      (s, n) => s + n,
      0,
    )
    const loop = new ScoreTracker()
    for (let i = 0; i < 20; i++) loop.touch('x')
    expect(loop.bonus).toBeLessThan(B_TOUCH / (1 - TOUCH_DECAY) + 1e-6)
    expect(loop.bonus).toBeCloseTo(repeats)
  })
})
