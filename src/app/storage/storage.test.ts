import { describe, expect, it } from 'vitest'
import type { Layout } from '@shared/layout'
import {
  isValidName,
  LEADERBOARD_SIZE,
  LocalLeaderboardRepository,
  type LeaderboardEntry,
} from './leaderboard'
import { loadLayout, saveLayout } from './profile'
import { loadProgress, markOnboardingDone, markSceneComplete, resetProgress } from './progress'
import { DEFAULT_SETTINGS, loadSettings, saveSettings } from './settings'
import { createMemoryStore } from './storage'

const entry = (name: string, score: number): LeaderboardEntry => ({
  name,
  score,
  runTime: 5,
  contraptionsUsed: 2,
  date: '2026-10-04T00:00:00.000Z',
})

describe('LocalLeaderboardRepository', () => {
  it('keeps the top 10 sorted, ties keeping the earlier entry ahead', () => {
    const repo = new LocalLeaderboardRepository(createMemoryStore())
    expect(repo.add('s', entry('AAA', 100))).toBe(0)
    expect(repo.add('s', entry('BBB', 200))).toBe(0)
    expect(repo.add('s', entry('CCC', 100))).toBe(2)
    expect(repo.list('s').map((e) => e.name)).toEqual(['BBB', 'AAA', 'CCC'])
    expect(repo.list('other')).toEqual([])
  })

  it('rejects scores that do not beat a full board, and zero scores', () => {
    const repo = new LocalLeaderboardRepository(createMemoryStore())
    for (let i = 1; i <= LEADERBOARD_SIZE; i++) repo.add('s', entry('AAA', i * 10))
    expect(repo.qualifies('s', 10)).toBe(false)
    expect(repo.add('s', entry('LOW', 5))).toBe(-1)
    expect(repo.add('s', entry('NEW', 15))).toBe(LEADERBOARD_SIZE - 1)
    expect(repo.list('s')).toHaveLength(LEADERBOARD_SIZE)
    expect(new LocalLeaderboardRepository(createMemoryStore()).qualifies('s', 0)).toBe(false)
  })

  it('ignores corrupt storage', () => {
    const store = createMemoryStore()
    store.setItem('pm.leaderboard.v1', '{"version":1,"scenes":{"s":[{"name":1}]}}')
    expect(new LocalLeaderboardRepository(store).list('s')).toEqual([])
    store.setItem('pm.leaderboard.v1', 'not json')
    expect(new LocalLeaderboardRepository(store).list('s')).toEqual([])
  })

  it('validates names', () => {
    expect(isValidName('Ana')).toBe(true)
    expect(isValidName(' Bob_9 ')).toBe(true)
    expect(isValidName('Al')).toBe(false)
    expect(isValidName('TooLongName')).toBe(false)
    expect(isValidName('<b>x</b>')).toBe(false)
  })
})

describe('layouts', () => {
  it('round-trips per scene and drops invalid data', () => {
    const store = createMemoryStore()
    const layout: Layout = [
      { id: 'p1', type: 'ramp', position: [1, 2], angle: 0, flipped: false, params: {} },
    ]
    saveLayout(store, 'a', layout)
    saveLayout(store, 'b', [])
    expect(loadLayout(store, 'a')).toEqual(layout)
    expect(loadLayout(store, 'c')).toEqual([])
    store.setItem('pm.layouts.v1', '{"a":[{"type":"laser"}]}')
    expect(loadLayout(store, 'a')).toEqual([])
  })
})

describe('progress', () => {
  it('records completions and onboarding, and resets', () => {
    const store = createMemoryStore()
    expect(loadProgress(store)).toEqual({ completed: [], onboardingDone: false })
    expect(markSceneComplete(store, 'first-steps').completed).toEqual(['first-steps'])
    expect(markSceneComplete(store, 'first-steps').completed).toEqual(['first-steps'])
    expect(markOnboardingDone(store).onboardingDone).toBe(true)
    expect(resetProgress(store)).toEqual({ completed: [], onboardingDone: false })
  })
})

describe('settings', () => {
  it('uses reduced-motion preference only when nothing is stored', () => {
    const store = createMemoryStore()
    expect(loadSettings(store, true).reducedMotion).toBe(true)
    saveSettings(store, { ...DEFAULT_SETTINGS, sound: false })
    expect(loadSettings(store, true)).toEqual({ ...DEFAULT_SETTINGS, sound: false })
  })
})
