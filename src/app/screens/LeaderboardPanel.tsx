import type { LeaderboardRepository } from '../storage/leaderboard'
import { LeaderboardTable } from './LeaderboardTable'

export function LeaderboardPanel({
  sceneId,
  sceneName,
  leaderboard,
  onClose,
}: {
  sceneId: string
  sceneName: string
  leaderboard: LeaderboardRepository
  onClose(): void
}) {
  return (
    <div className="overlay" role="dialog" aria-modal="true" aria-labelledby="board-title" onClick={onClose}>
      <section className="panel" onClick={(e) => e.stopPropagation()}>
        <h2 id="board-title">{sceneName} · Top 10</h2>
        <LeaderboardTable entries={leaderboard.list(sceneId)} />
        <div className="actions">
          <button type="button" className="primary" onClick={onClose} autoFocus>
            Close
          </button>
        </div>
      </section>
    </div>
  )
}
