import type { z } from 'zod'

/** The subset of the Web Storage API we use; tests pass an in-memory implementation. */
export interface KeyValueStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Parses and validates a stored value; anything missing, corrupt or outdated yields the fallback. */
export function readJson<T>(store: KeyValueStore, key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const raw = store.getItem(key)
    if (raw === null) return fallback
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : fallback
  } catch {
    return fallback
  }
}

/** Best effort: storage can be full or disabled (private mode); the game must keep working. */
export function writeJson(store: KeyValueStore, key: string, value: unknown) {
  try {
    store.setItem(key, JSON.stringify(value))
  } catch {
    // Ignored on purpose; see above.
  }
}

export function createMemoryStore(): KeyValueStore {
  const data = new Map<string, string>()
  return {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  }
}
