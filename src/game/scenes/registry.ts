import { firstSteps } from './01-first-steps'
import { upTheWall } from './02-up-the-wall'
import { theGap } from './03-the-gap'
import { clockwork } from './04-clockwork'
import { grandFinale } from './05-grand-finale'
import { sandbox } from './sandbox'
import type { SceneDefinition } from './schema'

export const SCENES: readonly SceneDefinition[] = [
  firstSteps,
  upTheWall,
  theGap,
  clockwork,
  grandFinale,
  sandbox,
]

export function findScene(id: string) {
  return SCENES.find((s) => s.id === id)
}
