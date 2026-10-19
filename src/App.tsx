import { useCallback, useEffect, useRef, useState } from 'react'

import { GrownUps } from './components/GrownUps'
import { IconLock, IconSoundOff, IconSoundOn } from './components/Icons'
import { PennyMark } from './components/Penny'
import { CoinCatch } from './games/coinCatch/CoinCatch'
import { NeedsWants } from './games/needsWants/NeedsWants'
import { SavingsGoal } from './games/savingsGoal/SavingsGoal'
import { AnnouncerProvider, useAnnounce, useAppStore } from './lib'
import type { GameId } from './lib'
import { Home } from './screens/Home'

type Screen = 'home' | GameId

/**
 * Full document titles rather than "screen — brand" composed on the fly.
 * Composing produced "Money Meadow — Money Meadow" on the home screen, which is
 * the kind of thing a client notices in the browser tab before they notice
 * anything you actually built.
 */
const PAGE_TITLES: Record<Screen, string> = {
  home: 'Money Meadow — money skills mini-games for kids',
  coins: 'Coin Catch — Money Meadow',
  sort: 'Need or Want? — Money Meadow',
  goal: 'Save Up! — Money Meadow',
}

/** One polite sentence per screen change, so the move is not silent. */
const SCREEN_ANNOUNCEMENTS: Record<Screen, string> = {
  home: 'Money Meadow. Choose a game.',
  coins: 'Coin Catch. Pay for each item with exactly the right coins.',
  sort: 'Need or Want? Sort each thing into needs and wants.',
  goal: 'Save Up! Choose something to save for and see how many weeks it takes.',
}

export function App() {
  return (
    <AnnouncerProvider>
      <AppShell />
    </AnnouncerProvider>
  )
}

function AppShell() {
  const store = useAppStore()
  const announce = useAnnounce()

  const [screen, setScreen] = useState<Screen>('home')
  const [grownUpsOpen, setGrownUpsOpen] = useState(false)
  const mainRef = useRef<HTMLElement>(null)
  const isFirstRender = useRef(true)

  /**
   * The motion preference is published on the document element rather than
   * applied inline, because the CSS that acts on it is a global rule — see the
   * note in base.css about why the media query is scoped to exclude this
   * attribute.
   */
  useEffect(() => {
    document.documentElement.dataset['reduceMotion'] = store.reduceMotion ? 'true' : 'false'
  }, [store.reduceMotion])

  useEffect(() => {
    document.title = PAGE_TITLES[screen]
  }, [screen])

  /**
   * Focus and announce on screen change.
   *
   * Moving focus to the main region is what stops a keyboard user from having to
   * tab through the header again after every game, and it is what makes a screen
   * change perceptible to a screen reader at all — nothing else about replacing
   * the contents of <main> is announced. The first render is skipped so that
   * loading the page does not steal focus.
   */
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    mainRef.current?.focus()
    window.scrollTo({ top: 0, behavior: store.reduceMotion ? 'auto' : 'smooth' })
    announce(SCREEN_ANNOUNCEMENTS[screen])
  }, [announce, screen, store.reduceMotion])

  const handlePlay = useCallback((game: GameId) => {
    setScreen(game)
  }, [])

  const handleExit = useCallback(() => {
    setScreen('home')
  }, [])

  const handleAward = useCallback(
    (game: GameId, stars: number) => {
      store.awardStars(game, stars)
    },
    [store],
  )

  const handleToggleSound = useCallback(() => {
    const next = !store.settings.sound
    store.updateSettings({ sound: next })
    if (next) store.playSound('pop')
    announce(next ? 'Sound is on.' : 'Sound is off.')
  }, [announce, store])

  return (
    <div className="app">
      <a className="skip-link" href="#main">
        Skip to the games
      </a>

      <header className="topbar">
        <div className="brand">
          <PennyMark className="brand__mark" />
          <span className="brand__text">
            <span className="brand__name">Money Meadow</span>
            <span className="brand__tag">money skills, played</span>
          </span>
        </div>

        <div className="topbar__actions">
          <button
            type="button"
            className="btn btn--ghost sound-toggle"
            onClick={handleToggleSound}
            aria-pressed={store.settings.sound}
          >
            {store.settings.sound ? <IconSoundOn /> : <IconSoundOff />}
            <span className="sound-toggle__label">Sound</span>
            <span className="sr-only">{store.settings.sound ? 'off' : 'on'}</span>
          </button>

          <button
            type="button"
            className="btn btn--sun"
            onClick={() => setGrownUpsOpen(true)}
          >
            For grown-ups
          </button>
        </div>
      </header>

      {/*
        tabIndex={-1} makes this programmatically focusable without adding it to
        the tab order, which is what the focus-on-screen-change effect needs.
      */}
      <main className="shell" id="main" ref={mainRef} tabIndex={-1}>
        {screen === 'home' && (
          <Home
            stars={store.stars}
            onPlay={handlePlay}
            onOpenGrownUps={() => setGrownUpsOpen(true)}
          />
        )}

        {screen === 'coins' && (
          <CoinCatch
            onExit={handleExit}
            onAward={(stars) => handleAward('coins', stars)}
            playSound={store.playSound}
            reduceMotion={store.reduceMotion}
          />
        )}

        {screen === 'sort' && (
          <NeedsWants
            onExit={handleExit}
            onAward={(stars) => handleAward('sort', stars)}
            playSound={store.playSound}
            reduceMotion={store.reduceMotion}
          />
        )}

        {screen === 'goal' && (
          <SavingsGoal onExit={handleExit} playSound={store.playSound} />
        )}
      </main>

      <footer className="footer">
        <span className="footer__badge">
          <IconLock /> No accounts · no ads · nothing sent anywhere
        </span>
        <span>
          Progress is kept in this browser only. {store.totalStars}{' '}
          {store.totalStars === 1 ? 'star' : 'stars'} collected so far.
        </span>
      </footer>

      <GrownUps
        open={grownUpsOpen}
        onClose={() => setGrownUpsOpen(false)}
        settings={store.settings}
        systemReduceMotion={store.systemReduceMotion}
        onUpdateSettings={store.updateSettings}
        onEraseEverything={store.eraseEverything}
      />
    </div>
  )
}
