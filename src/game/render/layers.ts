/** Z offsets for visual layering. Physics always lives on z = 0; only meshes use these. */
export const Z_LAYER = {
  backdrop: -4,
  background: -3,
  decoration: -2,
  static: -1,
  contraption: 0,
  ball: 0.1,
  fx: 0.2,
  hud: 1,
} as const
