import { z } from 'zod'
import { readJson, writeJson, type KeyValueStore } from './storage'

const KEY = 'pm.progress.v1'

const progressSchema = z.object({
  completed: z.array(z.string()),
  onboardingDone: z.boolean(),
})
export type Progress = z.infer<typeof progressSchema>

const EMPTY: Progress = { completed: [], onboardingDone: false }

export function loadProgress(store: KeyValueStore): Progress {
  return readJson(store, KEY, progressSchema, EMPTY)
}

export function markSceneComplete(store: KeyValueStore, sceneId: string): Progress {
  const current = loadProgress(store)
  if (current.completed.includes(sceneId)) return current
  const next = { ...current, completed: [...current.completed, sceneId] }
  writeJson(store, KEY, next)
  return next
}

export function markOnboardingDone(store: KeyValueStore): Progress {
  const next = { ...loadProgress(store), onboardingDone: true }
  writeJson(store, KEY, next)
  return next
}

export function resetProgress(store: KeyValueStore): Progress {
  writeJson(store, KEY, EMPTY)
  return EMPTY
}
