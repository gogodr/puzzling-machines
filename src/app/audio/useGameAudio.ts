import { useEffect, useState } from 'react'
import type { GameBridge } from '@shared/bridge/bridge'
import type { GameAmbience, GameSfx } from '@shared/bridge/messages'
import { AudioManager } from './AudioManager'

const SFX_FILES: Record<GameSfx, string> = {
  place: 'place',
  rotate: 'rotate',
  remove: 'remove',
  invalid: 'invalid',
  impactWood: 'impact-wood',
  impactMetal: 'impact-metal',
  trampoline: 'trampoline',
  launch: 'launch',
  spinner: 'spinner',
  elevator: 'elevator',
}

const IMPACTS: ReadonlySet<GameSfx> = new Set(['impactWood', 'impactMetal'])
const BUILD: ReadonlySet<GameSfx> = new Set(['place', 'rotate', 'remove', 'invalid'])

const LOOPS: Record<GameAmbience, string> = { conveyor: 'conveyor-loop', fan: 'fan-loop' }

export function musicFor(screen: string, sceneId: string | null) {
  if (screen !== 'play' || !sceneId) return 'music-menu'
  return sceneId === 'sandbox' ? 'music-first-steps' : `music-${sceneId}`
}

export function useGameAudio({
  bridge,
  enabled,
  music,
  ducked,
}: {
  bridge: GameBridge
  enabled: boolean
  music: string
  ducked: boolean
}) {
  const [audio] = useState(() => new AudioManager(`${import.meta.env.BASE_URL}audio/`))

  useEffect(() => {
    const unlock = () => audio.unlock()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    const click = (e: MouseEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('button')) audio.play('ui-click', { gain: 0.6 })
    }
    window.addEventListener('click', click, true)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
      window.removeEventListener('click', click, true)
    }
  }, [audio])

  useEffect(() => audio.setEnabled(enabled), [audio, enabled])
  useEffect(() => audio.setMusic(music), [audio, music])
  useEffect(() => audio.duck(ducked), [audio, ducked])

  useEffect(() => {
    return bridge.toApp.subscribe((message) => {
      switch (message.type) {
        case 'modeChanged':
          if (message.mode === 'running') audio.play('run', { gain: 0.7 })
          if (message.mode !== 'result') {
            for (const [name, file] of Object.entries(LOOPS) as [GameAmbience, string][]) {
              audio.loop(file, message.ambience.includes(name))
            }
          }
          break
        case 'runEnded':
          audio.play(message.result.outcome.kind === 'success' ? 'success' : 'fail')
          break
        case 'sfx': {
          const i = Math.max(0, Math.min(1, message.intensity))
          const impact = IMPACTS.has(message.name)
          audio.play(SFX_FILES[message.name], {
            gain: impact ? 0.35 + 0.65 * i : BUILD.has(message.name) ? 0.7 : 0.85,
            rate: impact ? 0.85 + 0.45 * i : 1,
            minGap: impact ? 0.06 : 0.1,
          })
          break
        }
      }
    })
  }, [audio, bridge])

  return audio
}
