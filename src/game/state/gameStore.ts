import { createStore } from 'zustand/vanilla'
import type { GameMode, GameSettings, GameSfx } from '@shared/bridge/messages'
import type { ContraptionType, Layout, PlacedContraption } from '@shared/layout'
import type { Vec2 } from '@shared/math'
import type { RunResult } from '@shared/run'
import { GRID, ROTATION_STEP, snapAngle, snapPoint, validatePlacement } from '../build/placement'
import { CONTRAPTIONS } from '../contraptions/registry'
import type { SceneDefinition } from '../scenes/schema'
import type { Simulation } from '../sim/Simulation'

export type Mode = GameMode

export interface DragState {
  item: PlacedContraption
  /** Where the item was before a move drag; null when dragged from the tray. */
  origin: PlacedContraption | null
  /** Pointer offset from the item centre at grab time. */
  grab: Vec2
  valid: boolean
}

export interface GameState {
  scene: SceneDefinition | null
  /** Placed contraptions, excluding the one being dragged. */
  layout: Layout
  mode: Mode
  /** Incremented per Run; keys the physics world so every run starts fresh. */
  runId: number
  selectedId: string | null
  drag: DragState | null
  result: RunResult | null
  /** The live run, set by SimulationRunner. Not serialisable; never send it over the bridge. */
  simulation: Simulation | null
  debug: boolean
  nextId: number
  settings: GameSettings
  /** Ghost of the reference solution's first piece, shown after three failed runs. */
  hint: PlacedContraption | null
  failCount: number
  /** Latest sound cue; `n` increments so repeats of the same cue are still distinct changes. */
  sfx: { name: GameSfx; intensity: number; n: number } | null
  /** Tray slot highlighted for keyboard placement; null unless the board has keyboard focus. */
  trayCursor: number | null

  loadScene(scene: SceneDefinition, saved?: Layout): void
  beginTrayDrag(type: ContraptionType, point: Vec2): void
  beginMoveDrag(id: string, point: Vec2): void
  moveDrag(point: Vec2): void
  endDrag(): void
  cancelDrag(): void
  select(id: string | null): void
  rotate(direction: 1 | -1): void
  flip(): void
  deleteSelected(): void
  startRun(): void
  setSimulation(simulation: Simulation): void
  endRun(result: RunResult): void
  backToBuild(): void
  setDebug(enabled: boolean): void
  setSettings(settings: GameSettings): void
  emitSfx(name: GameSfx, intensity?: number): void
  setTrayCursor(index: number | null): void
  /** Keyboard placement: drops a tray part on the free spot nearest the build zone centre. */
  placeFromTray(type: ContraptionType): void
  /** Moves the selected part by whole grid cells if the new spot is legal. */
  nudge(dx: number, dy: number): void
}

export function remaining(state: Pick<GameState, 'scene' | 'layout' | 'drag'>, type: ContraptionType) {
  const entry = state.scene?.inventory.find((e) => e.type === type)
  if (!entry) return 0
  if (entry.count === 0) return Number.POSITIVE_INFINITY
  const placed = state.layout.filter((p) => p.type === type).length
  const dragging = state.drag?.item.type === type ? 1 : 0
  return entry.count - placed - dragging
}

function idNumber(id: string) {
  const n = Number(/^p(\d+)$/.exec(id)?.[1])
  return Number.isFinite(n) ? n : 0
}

/** Drops saved items that no longer fit the scene (inventory changed, overlaps, out of zone). */
function sanitizeLayout(scene: SceneDefinition, saved: Layout): Layout {
  const kept: PlacedContraption[] = []
  for (const item of saved) {
    const entry = scene.inventory.find((e) => e.type === item.type)
    const used = kept.filter((p) => p.type === item.type).length
    if (!entry || (entry.count > 0 && used >= entry.count) || kept.some((p) => p.id === item.id)) continue
    if (validatePlacement(scene, kept, item).valid) kept.push(item)
  }
  return kept
}

