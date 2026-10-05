import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Stats } from '@react-three/drei'
import { GameCanvas } from '@game/GameCanvas'
import { createLocalBridge } from '@shared/bridge/bridge'
import type { GameMode } from '@shared/bridge/messages'
import type { Layout } from '@shared/layout'
import { isSceneUnlocked, nextSceneId } from '@shared/progress'
import type { RunResult } from '@shared/run'
import { DEV_SCENE_CATALOG, SCENE_CATALOG, type CatalogEntry } from '@shared/scenes'
import { musicFor, useGameAudio } from './audio/useGameAudio'
import { Credits } from './screens/Credits'
import { LeaderboardPanel } from './screens/LeaderboardPanel'
import { MainMenu } from './screens/MainMenu'
import { OnboardingHints } from './screens/OnboardingHints'
import { ResultPanel } from './screens/ResultPanel'
import { SceneSelect } from './screens/SceneSelect'
import { SettingsPanel } from './screens/SettingsPanel'
import { LocalLeaderboardRepository } from './storage/leaderboard'
import {
  loadProgress,
  markOnboardingDone,
  markSceneComplete,
  resetProgress,
  type Progress,
} from './storage/progress'
import { clearLayouts, loadLayout, loadPlayerName, savePlayerName, saveLayout } from './storage/profile'
import { loadSettings, saveSettings, type Settings } from './storage/settings'
import { STR } from './strings'

type Screen = 'menu' | 'scenes' | 'leaderboards' | 'settings' | 'credits' | 'play'

/** Keys the game handles; the page must not scroll or navigate on them. */
const GAME_KEYS = new Set([' ', 'Backspace', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])

interface TrayFocus {
  index: number | null
  count: number
  label: string | null
}

const KEY_ART = { '--key-art': `url(${import.meta.env.BASE_URL}assets/key-art.webp)` } as CSSProperties

