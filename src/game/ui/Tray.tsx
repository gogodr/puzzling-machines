import { Text } from '@react-three/drei'
import type { ThreeEvent } from '@react-three/fiber'
import type { ContraptionType } from '@shared/layout'
import { CONTRAPTIONS, footprintOf } from '../contraptions/registry'
import { CONTRAPTION_VIEWS } from '../contraptions/views'
import { Z_LAYER } from '../render/layers'
import { PALETTE } from '../render/palette'
import { ArtBoundary } from '../render/ArtBoundary'
import type { FrameName } from '../render/atlas'
import { Sprite } from '../render/Sprite'
import { Box, BoxMesh } from '../render/placeholders'
import type { InventoryEntry, SceneDefinition } from '../scenes/schema'
import { useGame, useGameStore } from '../state/context'
import { remaining } from '../state/gameStore'
import {
  TRAY_ROW_HEIGHT,
  TRAY_SLOT_MARGIN as SLOT_MARGIN,
  TRAY_SLOT_WIDTH,
  trayRect,
  traySlotCenter,
} from './layout'
import { capturePointer, pointerWorld } from './pointer'
import { RunControls } from './RunControls'

const ICON_BOX: readonly [number, number] = [2.1, 0.7]

/** Parts whose real footprint is too tall to read at tray size get a single representative sprite. */
const ICON_FRAMES: Partial<Record<ContraptionType, FrameName>> = {
  elevator: 'pulley',
  pendulum: 'wrecking_ball',
}

const CURSOR = 0.07

/** Keyboard cursor: a ring plus a notch on top, so it reads without relying on colour. */
function SlotCursor({ width, height }: { width: number; height: number }) {
  return (
    <group position={[0, 0, 0.12]}>
      <Box center={[0, height / 2]} size={[width, CURSOR]} color={PALETTE.accent} />
      <Box center={[0, -height / 2]} size={[width, CURSOR]} color={PALETTE.accent} />
      <Box center={[-width / 2, 0]} size={[CURSOR, height]} color={PALETTE.accent} />
      <Box center={[width / 2, 0]} size={[CURSOR, height]} color={PALETTE.accent} />
      <Box center={[0, height / 2 + 0.1]} size={[0.5, 0.14]} color={PALETTE.accent} />
    </group>
  )
}

function TraySlot({
  entry,
  index,
  x,
  height,
}: {
  entry: InventoryEntry
  index: number
  x: number
  height: number
}) {
  const store = useGameStore()
  const left = useGame((s) => remaining(s, entry.type))
  const building = useGame((s) => s.mode === 'build')
  const focused = useGame((s) => s.trayCursor === index)
  const definition = CONTRAPTIONS[entry.type]
  const params = { ...definition.defaultParams, ...entry.params }
  const footprint = footprintOf({ type: entry.type, params })
  const scale = Math.min(ICON_BOX[0] / footprint.width, ICON_BOX[1] / footprint.height, 1)
  const View = CONTRAPTION_VIEWS[entry.type as ContraptionType]
  const icon = ICON_FRAMES[entry.type]
  const available = building && left > 0

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const point = pointerWorld(e)
    if (!point || !available) return
    store.getState().beginTrayDrag(entry.type, point)
    capturePointer(e)
  }

  return (
    <group position={[x, 0, 0]}>
      <mesh onPointerDown={onPointerDown}>
        <planeGeometry args={[TRAY_SLOT_WIDTH - SLOT_MARGIN, height - SLOT_MARGIN * 2]} />
        <meshBasicMaterial color={PALETTE.traySlot} />
      </mesh>
      <group position={[0, 0.2, 0.05]} scale={icon ? 1 : scale}>
        <ArtBoundary>
          {icon ? <Sprite frame={icon} size={ICON_BOX} fit="contain" /> : <View params={params} />}
        </ArtBoundary>
      </group>
      <Text
        position={[0, -height / 2 + 0.38, 0.05]}
        fontSize={0.28}
        color={PALETTE.trayText}
        anchorX="center"
        anchorY="middle"
      >
        {Number.isFinite(left) ? `${definition.name} ×${left}` : definition.name}
      </Text>
      {!available && (
        <BoxMesh
          width={TRAY_SLOT_WIDTH - SLOT_MARGIN}
          height={height - SLOT_MARGIN * 2}
          color={PALETTE.tray}
          opacity={0.6}
          z={0.1}
        />
      )}
      {focused && <SlotCursor width={TRAY_SLOT_WIDTH - SLOT_MARGIN} height={height - SLOT_MARGIN * 2} />}
    </group>
  )
}

/** Inventory strip under the scene, drawn in world space so it scales with the camera. */
export function Tray({ scene }: { scene: SceneDefinition }) {
  const count = scene.inventory.length
  const rect = trayRect(scene.bounds, count)
  const width = rect.maxX - rect.minX
  const height = rect.maxY - rect.minY
  const cx = (rect.minX + rect.maxX) / 2
  const cy = (rect.minY + rect.maxY) / 2

  return (
    <group position={[cx, cy, Z_LAYER.hud - 0.5]}>
      <mesh onPointerDown={(e) => e.stopPropagation()}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial color={PALETTE.tray} />
      </mesh>
      <group position={[0, 0, 0.01]}>
        {scene.inventory.map((entry, i) => {
          const [sx, sy] = traySlotCenter(scene.bounds, i, count)
          return (
            <group key={entry.type} position={[0, sy - cy, 0]}>
              <TraySlot entry={entry} index={i} height={TRAY_ROW_HEIGHT} x={sx - cx} />
            </group>
          )
        })}
        <group position={[0, rect.maxY - TRAY_ROW_HEIGHT / 2 - cy, 0]}>
          <RunControls x={width / 2} />
        </group>
      </group>
    </group>
  )
}
