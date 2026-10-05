import { z } from 'zod'
import { contraptionTypeSchema, layoutSchema, vec2Schema } from '@shared/layout'

const positiveVec2 = z.tuple([z.number().positive(), z.number().positive()])

export const rectSchema = z
  .object({ minX: z.number(), minY: z.number(), maxX: z.number(), maxY: z.number() })
  .refine((r) => r.minX < r.maxX && r.minY < r.maxY, 'rect min must be below max')
export type Rect = z.infer<typeof rectSchema>

export const staticBoxSchema = z.object({
  position: vec2Schema,
  /** Full width and height. */
  size: positiveVec2,
  angle: z.number().default(0),
  material: z.enum(['default', 'bouncy', 'slippery']).default('default'),
})
export type StaticBox = z.infer<typeof staticBoxSchema>

export const inventoryEntrySchema = z.object({
  type: contraptionTypeSchema,
  /** 0 means unlimited (sandbox). */
  count: z.int().min(0),
  /** Overrides for this scene's copies, e.g. a shorter ramp. */
  params: z.record(z.string(), z.number()).default({}),
})
export type InventoryEntry = z.infer<typeof inventoryEntrySchema>

export const sceneSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    /** Playfield; leaving it (plus a margin) fails the run. */
    bounds: rectSchema,
    statics: z.array(staticBoxSchema),
    /** Contraptions that are part of the scene and cannot be moved. */
    fixed: layoutSchema.default([]),
    /** Where the player may place contraptions. */
    buildZones: z.array(rectSchema).min(1),
    start: z.object({ position: vec2Schema, velocity: vec2Schema.default([0, 0]) }),
    /** The run succeeds when the ball centre stays inside this rect long enough. */
    goal: rectSchema,
    inventory: z.array(inventoryEntrySchema).min(1),
    limits: z.object({ maxRunTime: z.number().positive(), stallSeconds: z.number().positive() }),
    /** A known solution; tests prove it reaches the goal. */
    referenceSolution: layoutSchema.min(1),
    /** Hidden from the production catalogue (sandbox). */
    dev: z.boolean().default(false),
    /** Visual theme: backdrop and static colours (render/themes.ts). */
    theme: z.enum(['workshop', 'attic', 'rooftops', 'clocktower', 'factory']).default('workshop'),
    /** Scene whose backdrop image to use; defaults to the scene's own id. */
    backdrop: z.string().optional(),
  })
  .superRefine((scene, ctx) => {
    const inside = (r: Rect, x: number, y: number) => x > r.minX && x < r.maxX && y > r.minY && y < r.maxY
    if (!inside(scene.bounds, ...scene.start.position)) {
      ctx.addIssue({ code: 'custom', message: 'start is outside bounds', path: ['start'] })
    }
    const g = scene.goal
    if (!inside(scene.bounds, g.minX, g.minY) || !inside(scene.bounds, g.maxX, g.maxY)) {
      ctx.addIssue({ code: 'custom', message: 'goal is outside bounds', path: ['goal'] })
    }
    for (const entry of scene.inventory) {
      const used = scene.referenceSolution.filter((p) => p.type === entry.type).length
      if (entry.count > 0 && used > entry.count) {
        ctx.addIssue({
          code: 'custom',
          message: `reference solution uses too many ${entry.type}`,
          path: ['referenceSolution'],
        })
      }
    }
    for (const placed of scene.referenceSolution) {
      if (!scene.inventory.some((e) => e.type === placed.type)) {
        ctx.addIssue({
          code: 'custom',
          message: `${placed.type} is not in the inventory`,
          path: ['referenceSolution'],
        })
      }
    }
  })

export type SceneDefinition = z.infer<typeof sceneSchema>
export type SceneInput = z.input<typeof sceneSchema>

/** Validates scene data at module load so a broken scene fails fast. */
export function defineScene(input: SceneInput): SceneDefinition {
  return sceneSchema.parse(input)
}
