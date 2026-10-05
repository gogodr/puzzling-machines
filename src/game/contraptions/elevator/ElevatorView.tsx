import { PALETTE } from '../../render/palette'
import { Box } from '../../render/placeholders'
import { Sprite } from '../../render/Sprite'
import { BodyPose } from '../BodyPose'
import type { ContraptionViewProps } from '../views'
import { ELEVATOR, elevatorTravel } from './definition'

export function ElevatorView({ params, live, item }: ContraptionViewProps) {
  const { footprint, bottom, top } = elevatorTravel(params)
  const shaft = top - bottom
  return (
    <group>
      {[-1, 1].map((side) => (
        <Box
          key={side}
          center={[side * (ELEVATOR.width / 2 - 0.05), (top + bottom) / 2]}
          size={[0.06, shaft + 0.3]}
          color={PALETTE.machineDark}
          opacity={0.5}
          z={-0.02}
        />
      ))}
      <Sprite
        frame="pulley"
        center={[0, footprint / 2 - 0.25]}
        size={[ELEVATOR.width, 0.5]}
        fit="contain"
        z={0.02}
      />
      <BodyPose item={item} live={live} rest={[0, bottom]}>
        <Sprite frame="platform" size={[ELEVATOR.platform[0] * 1.08, 0.24]} center={[0, 0.03]} />
      </BodyPose>
    </group>
  )
}
