import { useCallback, useState } from 'react'

import { CoinButton, CoinIcon } from '../../components/Coins'
import { CoinBurst } from '../../components/CoinBurst'
import { Confetti } from '../../components/Confetti'
import { IconSparkle, IconTick, IconTrophy } from '../../components/Icons'
import { Illustration } from '../../components/Illustration'
import { Penny } from '../../components/Penny'
import { Stars } from '../../components/Stars'
import { COIN_VALUES, amountToWords, formatCents, useAnnounce } from '../../lib'
import type { CoinValue, SoundName } from '../../lib'
import { SHOP_ROUNDS, addCoin, optimalCoinCount, payState, rateGame, undoCoin } from './logic'

type Phase = 'playing' | 'round-complete' | 'complete'

type CoinCatchProps = {
  onExit: () => void
  onAward: (stars: number) => void
  playSound: (name: SoundName) => void
  reduceMotion: boolean
}

const TOTAL_ROUNDS = SHOP_ROUNDS.length

/**
 * Coin Catch.
 *
 * The game is a self-checking puzzle: the tray can never go over the price,
 * because overshooting is refused rather than penalised. That single rule is why
 * there is no "wrong answer" state, no undo-the-mistake flow, and no way for a
 * child to get stuck.
 *
 * Everything the child learns from looking at this screen is also announced:
 * the running total, how much is left, and by how much a coin was too big. The
 * confetti and Penny's hop are decoration on top of that, never the message.
 */
