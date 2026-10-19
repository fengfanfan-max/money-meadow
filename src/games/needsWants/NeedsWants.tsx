import { useCallback, useState } from 'react'

import { IconBulb, IconSparkle, IconTick } from '../../components/Icons'
import { Illustration } from '../../components/Illustration'
import { Confetti } from '../../components/Confetti'
import { Penny } from '../../components/Penny'
import { Stars } from '../../components/Stars'
import { useAnnounce } from '../../lib'
import type { SoundName } from '../../lib'
import { ANSWER_DEFINITIONS, ANSWER_LABELS, ROUND_SIZE } from './data'
import type { SortAnswer, SortItem } from './data'
import { isCorrect, pickRound, rateGame } from './logic'

type Phase = 'playing' | 'answered' | 'complete'

type NeedsWantsProps = {
  onExit: () => void
  onAward: (stars: number) => void
  playSound: (name: SoundName) => void
  reduceMotion: boolean
}

/**
 * Need or Want?
 *
 * Two large tap targets rather than drag-and-drop. Drag is the obvious choice
 * for a sorting game and the wrong one here: it is unusable with a switch or a
 * keyboard without building an entire parallel interaction, it demands the motor
 * control to hold a drag steady, and on a tablet it fights the browser's own
 * scroll gesture. Two buttons that a child can hit with a thumb do the same job.
 *
 * After every answer the item's reason appears — written to be true either way —
 * followed by a question for a grown-up. The conversation is the point; the
 * score is the excuse.
 */
