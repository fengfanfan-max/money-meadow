import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from 'react'

import type { Settings } from './storage'
import type { SoundName } from './audio'
import { createSoundPlayer } from './audio'
import { loadSave, clearSave, persistSave } from './storage'
import type { GameId, SaveData } from './storage'

const REDUCE_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function subscribeToMotionPreference(onChange: () => void): () => void {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {}
  const media = window.matchMedia(REDUCE_MOTION_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function systemPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia(REDUCE_MOTION_QUERY).matches
}

/** Reads the operating system's motion preference and keeps up with changes. */
export function useSystemReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeToMotionPreference,
    systemPrefersReducedMotion,
    () => false,
  )
}

/**
 * The persistence + preferences store.
 *
 * Deliberately a plain hook rather than a context: there is exactly one consumer
 * tree and no server state, so a store library would be more machinery than the
 * problem needs.
 */
export function useAppStore() {
  const [save, setSave] = useState<SaveData>(() => loadSave())
  const systemReduceMotion = useSystemReducedMotion()

  /**
   * Resolved motion preference. An explicit in-app choice wins over the OS, which
   * is the WCAG-respecting order: the OS setting is the default, and a user who
   * has found the switch has made a more recent, more specific decision.
   */
  const reduceMotion = save.settings.reduceMotion ?? systemReduceMotion

  const soundEnabledRef = useRef(save.settings.sound)
  soundEnabledRef.current = save.settings.sound

  const player = useMemo(
    () => createSoundPlayer(() => soundEnabledRef.current),
    [],
  )

  const playSound = useCallback(
    (name: SoundName) => {
      player.play(name)
    },
    [player],
  )

  const commit = useCallback((next: SaveData) => {
    setSave(next)
    persistSave(next)
  }, [])

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      setSave((previous) => {
        const next: SaveData = {
          ...previous,
          settings: { ...previous.settings, ...patch },
        }
        persistSave(next)
        return next
      })
    },
    [],
  )

  const awardStars = useCallback((game: GameId, stars: number) => {
    const clamped = Math.min(3, Math.max(0, Math.round(stars)))
    setSave((previous) => {
      const best = Math.max(previous.stars[game] ?? 0, clamped)
      const next: SaveData = { ...previous, stars: { ...previous.stars, [game]: best } }
      persistSave(next)
      return next
    })
  }, [])

  /** The "erase everything" control promised on the grown-ups panel. */
  const eraseEverything = useCallback(() => {
    clearSave()
    setSave({ version: 1, stars: {}, settings: { sound: false, reduceMotion: null } })
  }, [])

  const totalStars = Object.values(save.stars).reduce((sum, value) => sum + (value ?? 0), 0)

  return {
    save,
    settings: save.settings,
    stars: save.stars,
    totalStars,
    reduceMotion,
    systemReduceMotion,
    playSound,
    updateSettings,
    awardStars,
    eraseEverything,
    commit,
  }
}

export type AppStore = ReturnType<typeof useAppStore>
