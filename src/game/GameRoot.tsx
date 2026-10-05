import { Suspense, useEffect } from 'react'
import { Physics } from '@react-three/rapier'
import type { GameBridge } from '@shared/bridge/bridge'
import type { AppToGame, GameAmbience } from '@shared/bridge/messages'
import { HintGhost } from './build/HintGhost'
import { DragGhost, PlacedItems } from './build/PlacedItems'
import { Gizmo } from './build/Gizmo'
import { GRAVITY, SOLVER, TIME_STEP } from './engine/determinism'
import { ArtBoundary } from './render/ArtBoundary'
import { preloadAtlas } from './render/atlas'
import { Backdrop } from './render/Backdrop'
import { BallFx } from './render/BallFx'
import { BallView } from './render/BallView'
import { FitCamera } from './render/FitCamera'
import { OutcomeFx } from './render/OutcomeFx'
import { SceneStatics } from './render/SceneStatics'
import { backdropUrl } from './render/themes'
import { findScene } from './scenes/registry'
import { SimulationRunner } from './sim/SimulationRunner'
import { useGame, useGameStore } from './state/context'
import { remaining, type GameState, type GameStore } from './state/gameStore'
import { CONTRAPTIONS } from './contraptions/registry'
import { handleKey } from './ui/controls'
import { InteractionPlane } from './ui/InteractionPlane'
import { CAMERA_PADDING, frameBounds } from './ui/layout'
import { Tray } from './ui/Tray'

preloadAtlas()

function handleMessage(store: GameStore, bridge: GameBridge, message: AppToGame) {
  const s = store.getState()
  switch (message.type) {
    case 'loadScene': {
      const scene = findScene(message.sceneId)
      if (!scene) throw new Error(`Unknown scene: ${message.sceneId}`)
      s.loadScene(scene, message.layout)
      bridge.toApp.post({ type: 'sceneLoaded', sceneId: scene.id, sceneName: scene.name })
      break
    }
    case 'backToBuild':
      s.backToBuild()
      break
    case 'key':
      handleKey(store, message.key, message.shiftKey)
      break
    case 'setDebug':
      s.setDebug(message.enabled)
      break
    case 'setSettings':
      s.setSettings(message.settings)
      break
    case 'boardFocus':
      if (!message.focused) s.setTrayCursor(null)
      else if (s.scene && s.mode === 'build')
        s.setTrayCursor(message.fromEnd ? s.scene.inventory.length - 1 : 0)
      break
  }
}

function trayFocus(s: GameState) {
  const count = s.scene?.inventory.length ?? 0
  const entry = s.trayCursor === null ? undefined : s.scene?.inventory[s.trayCursor]
  if (!entry || s.trayCursor === null) return { index: null, count, label: null }
  const left = remaining(s, entry.type)
  const amount = Number.isFinite(left) ? `${left} left` : 'unlimited'
  return { index: s.trayCursor, count, label: `${CONTRAPTIONS[entry.type].name}, ${amount}` }
}

const AMBIENCE: readonly GameAmbience[] = ['conveyor', 'fan']

function ambience(s: GameState): GameAmbience[] {
  if (s.mode !== 'running' || !s.scene) return []
  const parts = [...s.scene.fixed, ...s.layout]
  return AMBIENCE.filter((type) => parts.some((p) => p.type === type))
}

function useBridge(bridge: GameBridge) {
  const store = useGameStore()

  useEffect(() => {
    const unsubscribeStore = store.subscribe((s, prev) => {
      if (s.scene && s.layout !== prev.layout) {
        bridge.toApp.post({ type: 'layoutChanged', sceneId: s.scene.id, layout: s.layout })
      }
      if (s.scene && s.mode !== prev.mode) {
        bridge.toApp.post({ type: 'modeChanged', sceneId: s.scene.id, mode: s.mode, ambience: ambience(s) })
      }
      if (s.result && s.result !== prev.result) bridge.toApp.post({ type: 'runEnded', result: s.result })
      if (s.sfx && s.sfx !== prev.sfx) {
        bridge.toApp.post({ type: 'sfx', name: s.sfx.name, intensity: s.sfx.intensity })
      }
      if (s.trayCursor !== prev.trayCursor || (s.trayCursor !== null && s.layout !== prev.layout)) {
        bridge.toApp.post({ type: 'trayFocus', ...trayFocus(s) })
      }
    })
    const unsubscribeBridge = bridge.toGame.subscribe((message) => handleMessage(store, bridge, message))
    bridge.toApp.post({ type: 'ready' })
    return () => {
      unsubscribeBridge()
      unsubscribeStore()
    }
  }, [store, bridge])
}

export function GameRoot({ bridge }: { bridge: GameBridge }) {
  useBridge(bridge)
  const scene = useGame((s) => s.scene)
  const mode = useGame((s) => s.mode)
  const runId = useGame((s) => s.runId)
  const debug = useGame((s) => s.debug)
  if (!scene) return null

  const bounds = frameBounds(scene)

  return (
    <>
      <FitCamera bounds={bounds} padding={CAMERA_PADDING} />
      <InteractionPlane />
      <ArtBoundary key={scene.id}>
        <Backdrop
          url={backdropUrl(scene.backdrop ?? scene.id)}
          center={[(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2]}
        />
      </ArtBoundary>
      <ArtBoundary>
        <SceneStatics scene={scene} />
        <PlacedItems />
        <DragGhost />
        <BallView />
        <BallFx />
        <OutcomeFx />
        <HintGhost />
      </ArtBoundary>
      <Gizmo />
      <Tray scene={scene} />
      <Suspense fallback={null}>
        {/* A fresh world per run; paused (not unmounted) in build mode so Rapier stays loaded. */}
        <Physics
          key={runId}
          timeStep={TIME_STEP}
          gravity={[...GRAVITY]}
          {...SOLVER}
          interpolate={false}
          colliders={false}
          paused={mode === 'build'}
          debug={debug}
        >
          {mode !== 'build' && <SimulationRunner />}
        </Physics>
      </Suspense>
    </>
  )
}
