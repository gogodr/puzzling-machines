import { z } from 'zod'
import { readJson, writeJson, type KeyValueStore } from './storage'

export const LEADERBOARD_SIZE = 10
export const NAME_PATTERN = /^[A-Za-z0-9 _-]{3,8}$/

const entrySchema = z.object({
  name: z.string(),
  score: z.number(),
  runTime: z.number(),
  contraptionsUsed: z.number(),
  /** ISO timestamp. */
  date: z.string(),
})
export type LeaderboardEntry = z.infer<typeof entrySchema>

const fileSchema = z.object({ version: z.literal(1), scenes: z.record(z.string(), z.array(entrySchema)) })
type LeaderboardFile = z.infer<typeof fileSchema>

/** Storage-agnostic so an online board can replace the local one later (PLAN "Leaderboards"). */
export interface LeaderboardRepository {
  list(sceneId: string): LeaderboardEntry[]
  qualifies(sceneId: string, score: number): boolean
  /** Returns the 0-based rank of the new entry, or -1 if it did not make the board. */
  add(sceneId: string, entry: LeaderboardEntry): number
}

export function isValidName(name: string) {
  return NAME_PATTERN.test(name.trim())
}

export class LocalLeaderboardRepository implements LeaderboardRepository {
  constructor(
    private readonly store: KeyValueStore,
    private readonly key = 'pm.leaderboard.v1',
  ) {}

  private read(): LeaderboardFile {
    return readJson(this.store, this.key, fileSchema, { version: 1, scenes: {} })
  }

  list(sceneId: string) {
    return this.read().scenes[sceneId] ?? []
  }

  qualifies(sceneId: string, score: number) {
    if (score <= 0) return false
    const entries = this.list(sceneId)
    return entries.length < LEADERBOARD_SIZE || score > (entries.at(-1)?.score ?? 0)
  }

  add(sceneId: string, entry: LeaderboardEntry) {
    if (!this.qualifies(sceneId, entry.score)) return -1
    const file = this.read()
    const entries = [...(file.scenes[sceneId] ?? [])]
    // Ties keep the earlier entry ahead.
    const index = entries.findIndex((e) => entry.score > e.score)
    const rank = index === -1 ? entries.length : index
    entries.splice(rank, 0, { ...entry, name: entry.name.trim() })
    file.scenes[sceneId] = entries.slice(0, LEADERBOARD_SIZE)
    writeJson(this.store, this.key, file)
    return rank
  }
}
