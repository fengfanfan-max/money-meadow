import { useCallback, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'

import { IconRocket } from '../../components/Icons'
import { Illustration } from '../../components/Illustration'
import { Penny } from '../../components/Penny'
import { amountToWords, formatCents, useAnnounce } from '../../lib'
import type { SoundName } from '../../lib'
import {
  BOOST_CENTS,
  GOALS,
  WEEKLY_MAX_CENTS,
  WEEKLY_MIN_CENTS,
  WEEKLY_STEP_CENTS,
  describeWeeks,
  planForGoal,
} from './calc'

type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>

type SavingsGoalProps = {
  onExit: () => void
  playSound: (name: SoundName) => void
}

/** How many week-coins to draw before summarising the rest in words. */
const MAX_WEEK_COINS = 60

/**
 * Save Up! — the savings-goal calculator.
 *
 * This one is deliberately not a game. There is no score, no star rating and no
 * wrong answer, because there is nothing to get wrong: the child sets a rate and
 * the app tells them the truth about it. Putting stars on a calculator teaches
 * that the number is the answer to a test rather than the answer to a question.
 *
 * The two things it does that a plain calculator would not:
 *   - every input is announced in words, so "$3" is read as "three dollars";
 *   - the result is shown as one coin per week, which turns "23 weeks" from an
 *     abstraction into something a child can count.
 */
export function SavingsGoal({ onExit, playSound }: SavingsGoalProps) {
  const announce = useAnnounce()

  const [goalId, setGoalId] = useState<string>(GOALS[1]?.id ?? GOALS[0]!.id)
  const [savedCents, setSavedCents] = useState(500)
  const [weeklyCents, setWeeklyCents] = useState(300)

  const goal = useMemo(
    () => GOALS.find((candidate) => candidate.id === goalId) ?? GOALS[0]!,
    [goalId],
  )

  /**
   * "Today" is captured once for the session. Recomputing it on every render
   * would mean the projected finishing date could move while the child is
   * dragging a slider, which reads as a bug.
   */
  const [today] = useState(() => new Date())

  const plan = useMemo(
    () =>
      planForGoal({
        goalCents: goal.price,
        savedCents: Math.min(savedCents, goal.price),
        weeklyCents,
        from: today,
      }),
    [goal.price, savedCents, today, weeklyCents],
  )

  const handleGoal = useCallback(
    (id: string, name: string, price: number) => {
      playSound('tap')
      setGoalId(id)
      setSavedCents((value) => Math.min(value, price))
      announce(`${name}, ${formatCents(price)}.`)
    },
    [announce, playSound],
  )

  const handleSaved = useCallback(
    (cents: number) => {
      setSavedCents(cents)
      announce(`You already have ${amountToWords(Math.min(cents, goal.price))}.`)
    },
    [announce, goal.price],
  )

  const handleWeekly = useCallback(
    (cents: number) => {
      setWeeklyCents(cents)
      announce(`Saving ${amountToWords(cents)} each week.`)
    },
    [announce],
  )

  const jarPercent =
    goal.price === 0 ? 1 : Math.min(1, Math.max(0, savedCents / goal.price))

  /**
   * One coin per week, revealed as the fill rises. Coins are drawn rather than
   * scaled so they never stretch — a stretched coin is a strange thing to show a
   * child who is learning what a coin looks like.
   */
  const jarCoins = useMemo(() => {
    const levels = [0.14, 0.32, 0.5, 0.68, 0.86]
    return levels.map((level, index) => ({
      level,
      x: index % 2 === 0 ? 42 : 78,
      visible: jarPercent >= level,
    }))
  }, [jarPercent])

  const weekCoins = plan.status === 'planned' && plan.weeks !== null ? plan.weeks : 0
  const renderedWeekCoins = Math.min(weekCoins, MAX_WEEK_COINS)

  return (
    <div className="screen">
      <div className="screen-head">
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          ← Back
        </button>
        <div className="screen-head__titles">
          <h1 className="screen-head__title">Save Up!</h1>
          <p className="screen-head__meta">
            A savings calculator — nothing to win, just work out the plan
          </p>
        </div>
      </div>

      <section className="sticker stage" aria-labelledby="goal-heading">
        <h2 className="screen-head__title" id="goal-heading" style={{ fontSize: 'var(--text-xl)' }}>
          1. What are you saving for?
        </h2>
        <div className="goal-grid" role="group" aria-label="Choose something to save for">
          {GOALS.map((candidate) => (
            <button
              key={candidate.id}
              type="button"
              className="goal-card"
              aria-pressed={candidate.id === goalId}
              onClick={() => handleGoal(candidate.id, candidate.name, candidate.price)}
            >
              <Illustration name={candidate.art} className="goal-card__art" />
              <span className="goal-card__name">{candidate.name}</span>
              <span className="goal-card__price">{formatCents(candidate.price)}</span>
            </button>
          ))}
        </div>

        <div className="controls">
          <div className="control">
            <div className="control__row">
              <label className="control__label" htmlFor="saved-range">
                2. How much have you saved already?
              </label>
              <output className="control__value" htmlFor="saved-range">
                {formatCents(Math.min(savedCents, goal.price))}
              </output>
            </div>
            <input
              id="saved-range"
              className="range"
              type="range"
              min={0}
              max={goal.price}
              step={50}
              value={Math.min(savedCents, goal.price)}
              onChange={(event) => handleSaved(Number(event.target.value))}
              aria-valuetext={amountToWords(Math.min(savedCents, goal.price))}
            />
          </div>

          <div className="control">
            <div className="control__row">
              <label className="control__label" htmlFor="weekly-range">
                3. How much can you save each week?
              </label>
              <output className="control__value" htmlFor="weekly-range">
                {formatCents(weeklyCents)}
              </output>
            </div>
            <input
              id="weekly-range"
              className="range"
              type="range"
              min={WEEKLY_MIN_CENTS}
              max={WEEKLY_MAX_CENTS}
              step={WEEKLY_STEP_CENTS}
              value={weeklyCents}
              onChange={(event) => handleWeekly(Number(event.target.value))}
              aria-valuetext={amountToWords(weeklyCents)}
            />
          </div>
        </div>
      </section>

      <section className="sticker result" aria-labelledby="result-heading">
        <h2 className="screen-head__title" id="result-heading" style={{ fontSize: 'var(--text-xl)' }}>
          Your plan
        </h2>

        <div className="result__top">
          <div className="result__figures">
            {plan.status === 'planned' && plan.weeks !== null && (
              <>
                <p className="result__answer">
                  {plan.weeks === 1 ? '1 week' : `${plan.weeks} weeks`}
                  <small>{describeWeeks(plan.weeks)}</small>
                </p>
                <p className="result__when">
                  You would have {formatCents(goal.price)} by the week of{' '}
                  <strong>{plan.finishLabel}</strong>.
                </p>
                <p className="explanation__body">
                  {formatCents(plan.remainingCents)} still to save. On the last week you would
                  only need {formatCents(plan.lastWeekCents ?? 0)}.
                </p>
              </>
            )}

            {plan.status === 'done' && (
              <>
                <p className="result__answer">No weeks at all!</p>
                <p className="result__when">
                  You have already saved enough for the {goal.name.toLowerCase()}.{' '}
                  {formatCents(goal.price)} is all of it.
                </p>
              </>
            )}

            {plan.status === 'no-rate' && (
              <>
                <p className="result__answer">It never gets there</p>
                <p className="result__when">
                  Saving nothing each week means the {goal.name.toLowerCase()} never arrives. Move
                  the middle slider to something you can manage — even{' '}
                  {formatCents(WEEKLY_MIN_CENTS)} a week counts.
                </p>
              </>
            )}

            {plan.status === 'too-slow' && (
              <>
                <p className="result__answer">That is a long wait</p>
                <p className="result__when">
                  At {formatCents(weeklyCents)} a week, the {goal.name.toLowerCase()} would take
                  more than five years. Saving more each week is the only lever that moves it.
                </p>
              </>
            )}
          </div>

          <svg
            className="jar"
            viewBox="0 0 120 152"
            aria-hidden="true"
            focusable="false"
          >
            <defs>
              <clipPath id="money-meadow-jar-clip">
                <path d="M 22 36 H 98 V 116 C 98 134 86 146 72 146 H 48 C 34 146 22 134 22 116 Z" />
              </clipPath>
            </defs>

            <g clipPath="url(#money-meadow-jar-clip)">
              <rect
                className="jar__fill"
                x="22"
                y="36"
                width="76"
                height="110"
                style={
                  {
                    transform: `scaleY(${jarPercent})`,
                    fill: 'var(--sun)',
                  } as StyleWithVars
                }
              />
              {jarCoins.map((coin, index) =>
                coin.visible ? (
                  <circle
                    key={index}
                    className="jar__coin"
                    cx={coin.x}
                    cy={140 - coin.level * 104}
                    r="9"
                  />
                ) : null,
              )}
            </g>

            <path
              className="jar__glass"
              d="M 22 36 H 98 V 116 C 98 134 86 146 72 146 H 48 C 34 146 22 134 22 116 Z"
            />
            <rect className="jar__glass" x="40" y="16" width="40" height="20" rx="4" />
            <rect className="jar__glass" x="34" y="6" width="52" height="12" rx="5" />
            <text className="jar__label" x="60" y="80">
              {Math.round(jarPercent * 100)}%
            </text>
          </svg>
        </div>

        {weekCoins > 0 && (
          <div>
            <p className="tally__label">
              One coin for each week — count them and you have counted the weeks
            </p>
            <div className="week-coins">
              {Array.from({ length: renderedWeekCoins }, (_, index) => (
                <span
                  key={index}
                  className="week-coin"
                  style={
                    {
                      '--coin-delay': `${Math.min(index * 24, 900)}ms`,
                    } as StyleWithVars
                  }
                />
              ))}
              {weekCoins > renderedWeekCoins && (
                <span className="week-coins__more">
                  …and {weekCoins - renderedWeekCoins} more weeks
                </span>
              )}
            </div>
          </div>
        )}

        {plan.status === 'planned' &&
          plan.weeksSavedWithBoost !== null &&
          plan.weeksSavedWithBoost > 0 && (
            <div className="boost">
              <p className="boost__title">
                <IconRocket /> What if you saved{' '}
                {formatCents(BOOST_CENTS)} more each week?
              </p>
              <p className="explanation__body">
                At {formatCents(weeklyCents + BOOST_CENTS)} a week you would get there in{' '}
                <strong>{plan.weeksWithBoost} weeks</strong> — that is{' '}
                <strong>
                  {plan.weeksSavedWithBoost} {plan.weeksSavedWithBoost === 1 ? 'week' : 'weeks'}
                </strong>{' '}
                sooner.
              </p>
            </div>
          )}

        {plan.status === 'too-slow' && plan.weeksWithBoost !== null && (
          <div className="boost">
            <p className="boost__title">
              <IconRocket /> Try {formatCents(weeklyCents + BOOST_CENTS)} a week
            </p>
            <p className="explanation__body">
              That would get you the {goal.name.toLowerCase()} in {plan.weeksWithBoost} weeks.
            </p>
          </div>
        )}

        <div className="button-row">
          <Penny mood="thinking" style={{ width: 92, flex: 'none' }} />
          <p className="explanation__body" style={{ maxWidth: '46ch' }}>
            Move the sliders and watch what happens. Saving a little more each week is the only
            thing that shortens the wait — starting earlier is the other one.
          </p>
        </div>
      </section>
    </div>
  )
}
