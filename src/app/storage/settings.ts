import { z } from 'zod'
import { readJson, writeJson, type KeyValueStore } from './storage'

const KEY = 'pm.settings.v1'

export const settingsSchema = z.object({
  sound: z.boolean(),
  reducedMotion: z.boolean(),
  cameraFollow: z.boolean(),
  unlockAll: z.boolean(),
})
export type Settings = z.infer<typeof settingsSchema>

export const DEFAULT_SETTINGS: Settings = {
  sound: true,
  reducedMotion: false,
  cameraFollow: false,
  unlockAll: false,
}

export function loadSettings(store: KeyValueStore, prefersReducedMotion = false): Settings {
  if (store.getItem(KEY) === null) {
    return { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion }
  }
  return readJson(store, KEY, settingsSchema, { ...DEFAULT_SETTINGS, reducedMotion: prefersReducedMotion })
}

export function saveSettings(store: KeyValueStore, settings: Settings) {
  writeJson(store, KEY, settings)
}
