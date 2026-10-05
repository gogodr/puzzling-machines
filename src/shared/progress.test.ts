import { describe, expect, it } from 'vitest'
import { isSceneUnlocked, nextSceneId } from './progress'

const catalog = [{ id: 'a' }, { id: 'b' }, { id: 'c' }]

describe('isSceneUnlocked', () => {
  it('opens the first scene and each scene after a completion', () => {
    expect(isSceneUnlocked('a', [], catalog)).toBe(true)
    expect(isSceneUnlocked('b', [], catalog)).toBe(false)
    expect(isSceneUnlocked('b', ['a'], catalog)).toBe(true)
    expect(isSceneUnlocked('c', ['a'], catalog)).toBe(false)
    expect(isSceneUnlocked('c', ['a', 'b'], catalog)).toBe(true)
  })

  it('unlocks everything when asked', () => {
    expect(isSceneUnlocked('c', [], catalog, true)).toBe(true)
  })

  it('treats unknown ids as unlocked so a stale link still works', () => {
    expect(isSceneUnlocked('sandbox', [], catalog)).toBe(true)
  })
})

describe('nextSceneId', () => {
  it('returns the following catalogue id or null', () => {
    expect(nextSceneId('a', catalog)).toBe('b')
    expect(nextSceneId('c', catalog)).toBeNull()
    expect(nextSceneId('missing', catalog)).toBeNull()
  })
})
