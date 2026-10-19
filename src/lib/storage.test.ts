import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'

import {
  DEFAULT_SAVE,
  PERSISTED_KEYS,
  PERSISTED_SETTING_KEYS,
  STORAGE_KEY,
  clearSave,
  loadSave,
  persistSave,
  readRawSave,
  storageAvailable,
} from './storage'

beforeEach(() => {
  window.localStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadSave', () => {
  it('returns the default when nothing has been stored', () => {
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })

  it('round-trips a save', () => {
    const save = {
      version: 1 as const,
      stars: { coins: 2, sort: 3 },
      settings: { sound: true, reduceMotion: null },
    }
    expect(persistSave(save)).toBe(true)
    expect(loadSave()).toEqual(save)
  })

  it('discards corrupt JSON instead of throwing', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json at all')
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })

  it('discards a payload of the wrong shape', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify('just a string'))
    expect(loadSave()).toEqual(DEFAULT_SAVE)
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(null))
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })

  it('repairs out-of-range and non-numeric star counts', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        stars: { coins: 99, sort: -4, goal: 'three', bogus: 2 },
        settings: {},
      }),
    )
    const loaded = loadSave()
    expect(loaded.stars.coins).toBe(3)
    expect(loaded.stars.sort).toBe(0)
    expect(loaded.stars.goal).toBeUndefined()
    expect(Object.keys(loaded.stars)).not.toContain('bogus')
  })

  it('drops unknown game ids rather than carrying them forward', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, stars: { coins: 1, tracker: 3 }, settings: {} }),
    )
    expect(Object.keys(loadSave().stars)).toEqual(['coins'])
  })

  it('falls back to defaults when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked by privacy mode')
    })
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })
})

describe('storageAvailable', () => {
  it('is true in a normal browser', () => {
    expect(storageAvailable()).toBe(true)
  })

  it('is false when setItem throws, without propagating', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    expect(storageAvailable()).toBe(false)
    expect(() => persistSave(DEFAULT_SAVE)).not.toThrow()
    expect(persistSave(DEFAULT_SAVE)).toBe(false)
  })
})

describe('clearSave', () => {
  it('removes the key entirely', () => {
    persistSave({ version: 1, stars: { coins: 3 }, settings: { sound: true, reduceMotion: null } })
    expect(readRawSave()).not.toBeNull()
    clearSave()
    expect(readRawSave()).toBeNull()
    expect(loadSave()).toEqual(DEFAULT_SAVE)
  })
})

/**
 * The compliance test.
 *
 * The claim on the "For grown-ups" panel is that this app stores three star
 * ratings and two booleans, and nothing else. That claim is only worth making if
 * it is enforced, so this walks the actual serialised payload and fails on any
 * key outside the allowlist — including nested ones. Adding `childName` to the
 * save shape breaks this test before it can break a privacy review.
 */
describe('what actually leaves the app', () => {
  it('persists exactly the documented key set, recursively', () => {
    persistSave({
      version: 1,
      stars: { coins: 3, sort: 1, goal: 0 },
      settings: { sound: true, reduceMotion: false },
    })

    const raw = readRawSave()
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string) as Record<string, unknown>

    expect(Object.keys(parsed).sort()).toEqual([...PERSISTED_KEYS].sort())
    expect(Object.keys(parsed['settings'] as object).sort()).toEqual(
      [...PERSISTED_SETTING_KEYS].sort(),
    )
    for (const id of Object.keys(parsed['stars'] as object)) {
      expect(['coins', 'sort', 'goal']).toContain(id)
    }
  })

  it('stores nothing that could identify a child', () => {
    persistSave(DEFAULT_SAVE)
    const raw = (readRawSave() as string).toLowerCase()

    const forbidden = [
      'name',
      'email',
      'age',
      'birth',
      'school',
      'address',
      'phone',
      'zip',
      'postcode',
      'location',
      'geolocation',
      'photo',
      'avatar',
      'gender',
      'ip',
      'deviceid',
      'userid',
      'token',
    ]
    for (const field of forbidden) {
      expect(raw).not.toContain(field)
    }
  })

  it('contains no free text of any value', () => {
    // Every persisted leaf is a number or a boolean. There is no string value
    // anywhere, so there is nothing a child could type into it.
    persistSave({
      version: 1,
      stars: { coins: 3 },
      settings: { sound: true, reduceMotion: false },
    })
    const parsed = JSON.parse(readRawSave() as string) as Record<string, unknown>

    const leaves: unknown[] = []
    const walk = (node: unknown): void => {
      if (node !== null && typeof node === 'object') {
        for (const value of Object.values(node as Record<string, unknown>)) walk(value)
        return
      }
      leaves.push(node)
    }
    walk(parsed)

    for (const leaf of leaves) {
      expect(['number', 'boolean']).toContain(typeof leaf)
    }
  })
})
