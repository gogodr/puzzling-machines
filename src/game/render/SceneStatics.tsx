import type { SceneDefinition } from '../scenes/schema'
import { useGame } from '../state/context'
import { Z_LAYER } from './layers'
import { Box, BoxMesh } from './placeholders'
import { Sprite } from './Sprite'
import { THEMES } from './themes'

const EDGE = 0.07
const FLAG_HEIGHT = 1.4

export function SceneStatics({ scene }: { scene: SceneDefinition }) {
  const building = useGame((s) => s.mode === 'build')
  const won = useGame((s) => s.result?.outcome.kind === 'success')
  const theme = THEMES[scene.theme]
  const { goal } = scene
  const goalCenter = [(goal.minX + goal.maxX) / 2, (goal.minY + goal.maxY) / 2] as const
  const goalW = goal.maxX - goal.minX
  const goalH = goal.maxY - goal.minY

  return (
    <group>
      {building &&
        scene.buildZones.map((zone, i) => (
          <group key={i} position={[(zone.minX + zone.maxX) / 2, (zone.minY + zone.maxY) / 2, 0]}>
            <BoxMesh
              width={zone.maxX - zone.minX}
              height={zone.maxY - zone.minY}
              color={theme.buildZone}
              opacity={0.22}
              z={Z_LAYER.background}
            />
          </group>
        ))}
      <Box
        center={goalCenter}
        size={[goalW, goalH]}
        color={theme.goal}
        opacity={won ? 0.45 : 0.25}
        z={Z_LAYER.decoration}
      />
      <Box
        center={[goalCenter[0], goal.minY + 0.03]}
        size={[goalW, 0.06]}
        color={theme.goal}
        opacity={0.9}
        z={Z_LAYER.decoration + 0.01}
      />
      <Sprite
        frame={won ? 'flag_celebrate' : 'flag'}
        size={[FLAG_HEIGHT, FLAG_HEIGHT]}
        center={[goal.maxX - FLAG_HEIGHT * 0.45, goal.minY + FLAG_HEIGHT / 2]}
        fit="height"
        z={Z_LAYER.decoration + 0.02}
      />
      {scene.statics.map((s, i) => (
        <group key={i} position={[s.position[0], s.position[1], 0]} rotation={[0, 0, s.angle]}>
          <BoxMesh
            width={s.size[0] + EDGE * 2}
            height={s.size[1] + EDGE * 2}
            color={theme.staticEdge}
            z={Z_LAYER.static - 0.01}
          />
          <BoxMesh width={s.size[0]} height={s.size[1]} color={theme.static} z={Z_LAYER.static} />
          {s.size[1] > 0.15 && (
            <Box
              center={[0, s.size[1] / 2 - 0.05]}
              size={[s.size[0] - 0.04, 0.06]}
              color="#ffffff"
              opacity={0.22}
              z={Z_LAYER.static + 0.01}
            />
          )}
        </group>
      ))}
    </group>
  )
}
