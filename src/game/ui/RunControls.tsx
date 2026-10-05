import { useRef, useState } from 'react'
import { Text } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { PALETTE } from '../render/palette'
import { useGame, useGameStore } from '../state/context'
import { toggleRun } from './controls'
import { RUN_BUTTON_SIZE } from './layout'

const READOUT_INTERVAL = 0.1
const PADDING = 0.25

const BUTTON = {
  build: { label: 'RUN', color: PALETTE.run },
  running: { label: 'STOP', color: PALETTE.stop },
  result: { label: 'EDIT', color: PALETTE.edit },
} as const

/** Live score and run time, refreshed at ~10 Hz rather than every frame. */
function Readout({ x }: { x: number }) {
  const store = useGameStore()
  const [text, setText] = useState({ score: '—', time: '' })
  const sinceUpdate = useRef(READOUT_INTERVAL)

  useFrame((_, delta) => {
    sinceUpdate.current += delta
    if (sinceUpdate.current < READOUT_INTERVAL) return
    sinceUpdate.current = 0
    const { simulation, result } = store.getState()
    const score = result ? String(result.score) : simulation ? String(simulation.score.live) : '—'
    const runTime = result?.runTime ?? simulation?.runTime
    const time = runTime === undefined ? '' : `${runTime.toFixed(1)} s`
    if (score !== text.score || time !== text.time) setText({ score, time })
  })

  return (
    <group position={[x, 0, 0.05]}>
      <Text position={[0, 0.2, 0]} fontSize={0.42} color={PALETTE.trayText} anchorX="right" anchorY="middle">
        {`Score ${text.score}`}
      </Text>
      <Text
        position={[0, -0.3, 0]}
        fontSize={0.28}
        color={PALETTE.trayText}
        anchorX="right"
        anchorY="middle"
        fillOpacity={0.7}
      >
        {text.time}
      </Text>
    </group>
  )
}

export function RunControls({ x }: { x: number }) {
  const store = useGameStore()
  const mode = useGame((s) => s.mode)
  const dragging = useGame((s) => s.drag !== null)
  const button = BUTTON[mode]
  const [w, h] = RUN_BUTTON_SIZE
  const buttonX = x - PADDING - w / 2

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!dragging) toggleRun(store)
  }

  return (
    <group>
      <group position={[buttonX, 0, 0]}>
        <mesh onPointerDown={onPointerDown}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial color={button.color} />
        </mesh>
        <Text position={[0, 0, 0.05]} fontSize={0.45} color="#ffffff" anchorX="center" anchorY="middle">
          {button.label}
        </Text>
      </group>
      <Readout x={buttonX - w / 2 - PADDING} />
    </group>
  )
}
