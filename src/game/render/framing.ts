export interface Bounds2D {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface OrthoFraming {
  /** Pixels per world unit. */
  zoom: number
  center: [x: number, y: number]
}

/** Fits a world rectangle (plus padding in world units) inside a viewport of any aspect ratio. */
export function computeOrthoFraming(
  bounds: Bounds2D,
  viewport: { width: number; height: number },
  padding = 0,
): OrthoFraming {
  const width = bounds.maxX - bounds.minX + padding * 2
  const height = bounds.maxY - bounds.minY + padding * 2
  return {
    zoom: Math.min(viewport.width / width, viewport.height / height),
    center: [(bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2],
  }
}
