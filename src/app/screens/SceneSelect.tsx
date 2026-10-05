import type { CSSProperties } from 'react'
import { isSceneUnlocked } from '@shared/progress'
import type { CatalogEntry } from '@shared/scenes'
import { SCENE_CATALOG } from '@shared/scenes'
import type { LeaderboardRepository } from '../storage/leaderboard'
import { STR } from '../strings'

function thumbStyle(sceneId: string) {
  return { '--thumb': `url(${import.meta.env.BASE_URL}assets/bg/${sceneId}-thumb.webp)` } as CSSProperties
}

export function SceneSelect({
  scenes,
  completed,
  unlockAll,
  leaderboard,
  onPlay,
  onBoard,
  onBack,
  onLocked,
  boardsOnly = false,
}: {
  scenes: readonly CatalogEntry[]
  completed: readonly string[]
  unlockAll: boolean
  leaderboard: LeaderboardRepository
  onPlay(sceneId: string): void
  onBoard(sceneId: string): void
  onBack(): void
  onLocked?: () => void
  boardsOnly?: boolean
}) {
  return (
    <div className="overlay overlay--menu" role="dialog" aria-labelledby="scenes-title">
      <section className="panel panel--wide">
        <h2 id="scenes-title">{boardsOnly ? STR.leaderboards : STR.scenes}</h2>
        <ul className="scene-grid">
          {scenes.map((scene) => {
            const unlocked = boardsOnly || isSceneUnlocked(scene.id, completed, SCENE_CATALOG, unlockAll)
            const best = leaderboard.list(scene.id)[0]
            const done = completed.includes(scene.id)
            return (
              <li key={scene.id} className="scene-card">
                <div className={`thumb thumb--${scene.id}`} style={thumbStyle(scene.id)} aria-hidden="true">
                  {!unlocked && <span className="thumb__lock">🔒</span>}
                </div>
                <h3>{scene.name}</h3>
                <p className="muted">{scene.blurb}</p>
                <p className="scene-card__meta">
                  {done ? STR.complete : null}
                  {best ? (
                    <span>
                      {STR.best} {best.score}
                    </span>
                  ) : (
                    <span className="muted">{STR.best} —</span>
                  )}
                </p>
                <div className="row">
                  {boardsOnly ? (
                    <button
                      type="button"
                      className="primary"
                      data-testid={`board-${scene.id}`}
                      onClick={() => onBoard(scene.id)}
                    >
                      {STR.viewBoard}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={unlocked ? 'primary' : 'locked'}
                        aria-disabled={!unlocked}
                        data-testid={`play-${scene.id}`}
                        onClick={() => (unlocked ? onPlay(scene.id) : onLocked?.())}
                      >
                        {unlocked ? STR.play : STR.locked}
                      </button>
                      <button
                        type="button"
                        data-testid={`board-${scene.id}`}
                        onClick={() => onBoard(scene.id)}
                      >
                        {STR.viewBoard}
                      </button>
                    </>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
        <div className="actions">
          <button type="button" onClick={onBack} autoFocus>
            {STR.back}
          </button>
        </div>
      </section>
    </div>
  )
}
