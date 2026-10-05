/** Per-scene look: the backdrop image plus colours for static geometry drawn on top of it. */
export interface Theme {
  static: string
  staticEdge: string
  buildZone: string
  goal: string
}

export const THEMES = {
  workshop: { static: '#8c5a3c', staticEdge: '#3b2418', buildZone: '#fff8ec', goal: '#52b788' },
  attic: { static: '#6b5b73', staticEdge: '#2c2235', buildZone: '#f3eefa', goal: '#52b788' },
  rooftops: { static: '#9c4f3d', staticEdge: '#3e1f18', buildZone: '#fff3e6', goal: '#2a9d8f' },
  clocktower: { static: '#7a6040', staticEdge: '#2e2416', buildZone: '#fdf3df', goal: '#e9c46a' },
  factory: { static: '#4f6d7a', staticEdge: '#1d2a30', buildZone: '#eef5f8', goal: '#f4a261' },
} as const satisfies Record<string, Theme>

export type ThemeName = keyof typeof THEMES

export function backdropUrl(sceneId: string) {
  return `${import.meta.env.BASE_URL}assets/bg/${sceneId}.webp`
}
