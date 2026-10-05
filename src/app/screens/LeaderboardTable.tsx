import type { LeaderboardEntry } from '../storage/leaderboard'

export function LeaderboardTable({
  entries,
  highlight = -1,
}: {
  entries: LeaderboardEntry[]
  highlight?: number
}) {
  if (entries.length === 0) return <p className="muted">No scores yet. Be the first!</p>
  return (
    <table className="board">
      <thead>
        <tr>
          <th>#</th>
          <th>Name</th>
          <th className="num">Score</th>
          <th className="num">Time</th>
          <th className="num">Parts</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e, i) => (
          <tr key={`${e.date}-${i}`} className={i === highlight ? 'board__mine' : undefined}>
            <td>{i + 1}</td>
            <td>{e.name}</td>
            <td className="num">{e.score}</td>
            <td className="num">{e.runTime.toFixed(1)} s</td>
            <td className="num">{e.contraptionsUsed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
