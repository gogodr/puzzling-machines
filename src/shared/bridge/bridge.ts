import type { AppToGame, GameToApp } from './messages'

type Listener<T> = (message: T) => void

export interface Channel<T> {
  post(message: T): void
  subscribe(listener: Listener<T>): () => void
}

export interface GameBridge {
  toGame: Channel<AppToGame>
  toApp: Channel<GameToApp>
}

function createChannel<T>(): Channel<T> {
  const listeners = new Set<Listener<T>>()
  return {
    post(message) {
      for (const listener of [...listeners]) listener(message)
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}

/** Same-thread transport. A postMessage transport with the same interface replaces it in worker mode. */
export function createLocalBridge(): GameBridge {
  return { toGame: createChannel<AppToGame>(), toApp: createChannel<GameToApp>() }
}
