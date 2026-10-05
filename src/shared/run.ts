export type FailReason = 'outOfBounds' | 'stalled' | 'timeout'

export type RunOutcome = { kind: 'success' } | { kind: 'fail'; reason: FailReason }

export interface ScoreBreakdown {
  /** Seconds the ball spent moving faster than the motion threshold. */
  timeInMotion: number
  /** Metres travelled while moving. */
  distance: number
  /** Points from time and speed in motion. */
  motion: number
  /** Distinct contraptions the ball touched. */
  touched: number
  /** Touch bonus points (diminishing per repeat touch). */
  bonus: number
  multiplier: number
  /** Final score; 0 for failed runs. */
  total: number
}

export interface RunResult {
  sceneId: string
  outcome: RunOutcome
  score: number
  breakdown: ScoreBreakdown
  /** Simulated seconds from Run to outcome. */
  runTime: number
  contraptionsUsed: number
}

export const FAIL_REASON_TEXT: Record<FailReason, string> = {
  outOfBounds: 'The ball left the machine.',
  stalled: 'The ball stopped moving.',
  timeout: 'Out of time.',
}
