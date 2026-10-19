/**
 * The only thing this app ever writes to a device.
 *
 * COPPA is largely about what you collect from children, so the cheapest way to
 * be compliant is to collect nothing. This module is the whole persistence
 * surface: three star ratings and two display preferences — no name, no age, no
 * email, no school, no free text, no device fingerprint, no identifier of any
 * kind. `storage.test.ts` asserts that key set exhaustively, so a future
 * contributor cannot quietly add a field that turns this into a regulated app.
 *
 * Everything stays in `localStorage` on the child's own device. Nothing is
 * transmitted, because there is nothing to transmit it to: the app ships with no
 * backend and makes no network request at runtime.
 */

export const STORAGE_KEY = 'money-meadow.v1'

export type GameId = 'coins' | 'sort' | 'goal'

export const GAME_IDS: readonly GameId[] = ['coins', 'sort', 'goal']

export type Settings = {
  /** Web Audio blips. Off by default: a children's app that makes noise on load
   *  is hostile in a classroom (and browsers block it anyway). */
  sound: boolean
  /** `null` means "follow the operating system". */
  reduceMotion: boolean | null
}

export type SaveData = {
  version: 1
  /** Stars earned per game, 0-3. Absent means "not played yet". */
  stars: Partial<Record<GameId, number>>
  settings: Settings
}

export const DEFAULT_SAVE: SaveData = {
  version: 1,
  stars: {},
  settings: { sound: false, reduceMotion: null },
}

/**
 * The complete allowlist of persisted paths. Exported so the test can assert the
 * saved payload matches it exactly rather than a hand-copied duplicate.
 */
export const PERSISTED_KEYS = ['version', 'stars', 'settings'] as const
export const PERSISTED_SETTING_KEYS = ['sound', 'reduceMotion'] as const

/** `localStorage` throws in some privacy modes; a probe avoids discovering that mid-render. */
export function storageAvailable(): boolean {
  try {
    const probe = '__money-meadow-probe__'
    window.localStorage.setItem(probe, '1')
    window.localStorage.removeItem(probe)
    return true
  } catch {
    return false
  }
}

function coerceStars(value: unknown): Partial<Record<GameId, number>> {
  if (typeof value !== 'object' || value === null) return {}
  const source = value as Record<string, unknown>
  const stars: Partial<Record<GameId, number>> = {}
  for (const id of GAME_IDS) {
    const raw = source[id]
    if (typeof raw === 'number' && Number.isFinite(raw)) {
      stars[id] = Math.min(3, Math.max(0, Math.round(raw)))
    }
  }
  return stars
}

function coerceSettings(value: unknown): Settings {
  if (typeof value !== 'object' || value === null) return { ...DEFAULT_SAVE.settings }
  const source = value as Record<string, unknown>
  return {
    sound: source['sound'] === true,
    reduceMotion:
      typeof source['reduceMotion'] === 'boolean' ? source['reduceMotion'] : null,
  }
}

/**
 * Reads and repairs whatever is in storage. Any corruption, any schema drift and
 * any unexpected field is discarded rather than migrated — there is nothing here
 * worth rescuing, and refusing to trust stored data is the safer default.
 */
export function loadSave(): SaveData {
  if (!storageAvailable()) return structuredCloneSafe(DEFAULT_SAVE)
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredCloneSafe(DEFAULT_SAVE)
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) {
      return structuredCloneSafe(DEFAULT_SAVE)
    }
    const source = parsed as Record<string, unknown>
    return {
      version: 1,
      stars: coerceStars(source['stars']),
      settings: coerceSettings(source['settings']),
    }
  } catch {
    return structuredCloneSafe(DEFAULT_SAVE)
  }
}

function structuredCloneSafe(save: SaveData): SaveData {
  return { version: save.version, stars: { ...save.stars }, settings: { ...save.settings } }
}

export function persistSave(save: SaveData): boolean {
  if (!storageAvailable()) return false
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, stars: save.stars, settings: save.settings }),
    )
    return true
  } catch {
    return false
  }
}

/** The "erase everything" button. Removes the key outright. */
export function clearSave(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* nothing to do — if storage is unavailable it cannot be holding data */
  }
}

/** Raw stored string, for the test that inspects exactly what left the app. */
export function readRawSave(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}
