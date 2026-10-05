import { PALETTE } from '../../render/palette'
import { Box } from '../../render/placeholders'
import { Sprite } from '../../render/Sprite'
import { BodyPose } from '../BodyPose'
import type { ContraptionViewProps } from '../views'
import { PENDULUM_BOB, PENDULUM_MOUNT, pendulumGeometry } from './definition'

/** The bob's body is rotated with the swing, so the rope is drawn in the bob frame toward the pivot. */
export function PendulumView({ params, live, item }: ContraptionViewProps) {
  const { anchor, start, bobAt } = pendulumGeometry(params)
  const length = params.length ?? 1.6
  const rest = bobAt(start)
  return (
    <group>
      <Sprite frame="bracket" center={anchor} size={[PENDULUM_MOUNT[0] * 1.6, 0.4]} fit="contain" z={0.02} />
      <BodyPose item={item} live={live} rest={rest} restAngle={start}>
        <Box center={[0, length / 2]} size={[0.05, length]} color={PALETTE.machineDark} z={-0.01} />
        <Sprite
          frame="wrecking_ball"
          size={[PENDULUM_BOB * 2.1, PENDULUM_BOB * 2.6]}
          center={[0, PENDULUM_BOB * 0.25]}
          fit="contain"
          align={[0, -1]}
        />
      </BodyPose>
    </group>
  )
}
