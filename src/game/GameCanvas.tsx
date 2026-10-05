import { useState, type ReactNode } from 'react'
import { Canvas } from '@react-three/fiber'
import type { GameBridge } from '@shared/bridge/bridge'
import { GameRoot } from './GameRoot'
import { PALETTE } from './render/palette'
import { GameStoreContext } from './state/context'
import { createGameStore } from './state/gameStore'

export interface GameCanvasProps {
  /** The only channel between the app and the game (PLAN D2). */
  bridge: GameBridge
  /** Extra R3F nodes from the host, e.g. dev-only stats. */
  children?: ReactNode
}

/** DOM-free game root (PLAN D2): everything inside must also run in a worker. */
export function GameCanvas({ bridge, children }: GameCanvasProps) {
  const [store] = useState(createGameStore)
  return (
    <Canvas orthographic flat dpr={[1, 2]} camera={{ position: [0, 0, 100], near: 0.1, far: 1000, zoom: 50 }}>
      <color attach="background" args={[PALETTE.background]} />
      <GameStoreContext value={store}>
        <GameRoot bridge={bridge} />
      </GameStoreContext>
      {children}
    </Canvas>
  )
}
