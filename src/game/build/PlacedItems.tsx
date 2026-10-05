import type { ThreeEvent } from '@react-three/fiber'
import type { PlacedContraption } from '@shared/layout'
import { footprintOf, resolveParams } from '../contraptions/registry'
import { CONTRAPTION_VIEWS } from '../contraptions/views'
import { PALETTE } from '../render/palette'
import { Box, BoxMesh } from '../render/placeholders'
import { useGame, useGameStore } from '../state/context'
import { capturePointer, pointerWorld } from '../ui/pointer'
import { ContraptionTransform } from './ContraptionTransform'

/** Thin contraptions get a taller hit area so they are easy to grab. */
const MIN_HIT_HEIGHT = 0.6
const OUTLINE = 0.08

function ContraptionBody({ item, live }: { item: PlacedContraption; live: boolean }) {
  const View = CONTRAPTION_VIEWS[item.type]
  return <View params={resolveParams(item)} live={live} item={item} />
}

function SelectionOutline({ width, height }: { width: number; height: number }) {
  const w = width + OUTLINE * 2
  const h = height + OUTLINE * 2
  return (
    <>
      <BoxMesh width={w} height={h} color={PALETTE.selection} opacity={0.12} z={-0.05} />
      <Box center={[0, h / 2]} size={[w + OUTLINE, OUTLINE]} color={PALETTE.selection} z={0.04} />
      <Box center={[0, -h / 2]} size={[w + OUTLINE, OUTLINE]} color={PALETTE.selection} z={0.04} />
      <Box center={[-w / 2, 0]} size={[OUTLINE, h]} color={PALETTE.selection} z={0.04} />
      <Box center={[w / 2, 0]} size={[OUTLINE, h]} color={PALETTE.selection} z={0.04} />
    </>
  )
}

function PlacedItem({ item }: { item: PlacedContraption }) {
  const store = useGameStore()
  const selected = useGame((s) => s.selectedId === item.id)
  const building = useGame((s) => s.mode === 'build')
  const { width, height } = footprintOf(item)

  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    const point = pointerWorld(e)
    if (!point) return
    store.getState().beginMoveDrag(item.id, point)
    capturePointer(e)
  }

  return (
    <ContraptionTransform item={item}>
      {selected && building && <SelectionOutline width={width} height={height} />}
      <ContraptionBody item={item} live={!building} />
      {building && (
        <mesh position={[0, 0, 0.05]} onPointerDown={onPointerDown}>
          <planeGeometry args={[width + 0.1, Math.max(height, MIN_HIT_HEIGHT)]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
    </ContraptionTransform>
  )
}

export function PlacedItems() {
  const layout = useGame((s) => s.layout)
  const fixed = useGame((s) => s.scene?.fixed)
  const building = useGame((s) => s.mode === 'build')
  return (
    <group>
      {fixed?.map((item) => (
        <ContraptionTransform key={item.id} item={item}>
          <ContraptionBody item={item} live={!building} />
        </ContraptionTransform>
      ))}
      {layout.map((item) => (
        <PlacedItem key={item.id} item={item} />
      ))}
    </group>
  )
}

const MARK = 0.07

/** Corner brackets when the spot is valid. */
function ValidMark({ width, height }: { width: number; height: number }) {
  const w = width / 2 + OUTLINE
  const h = height / 2 + OUTLINE
  const arm = Math.min(0.45, w, h)
  return (
    <>
      {[-1, 1].flatMap((sx) =>
        [-1, 1].map((sy) => (
          <group key={`${sx}${sy}`}>
            <Box center={[sx * (w - arm / 2), sy * h]} size={[arm, MARK]} color={PALETTE.valid} z={0.07} />
            <Box center={[sx * w, sy * (h - arm / 2)]} size={[MARK, arm]} color={PALETTE.valid} z={0.07} />
          </group>
        )),
      )}
    </>
  )
}

/** A cross through the footprint when blocked, so the state does not rely on colour alone. */
function InvalidMark({ width, height }: { width: number; height: number }) {
  const w = width + OUTLINE * 2
  const h = Math.max(height + OUTLINE * 2, 0.4)
  const angle = Math.atan2(h, w)
  const length = Math.hypot(w, h)
  return (
    <>
      <Box center={[0, 0]} size={[length, MARK]} angle={angle} color={PALETTE.invalid} z={0.07} />
      <Box center={[0, 0]} size={[length, MARK]} angle={-angle} color={PALETTE.invalid} z={0.07} />
    </>
  )
}

export function DragGhost() {
  const drag = useGame((s) => s.drag)
  if (!drag) return null
  const { width, height } = footprintOf(drag.item)
  return (
    <ContraptionTransform item={drag.item}>
      <ContraptionBody item={drag.item} live={false} />
      <BoxMesh
        width={width + OUTLINE * 2}
        height={height + OUTLINE * 2}
        color={drag.valid ? PALETTE.valid : PALETTE.invalid}
        opacity={drag.valid ? 0.25 : 0.4}
        z={0.06}
      />
      {drag.valid ? (
        <ValidMark width={width} height={height} />
      ) : (
        <InvalidMark width={width} height={height} />
      )}
    </ContraptionTransform>
  )
}