export function NeedsWants({ onExit, onAward, playSound, reduceMotion }: NeedsWantsProps) {
  const announce = useAnnounce()

  const [round, setRound] = useState<SortItem[]>(() => pickRound())
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState<SortAnswer | null>(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [phase, setPhase] = useState<Phase>('playing')
  const [stars, setStars] = useState<0 | 1 | 2 | 3>(0)

  const item = round[index] ?? round[0]!
  const total = round.length
  const wasCorrect = answer !== null && isCorrect(item, answer)

  const handleAnswer = useCallback(
    (choice: SortAnswer) => {
      if (phase !== 'playing') return

      const right = isCorrect(item, choice)
      const nextCorrect = correctCount + (right ? 1 : 0)

      setAnswer(choice)
      setCorrectCount(nextCorrect)
      setPhase('answered')
      playSound(right ? 'correct' : 'wrong')

      announce(
        `${right ? 'Yes' : 'Not quite'}. ${item.name} is a ${item.answer}. ${item.reason}`,
        right ? 'polite' : 'assertive',
      )
    },
    [announce, correctCount, item, phase, playSound],
  )

  const handleNext = useCallback(() => {
    const isLast = index === total - 1

    if (isLast) {
      const awarded = rateGame(correctCount, total)
      setStars(awarded)
      setPhase('complete')
      onAward(awarded)
      playSound('win')
      announce(
        `All ${total} sorted. You agreed with the answer ${correctCount} times. ` +
          `You earned ${awarded} of 3 stars.`,
      )
      return
    }

    playSound('tap')
    setIndex((value) => value + 1)
    setAnswer(null)
    setPhase('playing')
    announce(`Item ${index + 2} of ${total}.`)
  }, [announce, correctCount, index, onAward, playSound, total])

  const handlePlayAgain = useCallback(() => {
    playSound('tap')
    setRound(pickRound())
    setIndex(0)
    setAnswer(null)
    setCorrectCount(0)
    setStars(0)
    setPhase('playing')
    announce(`New round. Item 1 of ${ROUND_SIZE}.`)
  }, [announce, playSound])

  if (phase === 'complete') {
    return (
      <div className="screen">
        <div className="screen-head">
          <button type="button" className="btn btn--ghost" onClick={onExit}>
            ← Back
          </button>
          <div className="screen-head__titles">
            <h1 className="screen-head__title">Need or Want?</h1>
            <p className="screen-head__meta">All done</p>
          </div>
        </div>

        <section className="sticker stage" aria-labelledby="sort-complete-heading">
          <Confetti seed={correctCount * 613 + total} enabled={!reduceMotion} />
          <div className="shop-item">
            <Penny
              mood="cheer"
              style={{ width: 'clamp(120px, 26vw, 180px)', flex: 'none' }}
            />
            <div className="shop-item__text">
              <h2 className="shop-item__name" id="sort-complete-heading">
                That is the whole basket sorted
              </h2>
              <p className="shop-item__question">
                You agreed with the answer {correctCount} out of {total} times.
              </p>
              <Stars count={stars} label="Need or Want?" />
            </div>
          </div>
          <p className="explanation__body">
            {ANSWER_DEFINITIONS.need} {ANSWER_DEFINITIONS.want}
          </p>
          <div className="button-row">
            <button type="button" className="btn btn--sun" onClick={handlePlayAgain}>
              Play again
            </button>
            <button type="button" className="btn btn--ghost" onClick={onExit}>
              Choose another game
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="screen">
      <div className="screen-head">
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          ← Back
        </button>
        <div className="screen-head__titles">
          <h1 className="screen-head__title">Need or Want?</h1>
          <p className="screen-head__meta">
            Item {index + 1} of {total}
          </p>
        </div>
        <span className="screen-head__meta">
          Right so far: {correctCount} of {index + (phase === 'answered' ? 1 : 0)}
        </span>
      </div>

      <section className="sticker" aria-labelledby="sort-item-heading">
        <div className="item-stage">
          <div className="item-stage__art">
            <Illustration name={item.art} style={{ width: '72%' }} />
          </div>
          <h2 className="item-stage__name" id="sort-item-heading">
            {item.name}
          </h2>
          <p className="item-stage__prompt">
            {phase === 'answered'
              ? 'Here is the thinking.'
              : 'Would you say you need this, or do you want it?'}
          </p>
        </div>

        <div style={{ padding: '0 var(--space-5) var(--space-5)' }}>
          <div className="bins">
            <button
              type="button"
              className={`bin bin--need${answer === 'need' ? ' bin--chosen' : ''}`}
              onClick={() => handleAnswer('need')}
              disabled={phase !== 'playing'}
              aria-describedby="need-definition"
            >
              <Illustration name="heart" className="bin__icon" />
              <span>{ANSWER_LABELS.need}</span>
              <span className="bin__hint" id="need-definition">
                Keeps you healthy or safe
              </span>
              {answer === 'need' && (
                <span className="bin__verdict">
                  <IconTick /> You chose this
                </span>
              )}
            </button>

            <button
              type="button"
              className={`bin bin--want${answer === 'want' ? ' bin--chosen' : ''}`}
              onClick={() => handleAnswer('want')}
              disabled={phase !== 'playing'}
              aria-describedby="want-definition"
            >
              <Illustration name="star" className="bin__icon" />
              <span>{ANSWER_LABELS.want}</span>
              <span className="bin__hint" id="want-definition">
                Nice to have, not essential
              </span>
              {answer === 'want' && (
                <span className="bin__verdict">
                  <IconTick /> You chose this
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {phase === 'answered' && (
        <section
          className={`sticker explanation`}
          aria-labelledby="sort-explanation-heading"
        >
          <p className="explanation__headline">
            <span className="explanation__mark">
              {wasCorrect ? <IconSparkle /> : <IconBulb />}
            </span>
            <span id="sort-explanation-heading">
              {wasCorrect ? 'That is right.' : 'Have another look.'}
            </span>
          </p>
          <p className="explanation__body">
            <strong>{item.name}</strong> is a <strong>{item.answer}</strong>. {item.reason}
          </p>
          <p className="explanation__talk">
            <strong>Talk about it:</strong> {item.talk}
          </p>
          <div className="button-row">
            <button type="button" className="btn btn--sun btn--lg" onClick={handleNext}>
              {index === total - 1 ? 'See how I did →' : 'Next item →'}
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
