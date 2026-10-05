/** Scene catalogue shared with the app (menus, leaderboard keys). The game registry must match it. */
export const SCENE_CATALOG = [
  { id: 'first-steps', name: 'First Steps', blurb: 'Learn the loop. Carry the ball into the cup.' },
  { id: 'up-the-wall', name: 'Up the Wall', blurb: 'The goal is above you. Lift the ball.' },
  { id: 'the-gap', name: 'The Gap', blurb: 'Two rooftops. Launch across the hole.' },
  { id: 'clockwork', name: 'Clockwork', blurb: 'The ball will not move. Time the swing.' },
  { id: 'grand-finale', name: 'Grand Finale', blurb: 'The whole factory. Pick your route.' },
] as const

/** Extra scenes offered only in development (sandbox). */
export const DEV_SCENE_CATALOG = [
  { id: 'sandbox', name: 'Sandbox', blurb: 'Every contraption, unlimited.' },
] as const

export type SceneId = (typeof SCENE_CATALOG)[number]['id']
export type CatalogEntry = (typeof SCENE_CATALOG)[number] | (typeof DEV_SCENE_CATALOG)[number]
