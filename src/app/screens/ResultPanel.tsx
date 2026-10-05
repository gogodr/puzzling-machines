import { useState, type FormEvent } from 'react'
import { FAIL_REASON_TEXT, type RunResult } from '@shared/run'
import { isValidName, type LeaderboardRepository } from '../storage/leaderboard'
import { LeaderboardTable } from './LeaderboardTable'

interface ResultPanelProps {
  result: RunResult
  leaderboard: LeaderboardRepository
  playerName: string
  onNameSaved(name: string): void
  onClose(): void
  onNext?: () => void
  nextName?: string
}

function Breakdown({ result }: { result: RunResult }) {
  const b = result.breakdown
  return (
    <dl className="breakdown">
      <dt>Time in motion</dt>
      <dd>{b.timeInMotion.toFixed(1)} s</dd>
      <dt>Distance travelled</dt>
      <dd>{b.distance.toFixed(1)} m</dd>
      <dt>Motion points</dt>
      <dd>{b.motion}</dd>
      <dt>Parts touched</dt>
      <dd>{b.touched}</dd>
      <dt>Touch bonus</dt>
      <dd>{b.bonus}</dd>
      {result.outcome.kind === 'success' && (
        <>
          <dt>Completion bonus</dt>
          <dd>×{b.multiplier}</dd>
        </>
      )}
    </dl>
  )
}

export function ResultPanel({
  result,
  leaderboard,
  playerName,
  onNameSaved,
  onClose,
  onNext,
  nextName,
}: ResultPanelProps) {
  const success = result.outcome.kind === 'success'
  const [qualifies] = useState(() => success && leaderboard.qualifies(result.sceneId, result.score))
  const [name, setName] = useState(playerName)
  const [rank, setRank] = useState<number | null>(null)
  const valid = isValidName(name)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!valid || rank !== null) return
    const trimmed = name.trim()
    setRank(
      leaderboard.add(result.sceneId, {
        name: trimmed,
        score: result.score,
        runTime: result.runTime,
        contraptionsUsed: result.contraptionsUsed,
        date: new Date().toISOString(),
      }),
    )
    onNameSaved(trimmed)
  }

  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <section className="panel">
        {result.outcome.kind === 'success' ? (
          <>
            <h2 id="result-title">Machine complete!</h2>
            <p className="score">{result.score}</p>
          </>
        ) : (
          <>
            <h2 id="result-title">Not quite…</h2>
            <p>{FAIL_REASON_TEXT[result.outcome.reason]} Only completed machines score.</p>
          </>
        )}
        <Breakdown result={result} />

        {qualifies && rank === null && (
          <form className="name-entry" onSubmit={submit}>
            <label htmlFor="player-name">New high score! Your name</label>
            <div className="row">
              <input
                id="player-name"
                value={name}
                maxLength={8}
                autoFocus
                autoComplete="off"
                onChange={(e) => setName(e.target.value)}
              />
              <button type="submit" disabled={!valid}>
                Save
              </button>
            </div>
            <small className="muted">3–8 letters, numbers, spaces, - or _</small>
          </form>
        )}
        {rank !== null && <LeaderboardTable entries={leaderboard.list(result.sceneId)} highlight={rank} />}

        <div className="actions">
          <button
            type="button"
            className={onNext ? undefined : 'primary'}
            onClick={onClose}
            autoFocus={!qualifies}
          >
            Keep building
          </button>
          {success && onNext && nextName && (
            <button type="button" className="primary" onClick={onNext} data-testid="next-scene">
              Next scene · {nextName}
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
