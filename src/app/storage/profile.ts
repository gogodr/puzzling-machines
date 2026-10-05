import { z } from 'zod'
import { layoutSchema, type Layout } from '@shared/layout'
import { readJson, writeJson, type KeyValueStore } from './storage'

const LAYOUTS_KEY = 'pm.layouts.v1'
const PLAYER_KEY = 'pm.player.v1'

const layoutsSchema = z.record(z.string(), layoutSchema)
const playerSchema = z.object({ name: z.string() })

export function loadLayout(store: KeyValueStore, sceneId: string): Layout {
  return readJson(store, LAYOUTS_KEY, layoutsSchema, {})[sceneId] ?? []
}

export function saveLayout(store: KeyValueStore, sceneId: string, layout: Layout) {
  const all = readJson(store, LAYOUTS_KEY, layoutsSchema, {})
  writeJson(store, LAYOUTS_KEY, { ...all, [sceneId]: layout })
}

export function loadPlayerName(store: KeyValueStore) {
  return readJson(store, PLAYER_KEY, playerSchema, { name: '' }).name
}

export function savePlayerName(store: KeyValueStore, name: string) {
  writeJson(store, PLAYER_KEY, { name })
}

export function clearLayouts(store: KeyValueStore) {
  writeJson(store, LAYOUTS_KEY, {})
}
