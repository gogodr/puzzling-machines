/** Same numeric values as Rapier's CoefficientCombineRule; kept local so this module never loads the WASM package. */
export const CombineRule = {
  Average: 0,
  Min: 1,
  Multiply: 2,
  Max: 3,
} as const

export type CombineRuleValue = (typeof CombineRule)[keyof typeof CombineRule]

export interface MaterialPreset {
  friction: number
  restitution: number
  density: number
  frictionCombineRule: CombineRuleValue
  restitutionCombineRule: CombineRuleValue
}

export const MATERIALS = {
  default: {
    friction: 0.6,
    restitution: 0.1,
    density: 1,
    frictionCombineRule: CombineRule.Average,
    restitutionCombineRule: CombineRule.Average,
  },
  ball: {
    friction: 0.8,
    restitution: 0.3,
    density: 2,
    frictionCombineRule: CombineRule.Average,
    restitutionCombineRule: CombineRule.Average,
  },
  bouncy: {
    friction: 0.5,
    restitution: 0.95,
    density: 1,
    frictionCombineRule: CombineRule.Average,
    restitutionCombineRule: CombineRule.Max,
  },
  slippery: {
    friction: 0.02,
    restitution: 0.05,
    density: 1,
    frictionCombineRule: CombineRule.Min,
    restitutionCombineRule: CombineRule.Average,
  },
  /** Conveyor surface: high friction wins so the treadmill velocity transfers to whatever rests on it. */
  belt: {
    friction: 1.2,
    restitution: 0,
    density: 1,
    frictionCombineRule: CombineRule.Max,
    restitutionCombineRule: CombineRule.Min,
  },
  /** Pendulum bobs: dense enough to knock the ball well clear. */
  heavy: {
    friction: 0.4,
    restitution: 0.2,
    density: 8,
    frictionCombineRule: CombineRule.Average,
    restitutionCombineRule: CombineRule.Average,
  },
} as const satisfies Record<string, MaterialPreset>

export type MaterialName = keyof typeof MATERIALS
