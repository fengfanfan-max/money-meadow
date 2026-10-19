import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * A single announcement channel for the whole app.
 *
 * Games are mostly visual: a coin lands in the tray, confetti falls, a star
 * lights up. None of that reaches a screen reader on its own. Every meaningful
 * game event therefore also goes through here as a short sentence, which is the
 * difference between a game that a blind child can play and a game that merely
 * has alt text on its buttons.
 *
 * Two regions, for two different jobs:
 *   - polite: results and progress. Queued, never interrupts.
 *   - assertive: refusals and errors, where waiting for the current utterance to
 *     finish would leave the player confused about why nothing happened.
 */

type Priority = 'polite' | 'assertive'
type Announce = (message: string, priority?: Priority) => void

type Entry = { text: string; nonce: number }

const AnnouncerContext = createContext<Announce>(() => {})

export function AnnouncerProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState<Entry>({ text: '', nonce: 0 })
  const [assertive, setAssertive] = useState<Entry>({ text: '', nonce: 0 })
  const nonce = useRef(0)

  const announce = useCallback<Announce>((message, priority: Priority = 'polite') => {
    nonce.current += 1
    const entry: Entry = { text: message, nonce: nonce.current }
    if (priority === 'assertive') setAssertive(entry)
    else setPolite(entry)
  }, [])

  const value = useMemo(() => announce, [announce])

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      {/*
        The regions must exist in the DOM before their text changes, or the first
        announcement is regularly dropped. They are rendered empty on mount and
        only ever have their contents swapped.

        The inner span is keyed by nonce so that announcing the same sentence
        twice — "That is too much. Pick a smaller coin." — still mutates the DOM.
        Identical text in an unchanged node produces no announcement at all.
      */}
      <div aria-live="polite" aria-atomic="true" className="sr-only" data-testid="live-polite">
        <span key={polite.nonce}>{polite.text}</span>
      </div>
      <div aria-live="assertive" aria-atomic="true" className="sr-only" data-testid="live-assertive">
        <span key={assertive.nonce}>{assertive.text}</span>
      </div>
    </AnnouncerContext.Provider>
  )
}

/** Returns the announce function. Safe to call outside a provider — it no-ops. */
export function useAnnounce(): Announce {
  return useContext(AnnouncerContext)
}