/** The legal grid spot closest to the centre of a build zone, searched ring by ring. */
export function nearestFreeSpot(
  scene: SceneDefinition,
  layout: Layout,
  item: PlacedContraption,
): PlacedContraption | null {
  for (const zone of scene.buildZones) {
    const center = snapPoint([(zone.minX + zone.maxX) / 2, (zone.minY + zone.maxY) / 2])
    const reach = Math.ceil(Math.max(zone.maxX - zone.minX, zone.maxY - zone.minY) / 2 / GRID)
    for (let ring = 0; ring <= reach; ring++) {
      const cells: Vec2[] = []
      for (let i = -ring; i <= ring; i++) {
        for (let j = -ring; j <= ring; j++) {
          if (Math.max(Math.abs(i), Math.abs(j)) === ring) cells.push([i, j])
        }
      }
      cells.sort((a, b) => Math.hypot(...a) - Math.hypot(...b))
      for (const [i, j] of cells) {
        const candidate = { ...item, position: snapPoint([center[0] + i * GRID, center[1] + j * GRID]) }
        if (validatePlacement(scene, layout, candidate).valid) return candidate
      }
    }
  }
  return null
}

export function createGameStore() {
  return createStore<GameState>()((set, get) => {
    const editable = () => {
      const s = get()
      return s.scene && s.mode === 'build' ? s.scene : null
    }

    /** Applies a change to the dragged item, or to the selected item if the result is valid. */
    const transform = (change: (item: PlacedContraption) => PlacedContraption, cue: GameSfx) => {
      const scene = editable()
      if (!scene) return
      const { drag, layout, selectedId } = get()
      if (drag) {
        const item = change(drag.item)
        if (item === drag.item) return
        set({ drag: { ...drag, item, valid: validatePlacement(scene, layout, item).valid } })
        get().emitSfx(cue)
        return
      }
      const index = layout.findIndex((p) => p.id === selectedId)
      const current = layout[index]
      if (!current) return
      const item = change(current)
      if (item === current) return
      const others = layout.filter((_, i) => i !== index)
      if (validatePlacement(scene, others, item).valid) {
        set({ layout: layout.map((p, i) => (i === index ? item : p)) })
        get().emitSfx(cue)
      } else get().emitSfx('invalid')
    }

    return {
      scene: null,
      layout: [],
      mode: 'build',
      runId: 0,
      selectedId: null,
      drag: null,
      result: null,
      simulation: null,
      debug: false,
      nextId: 1,
      settings: { cameraFollow: false, reducedMotion: false },
      hint: null,
      failCount: 0,
      sfx: null,
      trayCursor: null,

      loadScene(scene, saved = []) {
        const layout = sanitizeLayout(scene, saved)
        const nextId = Math.max(0, ...layout.map((p) => idNumber(p.id))) + 1
        set({
          scene,
          layout,
          nextId,
          mode: 'build',
          selectedId: null,
          drag: null,
          result: null,
          simulation: null,
          hint: null,
          failCount: 0,
        })
      },

      beginTrayDrag(type, point) {
        const scene = editable()
        if (!scene || get().drag || remaining(get(), type) <= 0) return
        const entry = scene.inventory.find((e) => e.type === type)
        const item: PlacedContraption = {
          id: `p${get().nextId}`,
          type,
          position: snapPoint(point),
          angle: 0,
          flipped: false,
          params: { ...entry?.params },
        }
        set({
          nextId: get().nextId + 1,
          selectedId: item.id,
          drag: {
            item,
            origin: null,
            grab: [0, 0],
            valid: validatePlacement(scene, get().layout, item).valid,
          },
        })
      },

      beginMoveDrag(id, point) {
        const scene = editable()
        if (!scene || get().drag) return
        const item = get().layout.find((p) => p.id === id)
        if (!item) return
        const layout = get().layout.filter((p) => p.id !== id)
        const grab: Vec2 = [point[0] - item.position[0], point[1] - item.position[1]]
        set({ layout, selectedId: id, drag: { item, origin: item, grab, valid: true } })
      },

      moveDrag(point) {
        const { drag, scene, layout } = get()
        if (!drag || !scene) return
        const position = snapPoint([point[0] - drag.grab[0], point[1] - drag.grab[1]])
        if (position[0] === drag.item.position[0] && position[1] === drag.item.position[1]) return
        const item = { ...drag.item, position }
        set({ drag: { ...drag, item, valid: validatePlacement(scene, layout, item).valid } })
      },

      endDrag() {
        const { drag, layout, emitSfx } = get()
        if (!drag) return
        const moved =
          !drag.origin ||
          drag.origin.position[0] !== drag.item.position[0] ||
          drag.origin.position[1] !== drag.item.position[1]
        if (drag.valid) {
          set({ layout: [...layout, drag.item], drag: null, selectedId: drag.item.id })
          if (moved) emitSfx('place')
        } else {
          if (drag.origin) set({ layout: [...layout, drag.origin], drag: null, selectedId: drag.origin.id })
          else set({ drag: null, selectedId: null })
          emitSfx('invalid')
        }
      },

      cancelDrag() {
        const { drag, layout } = get()
        if (!drag) return
        if (drag.origin) set({ layout: [...layout, drag.origin], drag: null })
        else set({ drag: null, selectedId: null })
      },

      select(id) {
        if (get().drag) return
        set({ selectedId: id })
      },

      rotate(direction) {
        transform((item) => ({ ...item, angle: snapAngle(item.angle + direction * ROTATION_STEP) }), 'rotate')
      },

      flip() {
        transform(
          (item) => (CONTRAPTIONS[item.type].flippable ? { ...item, flipped: !item.flipped } : item),
          'rotate',
        )
      },

      deleteSelected() {
        if (!editable()) return
        const { drag, layout, selectedId } = get()
        if (drag) set({ drag: null, selectedId: null })
        else if (selectedId) set({ layout: layout.filter((p) => p.id !== selectedId), selectedId: null })
        else return
        get().emitSfx('remove')
      },

      startRun() {
        if (!editable() || get().drag) return
        set({ mode: 'running', runId: get().runId + 1, selectedId: null, result: null, simulation: null })
      },

      setSimulation(simulation) {
        set({ simulation })
      },

      endRun(result) {
        if (get().mode !== 'running') return
        if (result.outcome.kind === 'success') {
          set({ mode: 'result', result, failCount: 0, hint: null })
          return
        }
        const failCount = get().failCount + 1
        const hint = failCount >= 3 ? (get().scene?.referenceSolution[0] ?? null) : get().hint
        set({ mode: 'result', result, failCount, hint })
      },

      backToBuild() {
        if (get().mode === 'build') return
        set({ mode: 'build', result: null, simulation: null })
      },

      setDebug(debug) {
        set({ debug })
      },

      setSettings(settings) {
        set({ settings })
      },

      emitSfx(name, intensity = 1) {
        set({ sfx: { name, intensity, n: (get().sfx?.n ?? 0) + 1 } })
      },

      setTrayCursor(trayCursor) {
        set({ trayCursor })
      },

      placeFromTray(type) {
        const scene = editable()
        if (!scene || get().drag) return
        if (remaining(get(), type) <= 0) {
          get().emitSfx('invalid')
          return
        }
        const entry = scene.inventory.find((e) => e.type === type)
        const base: PlacedContraption = {
          id: `p${get().nextId}`,
          type,
          position: [0, 0],
          angle: 0,
          flipped: false,
          params: { ...entry?.params },
        }
        const item = nearestFreeSpot(scene, get().layout, base)
        if (!item) {
          get().emitSfx('invalid')
          return
        }
        set({ layout: [...get().layout, item], nextId: get().nextId + 1, selectedId: item.id })
        get().emitSfx('place')
      },

      nudge(dx, dy) {
        transform(
          (item) => ({
            ...item,
            position: snapPoint([item.position[0] + dx * GRID, item.position[1] + dy * GRID]),
          }),
          'place',
        )
      },
    }
  })
}

export type GameStore = ReturnType<typeof createGameStore>
