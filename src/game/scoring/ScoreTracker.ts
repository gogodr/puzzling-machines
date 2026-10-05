import type { ScoreBreakdown } from '@shared/run'

/** PLAN "Scoring": points accrue only while the ball moves faster than this (m/s). */
export const MOTION_THRESHOLD = 0.3
/** Points per second of motion. */
export const K_TIME = 10
/** Points per metre travelled (speed × time). */
export const K_SPEED = 4
/** Bonus for the first touch of a contraption; each repeat touch of the same one earns DECAY times less. */
export const B_TOUCH = 15
export const TOUCH_DECAY = 0.5
/** A contact only counts as a new touch after this many seconds apart, so rolling jitter is one touch. */
export const TOUCH_GAP = 0.2
/** Applied to the base score when the ball reaches the goal. */
export const COMPLETION_MULTIPLIER = 1.5

export class ScoreTracker {
  timeInMotion = 0
  distance = 0
  motion = 0
  bonus = 0
  private readonly touches = new Map<string, number>()

  sample(speed: number, dt: number) {
    if (speed <= MOTION_THRESHOLD) return
    this.timeInMotion += dt
    this.distance += speed * dt
    this.motion += (K_TIME + K_SPEED * speed) * dt
  }

  /** Records a new touch of contraption `id`. Repeats converge: total per contraption < B_TOUCH / (1 - DECAY). */
  touch(id: string) {
    const n = this.touches.get(id) ?? 0
    this.bonus += B_TOUCH * TOUCH_DECAY ** n
    this.touches.set(id, n + 1)
  }

  get touched() {
    return this.touches.size
  }

  /** Points shown while the run is in progress. */
  get live() {
    return Math.floor(this.motion + this.bonus)
  }

  breakdown(success: boolean): ScoreBreakdown {
    return {
      timeInMotion: this.timeInMotion,
      distance: this.distance,
      motion: Math.floor(this.motion),
      touched: this.touched,
      bonus: Math.floor(this.bonus),
      multiplier: COMPLETION_MULTIPLIER,
      total: success ? Math.round((this.motion + this.bonus) * COMPLETION_MULTIPLIER) : 0,
    }
  }
}
