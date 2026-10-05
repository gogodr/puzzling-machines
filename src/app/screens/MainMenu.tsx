import { STR } from '../strings'

export function MainMenu({
  onPlay,
  onLeaderboards,
  onSettings,
  onCredits,
}: {
  onPlay(): void
  onLeaderboards(): void
  onSettings(): void
  onCredits(): void
}) {
  return (
    <div className="overlay overlay--menu" role="dialog" aria-labelledby="menu-title">
      <section className="panel panel--menu">
        <h1 id="menu-title">{STR.title}</h1>
        <p className="muted">{STR.tagline}</p>
        <div className="menu-actions">
          <button type="button" className="primary" onClick={onPlay} autoFocus data-testid="menu-play">
            {STR.play}
          </button>
          <button type="button" onClick={onLeaderboards}>
            {STR.leaderboards}
          </button>
          <button type="button" onClick={onSettings}>
            {STR.settings}
          </button>
          <button type="button" onClick={onCredits}>
            {STR.credits}
          </button>
        </div>
      </section>
    </div>
  )
}
