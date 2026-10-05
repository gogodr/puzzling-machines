/** Unlock and next-scene rules. Persistence lives in the app; this module is framework-free. */

export interface CatalogItem {
  id: string
}

/** The first catalogue scene is always open; each later one needs the previous completion. */
export function isSceneUnlocked(
  sceneId: string,
  completed: readonly string[],
  catalog: readonly CatalogItem[],
  unlockAll = false,
) {
  if (unlockAll) return true
  const index = catalog.findIndex((s) => s.id === sceneId)
  if (index <= 0) return true
  return completed.includes(catalog[index - 1]!.id)
}

export function nextSceneId(sceneId: string, catalog: readonly CatalogItem[]) {
  const index = catalog.findIndex((s) => s.id === sceneId)
  if (index < 0 || index >= catalog.length - 1) return null
  return catalog[index + 1]!.id
}