export function CoinCatch({ onExit, onAward, playSound, reduceMotion }: CoinCatchProps) {
  const announce = useAnnounce()

  const [roundIndex, setRoundIndex] = useState(0)
  const [coins, setCoins] = useState<CoinValue[]>([])
  const [perfectRounds, setPerfectRounds] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0)
  const [refusal, setRefusal] = useState<{ coin: CoinValue; pulse: number } | null>(null)
  const [attempt, setAttempt] = useState(0)

  const round = SHOP_ROUNDS[roundIndex] ?? SHOP_ROUNDS[0]!
  const state = payState(coins, round.price)
  const optimal = optimalCoinCount(round.price)
  const usedOptimal = coins.length === optimal
  const locked = phase !== 'playing'

  const resetForRound = useCallback(() => {
    setCoins([])
    setRefusal(null)
    setPhase('playing')
  }, [])

  const handlePick = useCallback(
    (coin: CoinValue) => {
      const result = addCoin(coins, round.price, coin)

      if (!result.ok) {
        setRefusal({ coin, pulse: attempt + 1 })
        setAttempt((value) => value + 1)
        playSound('wrong')
        announce(
          `That is ${formatCents(result.over)} too much. Try a smaller coin.`,
          'assertive',
        )
        return
      }

      setCoins(result.coins)
      playSound(result.exact ? 'correct' : 'coin')

      const nextState = payState(result.coins, round.price)

      if (!result.exact) {
        announce(
          `${formatCents(nextState.paid)} paid. ${formatCents(nextState.remaining)} to go.`,
        )
        return
      }

      const perfect = result.coins.length === optimal
      const nextPerfect = perfectRounds + (perfect ? 1 : 0)
      const isLastRound = roundIndex === TOTAL_ROUNDS - 1

      setPerfectRounds(nextPerfect)

      if (isLastRound) {
        const awarded = rateGame(nextPerfect, TOTAL_ROUNDS)
        setStars(awarded)
        setPhase('complete')
        onAward(awarded)
        announce(
          `Exactly ${formatCents(round.price)}. That is all ${TOTAL_ROUNDS} items paid for. ` +
            `You earned ${awarded} of 3 stars.`,
        )
        return
      }

      setPhase('round-complete')
      announce(
        perfect
          ? `Exactly ${formatCents(round.price)}, and you used the fewest coins possible. Perfect.`
          : `Exactly ${formatCents(round.price)}. Well done.`,
      )
    },
    [
      announce,
      attempt,
      coins,
      onAward,
      optimal,
      perfectRounds,
      playSound,
      round.price,
      roundIndex,
    ],
  )

  const handleNext = useCallback(() => {
    playSound('tap')
    setRoundIndex((index) => Math.min(index + 1, TOTAL_ROUNDS - 1))
    resetForRound()
    announce(`Item ${Math.min(roundIndex + 2, TOTAL_ROUNDS)} of ${TOTAL_ROUNDS}.`)
  }, [announce, playSound, resetForRound, roundIndex])

  const handleUndo = useCallback(() => {
    if (coins.length === 0) return
    playSound('tap')
    const next = undoCoin(coins)
    setCoins(next)
    const nextState = payState(next, round.price)
    announce(`Took one coin back. ${formatCents(nextState.paid)} paid.`)
  }, [announce, coins, playSound, round.price])

  const handleRestartRound = useCallback(() => {
    playSound('tap')
    resetForRound()
    announce('Tray cleared. Nothing paid yet.')
  }, [announce, playSound, resetForRound])

  const handleHint = useCallback(() => {
    playSound('pop')
    announce(
      `A hint: ${formatCents(round.price)} can be paid with ${optimal} ${optimal === 1 ? 'coin' : 'coins'}. ` +
        'Start with the biggest coin that still fits.',
    )
  }, [announce, optimal, playSound, round.price])

  const handlePlayAgain = useCallback(() => {
    playSound('tap')
    setRoundIndex(0)
    setPerfectRounds(0)
    setStars(0)
    resetForRound()
    announce(`Starting again. Item 1 of ${TOTAL_ROUNDS}.`)
  }, [announce, playSound, resetForRound])

  const pennyMood = phase === 'complete' ? 'cheer' : phase === 'round-complete' ? 'happy' : 'idle'

  return (
    <div className="screen">
      <div className="screen-head">
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          ← Back
        </button>
        <div className="screen-head__titles">
          <h1 className="screen-head__title">Coin Catch</h1>
          <p className="screen-head__meta">
            {phase === 'complete'
              ? 'All done'
              : `Item ${roundIndex + 1} of ${TOTAL_ROUNDS}`}
          </p>
        </div>
        {phase !== 'complete' && (
          /* Keyed on the count so the chip remounts and re-bounces each time a
             level is paid with the fewest coins — the one moment worth drawing
             the eye back up here. */
          <span
            key={`chip-${perfectRounds}`}
            className={perfectRounds > 0 ? 'screen-head__meta pop' : 'screen-head__meta'}
          >
            Fewest coins so far: {perfectRounds} of {roundIndex + (phase === 'round-complete' ? 1 : 0)}
          </span>
        )}
      </div>

      {phase === 'complete' ? (
        <section className="sticker stage" aria-labelledby="coins-complete-heading">
          <Confetti seed={stars * 977 + perfectRounds} enabled={!reduceMotion} />
          {!reduceMotion && <CoinBurst seed={perfectRounds * 53 + 11} pieces={24} />}
          <div className="shop-item">
            <Penny mood={pennyMood} style={{ width: 'clamp(120px, 26vw, 180px)', flex: 'none' }} />
            <div className="shop-item__text">
              <h2 className="shop-item__name" id="coins-complete-heading">
                <span className="celebration-mark" aria-hidden="true">
                  <IconTrophy />
                </span>
                Everything paid for!
              </h2>
              <p className="shop-item__question">
                You paid with the smallest number of coins in {perfectRounds} of {TOTAL_ROUNDS}{' '}
                {TOTAL_ROUNDS === 1 ? 'item' : 'items'}.
              </p>
              <Stars count={stars} label="Coin Catch" />
            </div>
          </div>
          <div className="button-row">
            <button type="button" className="btn btn--sun" onClick={handlePlayAgain}>
              Play again
            </button>
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              Choose another game
            </button>
          </div>
        </section>
      ) : (
        <>
          <section className="sticker stage" aria-labelledby="coins-item-heading">
            <div className="shop-item">
              <div className="shop-item__art">
                <Illustration name={round.art} style={{ width: 60 }} />
              </div>
              <div className="shop-item__text">
                <h2 className="shop-item__name" id="coins-item-heading">
                  {round.name}
                </h2>
                <p className="shop-item__question">Pay for it with exactly the right coins.</p>
              </div>
              <div className="price-tag-wrap">
                <p className="price-tag">
                  <span className="sr-only">Price: {amountToWords(round.price)}. </span>
                  <span aria-hidden="true">{formatCents(round.price)}</span>
                </p>
                {/*
                  The stamp lands on the price tag rather than on the tray, so the
                  coins the child just spent stay visible underneath. It is
                  aria-hidden: it repeats what the live region has already said in
                  a full sentence, and a decorative "PAID" being announced on top
                  of that would be noise.
                */}
                {phase === 'round-complete' && (
                  <span className="stamp" aria-hidden="true">
                    <IconTick /> Paid!
                  </span>
                )}
              </div>
            </div>

            <div className="tally">
              <div className="tally__cell">
                <span className="tally__label" id="tally-paid-label">
                  You have paid
                </span>
                {/* The class is toggled rather than left on, so the bounce replays
                    on every level rather than only the first. */}
                <span className={phase === 'round-complete' ? 'tally__value pop' : 'tally__value'}>
                  {formatCents(state.paid)}
                </span>
              </div>
              <div
                className={
                  phase === 'round-complete'
                    ? 'tally__cell tally__cell--goal flash-mint'
                    : 'tally__cell tally__cell--goal'
                }
              >
                <span className="tally__label" id="tally-left-label">
                  Still to pay
                </span>
                <span className="tally__value">{formatCents(state.remaining)}</span>
              </div>
            </div>

            <div className="tray-field">
              <span className="tally__label">Your coins</span>
              <div className={state.coins.length === 0 ? 'tray tray--empty' : 'tray'}>
                {state.coins.length === 0 ? (
                  <span className="tray__hint">Tap a coin below to pay with it</span>
                ) : (
                  state.coins.map((coin, index) => (
                    <CoinIcon key={`${coin}-${index}`} value={coin} />
                  ))
                )}
              </div>
              {/*
                The coins leave the tray as the level is cleared. Keyed by the
                round so each level gets its own burst rather than the component
                being reused with a finished animation.

                Not rendered at all under reduced motion: the celebration is
                decoration, and the sentence in the feedback banner already says
                what happened.
              */}
              {phase === 'round-complete' && !reduceMotion && (
                <CoinBurst key={`burst-${roundIndex}`} seed={roundIndex * 31 + 7} />
              )}
            </div>

            <div>
              <span className="tally__label">Tap a coin</span>
              <div className="coin-rack">
                {COIN_VALUES.map((value) => (
                  <CoinButton
                    key={value}
                    value={value}
                    onPick={handlePick}
                    disabled={locked}
                    refusePulse={refusal?.coin === value ? refusal.pulse : 0}
                  />
                ))}
              </div>
              <p className="coin-slot-count">
                Coins used: {state.coins.length}
                {state.coins.length > 0 && usedOptimal ? ' — the fewest possible!' : ''}
              </p>
            </div>

            <div className="button-row">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleUndo}
                disabled={locked || state.coins.length === 0}
              >
                Take one back
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleRestartRound}
                disabled={locked || state.coins.length === 0}
              >
                Start again
              </button>
              <button type="button" className="btn btn--plain" onClick={handleHint}>
                Give me a hint
              </button>
            </div>
          </section>

          {phase === 'round-complete' && (
            <section
              className={usedOptimal ? 'feedback feedback--good' : 'feedback feedback--info'}
            >
              <span className="feedback__mark">
                {usedOptimal ? <IconSparkle /> : <IconTick />}
              </span>
              <div>
                <p>
                  {usedOptimal
                    ? `Perfect — ${formatCents(round.price)} with only ${optimal} ${
                        optimal === 1 ? 'coin' : 'coins'
                      }.`
                    : `That is exactly ${formatCents(round.price)}.`}
                </p>
                <p>
                  {usedOptimal
                    ? 'You found the smallest number of coins.'
                    : `You could do it with ${optimal} ${
                        optimal === 1 ? 'coin' : 'coins'
                      }. Try the next one that way.`}
                </p>
              </div>
            </section>
          )}

          {phase === 'round-complete' && (
            <div className="button-row button-row--center">
              <button type="button" className="btn btn--sun btn--lg" onClick={handleNext}>
                Next item →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