function catalog(includeDev: boolean): CatalogEntry[] {
  return includeDev ? [...SCENE_CATALOG, ...DEV_SCENE_CATALOG] : [...SCENE_CATALOG]
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function App() {
  const [bridge] = useState(createLocalBridge)
  const [leaderboard] = useState(() => new LocalLeaderboardRepository(localStorage))
  const [scene, setScene] = useState<{ id: string; name: string } | null>(null)
  const [mode, setMode] = useState<GameMode>('build')
  const [result, setResult] = useState<RunResult | null>(null)
  const [boardScene, setBoardScene] = useState<{ id: string; name: string } | null>(null)
  const [debug, setDebug] = useState(false)
  const [playerName, setPlayerName] = useState(() => loadPlayerName(localStorage))
  const [layout, setLayout] = useState<Layout>([])
  const [screen, setScreen] = useState<Screen>('menu')
  const [progress, setProgress] = useState<Progress>(() => loadProgress(localStorage))
  const [settings, setSettings] = useState<Settings>(() => loadSettings(localStorage, prefersReducedMotion()))
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [ready, setReady] = useState(false)
  const [tray, setTray] = useState<TrayFocus>({ index: null, count: 0, label: null })
  const trayRef = useRef(tray)
  const boardRef = useRef<HTMLDivElement>(null)
  const overlayOpen = result !== null || boardScene !== null || screen !== 'play'
  const scenes = catalog(import.meta.env.DEV)
  const playing = screen === 'play' && scene !== null
  const audio = useGameAudio({
    bridge,
    enabled: settings.sound,
    music: musicFor(screen, scene?.id ?? null),
    ducked: result !== null,
  })

  const pushSettings = (next: Settings) => {
    setSettings(next)
    saveSettings(localStorage, next)
  }

  const openScene = (sceneId: string) => {
    bridge.toGame.post({ type: 'loadScene', sceneId, layout: loadLayout(localStorage, sceneId) })
    setResult(null)
    setScreen('play')
    setOnboardingStep(0)
  }

  useEffect(
    () =>
      bridge.toApp.subscribe((message) => {
        switch (message.type) {
          case 'ready':
            setReady(true)
            break
          case 'sceneLoaded':
            setScene({ id: message.sceneId, name: message.sceneName })
            break
          case 'layoutChanged':
            setLayout(message.layout)
            saveLayout(localStorage, message.sceneId, message.layout)
            break
          case 'modeChanged':
            setMode(message.mode)
            if (message.mode !== 'result') setResult(null)
            break
          case 'runEnded':
            setResult(message.result)
            if (message.result.outcome.kind === 'success') {
              const before = loadProgress(localStorage).completed
              const after = markSceneComplete(localStorage, message.result.sceneId)
              setProgress(after)
              const next = nextSceneId(message.result.sceneId, SCENE_CATALOG)
              const unlocked =
                next !== null &&
                !isSceneUnlocked(next, before, SCENE_CATALOG) &&
                isSceneUnlocked(next, after.completed, SCENE_CATALOG)
              if (unlocked) window.setTimeout(() => audio.play('unlock'), 1400)
            }
            break
          case 'requestExit':
            setScreen('menu')
            setResult(null)
            break
          case 'trayFocus': {
            const next = { index: message.index, count: message.count, label: message.label }
            trayRef.current = next
            setTray(next)
            break
          }
        }
      }),
    [bridge, audio],
  )

  useEffect(() => {
    if (!ready) return
    bridge.toGame.post({
      type: 'setSettings',
      settings: { cameraFollow: settings.cameraFollow, reducedMotion: settings.reducedMotion },
    })
  }, [bridge, ready, settings.cameraFollow, settings.reducedMotion])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || overlayOpen) return
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return
      if (event.key === 'Tab') {
        // Tab walks the tray only while the board has focus; past either end focus moves on as usual.
        if (event.target !== boardRef.current) return
        const { index, count } = trayRef.current
        const leaving = index !== null && (event.shiftKey ? index === 0 : index === count - 1)
        if (leaving) return
        event.preventDefault()
      }
      if (event.key === '`') {
        bridge.toGame.post({ type: 'setDebug', enabled: !debug })
        setDebug(!debug)
        return
      }
      if (GAME_KEYS.has(event.key)) event.preventDefault()
      bridge.toGame.post({ type: 'key', key: event.key, shiftKey: event.shiftKey })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [bridge, overlayOpen, debug])

  const backToBuild = () => bridge.toGame.post({ type: 'backToBuild' })
  const nextId = scene ? nextSceneId(scene.id, SCENE_CATALOG) : null
  const nextEntry = SCENE_CATALOG.find((s) => s.id === nextId)
  const nextUnlocked =
    nextId !== null && isSceneUnlocked(nextId, progress.completed, SCENE_CATALOG, settings.unlockAll)

  const showOnboarding =
    playing && scene?.id === 'first-steps' && !progress.onboardingDone && mode === 'build' && !result

  return (
    <main className="app" style={KEY_ART}>
      <div
        ref={boardRef}
        className="board"
        tabIndex={playing ? 0 : -1}
        role="application"
        aria-label={STR.boardLabel}
        aria-describedby="board-help"
        onFocus={(e) => {
          // Only keyboard focus shows the tray cursor; a click on the canvas also focuses the board.
          if (e.target !== e.currentTarget || !e.currentTarget.matches(':focus-visible')) return
          // Arriving with Shift+Tab from a later element starts on the last tray slot.
          const from = e.relatedTarget
          const fromEnd =
            from instanceof Node &&
            (e.currentTarget.compareDocumentPosition(from) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0
          bridge.toGame.post({ type: 'boardFocus', focused: true, fromEnd })
        }}
        onBlur={(e) => {
          if (e.target === e.currentTarget)
            bridge.toGame.post({ type: 'boardFocus', focused: false, fromEnd: false })
        }}
      >
        <GameCanvas bridge={bridge}>{import.meta.env.DEV && debug && <Stats />}</GameCanvas>
      </div>
      <p id="board-help" className="sr-only">
        {STR.boardHelp}
      </p>
      <p className="sr-only" aria-live="polite">
        {playing && tray.label ? tray.label : ''}
      </p>

      {playing && (
        <header className="app__header">
          <h1>
            {STR.title} {scene && <span className="muted">· {scene.name}</span>}
          </h1>
          <p className="app__hint">
            {mode === 'build' ? (
              <>
                Drag or <kbd>Tab</kbd>+<kbd>Enter</kbd> parts · <kbd>←↑↓→</kbd> move · <kbd>R</kbd>/
                <kbd>Shift</kbd>+<kbd>R</kbd> rotate · <kbd>F</kbd> flip · <kbd>Del</kbd> remove ·{' '}
                <kbd>Space</kbd> run
              </>
            ) : (
              <>
                <kbd>Space</kbd> back to building
              </>
            )}
          </p>
          <div className="app__actions">
            {import.meta.env.DEV && scene && (
              <>
                <select aria-label="Scene" value={scene.id} onChange={(e) => openScene(e.target.value)}>
                  {scenes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(JSON.stringify(layout, null, 2))}
                >
                  Copy layout
                </button>
              </>
            )}
            <button type="button" onClick={() => scene && setBoardScene(scene)}>
              {STR.leaderboards}
            </button>
            <button type="button" onClick={() => setScreen('menu')}>
              {STR.menu}
            </button>
          </div>
        </header>
      )}

      {showOnboarding && (
        <OnboardingHints
          step={onboardingStep}
          onNext={() => {
            if (onboardingStep + 1 >= STR.onboarding.length) {
              setProgress(markOnboardingDone(localStorage))
            } else {
              setOnboardingStep(onboardingStep + 1)
            }
          }}
        />
      )}

      {screen === 'menu' && (
        <MainMenu
          onPlay={() => setScreen('scenes')}
          onLeaderboards={() => setScreen('leaderboards')}
          onSettings={() => setScreen('settings')}
          onCredits={() => setScreen('credits')}
        />
      )}
      {screen === 'scenes' && (
        <SceneSelect
          scenes={scenes}
          completed={progress.completed}
          unlockAll={settings.unlockAll}
          leaderboard={leaderboard}
          onPlay={openScene}
          onLocked={() => audio.play('ui-locked')}
          onBoard={(id) => {
            const entry = scenes.find((s) => s.id === id)
            if (entry) setBoardScene({ id: entry.id, name: entry.name })
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'leaderboards' && (
        <SceneSelect
          scenes={scenes}
          completed={progress.completed}
          unlockAll
          boardsOnly
          leaderboard={leaderboard}
          onPlay={() => undefined}
          onBoard={(id) => {
            const entry = scenes.find((s) => s.id === id)
            if (entry) setBoardScene({ id: entry.id, name: entry.name })
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'settings' && (
        <SettingsPanel
          settings={settings}
          showUnlockAll={import.meta.env.DEV}
          onChange={pushSettings}
          onReset={() => {
            clearLayouts(localStorage)
            setProgress(resetProgress(localStorage))
          }}
          onBack={() => setScreen('menu')}
        />
      )}
      {screen === 'credits' && <Credits onBack={() => setScreen('menu')} />}

      {result && playing && (
        <ResultPanel
          key={`${result.sceneId}-${result.runTime}-${result.score}`}
          result={result}
          leaderboard={leaderboard}
          playerName={playerName}
          onNameSaved={(name) => {
            setPlayerName(name)
            savePlayerName(localStorage, name)
            audio.play('highscore')
          }}
          onClose={backToBuild}
          onNext={nextUnlocked && nextId ? () => openScene(nextId) : undefined}
          nextName={nextEntry?.name}
        />
      )}
      {boardScene && (
        <LeaderboardPanel
          sceneId={boardScene.id}
          sceneName={boardScene.name}
          leaderboard={leaderboard}
          onClose={() => setBoardScene(null)}
        />
      )}
      {!ready && <p className="sr-only">Loading the workshop…</p>}
    </main>
  )
}
