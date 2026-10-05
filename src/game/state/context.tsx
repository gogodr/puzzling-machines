import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { GameState, GameStore } from './gameStore'

export const GameStoreContext = createContext<GameStore | null>(null)

export function useGameStore(): GameStore {
  const store = useContext(GameStoreContext)
  if (!store) throw new Error('useGameStore must be used inside GameStoreContext')
  return store
}

export function useGame<T>(selector: (state: GameState) => T): T {
  return useStore(useGameStore(), selector)
}
