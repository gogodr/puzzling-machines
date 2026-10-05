import { z } from 'zod'

export const CONTRAPTION_TYPES = [
  'ramp',
  'conveyor',
  'trampoline',
  'fan',
  'spinner',
  'seesaw',
  'pendulum',
  'dominoes',
  'funnel',
  'pipe',
  'pipeCurve',
  'catapult',
  'sling',
  'elevator',
] as const
export const contraptionTypeSchema = z.enum(CONTRAPTION_TYPES)
export type ContraptionType = z.infer<typeof contraptionTypeSchema>

export const vec2Schema = z.tuple([z.number(), z.number()]).readonly()

/** One contraption in a scene: placed by the player, fixed by the scene, or part of a reference solution. */
export const placedContraptionSchema = z.object({
  id: z.string().min(1),
  type: contraptionTypeSchema,
  position: vec2Schema,
  /** Radians about Z. */
  angle: z.number(),
  flipped: z.boolean(),
  params: z.record(z.string(), z.number()),
})
export type PlacedContraption = z.infer<typeof placedContraptionSchema>

export const layoutSchema = z.array(placedContraptionSchema)
export type Layout = z.infer<typeof layoutSchema>
