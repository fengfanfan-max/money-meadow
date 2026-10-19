import { assertCents } from '../../lib'
import type { Cents } from '../../lib'
import type { IllustrationName } from '../../components/Illustration'

/**
 * Save Up! — the savings-goal calculator.
 *
 * Three things in here are deliberate, and each of them is a bug avoided:
 *
 *  1. Cents stay integers. Dividing money into weeks produces fractions, and a
 *     child who is told to save "$3.333 a week" learns that money is confusing.
 *     Everything is ceilinged to whole weeks of whole cents.
 *
 *  2. Zero is not a slow rate, it is no rate at all. Dividing by a zero weekly
 *     saving yields Infinity, and Infinity rendered into a sentence is how a
 *     calculator tells a child something false. That case has its own status.
 *
 *  3. There is a horizon. A plan that finishes in 400 years is not a plan, so
 *     past five years the calculator says so and suggests a faster rate.
 *
 * This game is not scored, unlike the other two. It is a calculator, and putting
 * stars on it would imply there is a way to get it wrong — there is not. The
 * child sets a rate and the app tells them the truth about it.
 */

export type Goal = {
  id: string
  name: string
  price: Cents
  art: IllustrationName
}

export const GOALS: readonly Goal[] = [
  { id: 'artset', name: 'Art set', price: 2400, art: 'artset' },
  { id: 'skateboard', name: 'Skateboard', price: 4500, art: 'skateboard' },
  { id: 'telescope', name: 'Telescope', price: 7200, art: 'telescope' },
  { id: 'bike', name: 'Bike', price: 12000, art: 'bike' },
]

/** The "what if you saved a bit more" nudge. Two dollars a week. */
export const BOOST_CENTS: Cents = 200

/** Five years. Beyond this the answer stops being useful advice. */
export const MAX_WEEKS = 260

export const WEEKLY_MIN_CENTS: Cents = 50
export const WEEKLY_MAX_CENTS: Cents = 1500
export const WEEKLY_STEP_CENTS: Cents = 50

export type PlanStatus =
  /** The goal is already met. */
  | 'done'
  /** A real, reachable plan. */
  | 'planned'
  /** Nothing is being saved each week, so it never arrives. */
  | 'no-rate'
  /** Reachable in principle, but further away than the horizon. */
  | 'too-slow'

export type Plan = {
  status: PlanStatus
  remainingCents: Cents
  savedCents: Cents
  goalCents: Cents
  /** Whole weeks. Null unless status is 'planned'. */
  weeks: number | null
  finish: Date | null
  /** Localised "15 December", or "15 December 2027" when the year differs. */
  finishLabel: string | null
  /** Weeks if the child saved {@link BOOST_CENTS} more each week. */
  weeksWithBoost: number | null
  /** How many weeks sooner that is. Null when there is nothing to compare. */
  weeksSavedWithBoost: number | null
  /**
   * What the final week actually needs. Usually the weekly rate, but the last
   * week is a part week more often than not, and "your last week only needs
   * $1.50" is the detail that makes a long plan feel finishable.
   */
  lastWeekCents: Cents | null
}

export type PlanInput = {
  goalCents: Cents
  savedCents: Cents
  weeklyCents: Cents
  /** The date "today" is taken to be. Injected so tests are not clock-dependent. */
  from: Date
  /**
   * Defaults to `en-US`, and deliberately does not default to the host locale.
   *
   * Passing `undefined` to Intl means "use the browser's locale", which renders
   * this app's only date as "22 January 2027" on an English machine and
   * "2027年1月22日" on a Chinese one. The interface is written in English, so the
   * date has to be too — a demo whose language changes with the reviewer's
   * laptop is a demo that looks broken to at least one of them.
   */
  locale?: string
}

/** Whole weeks of whole cents needed, or null when the rate never gets there. */
export function weeksToSave(remainingCents: Cents, weeklyCents: Cents): number | null {
  const remaining = assertCents(remainingCents, 'remaining')
  if (remaining === 0) return 0
  if (weeklyCents <= 0) return null
  return Math.ceil(remaining / weeklyCents)
}

/**
 * Adds whole weeks using calendar arithmetic.
 *
 * `setDate` rather than adding `weeks * 7 * 86400000` milliseconds: across a
 * daylight-saving boundary the millisecond version lands an hour early, which
 * occasionally means landing on the previous day.
 */
export function addWeeks(from: Date, weeks: number): Date {
  const result = new Date(from.getTime())
  result.setDate(result.getDate() + weeks * 7)
  return result
}

/** The interface is English; dates are formatted in English regardless of host locale. */
export const UI_LOCALE = 'en-US'

export function formatWeekOf(
  date: Date,
  from: Date,
  locale: string = UI_LOCALE,
): string {
  const sameYear = date.getFullYear() === from.getFullYear()
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }
  if (!sameYear) options.year = 'numeric'
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * Rough human duration, for when "23 weeks" is harder to picture than "about
 * five months". Uses 4.35 weeks per month — the actual average — rather than 4,
 * which drifts by nearly a month over a year.
 */
export function describeWeeks(weeks: number): string {
  if (weeks <= 0) return 'today'
  if (weeks === 1) return '1 week'
  if (weeks < 9) return `${weeks} weeks`

  const months = Math.round(weeks / 4.35)
  if (weeks < 52) return `${weeks} weeks — about ${months} months`

  const years = weeks / 52
  const rounded = Math.round(years * 10) / 10
  return `${weeks} weeks — about ${rounded === 1 ? 'a year' : `${rounded} years`}`
}

export function planForGoal(input: PlanInput): Plan {
  const goalCents = assertCents(input.goalCents, 'goal')
  const savedCents = Math.min(assertCents(input.savedCents, 'saved'), goalCents)
  const weeklyCents = assertCents(input.weeklyCents, 'weekly')
  const { from } = input
  const locale = input.locale ?? UI_LOCALE

  const remainingCents = goalCents - savedCents

  if (remainingCents === 0) {
    return {
      status: 'done',
      remainingCents: 0,
      savedCents,
      goalCents,
      weeks: 0,
      finish: null,
      finishLabel: null,
      weeksWithBoost: 0,
      weeksSavedWithBoost: null,
      lastWeekCents: 0,
    }
  }

  const rawWeeks = weeksToSave(remainingCents, weeklyCents)

  if (rawWeeks === null) {
    return {
      status: 'no-rate',
      remainingCents,
      savedCents,
      goalCents,
      weeks: null,
      finish: null,
      finishLabel: null,
      weeksWithBoost: null,
      weeksSavedWithBoost: null,
      lastWeekCents: null,
    }
  }

  // The rate is positive whenever remaining is positive, so this is never null.
  const boostWeeks = weeksToSave(remainingCents, weeklyCents + BOOST_CENTS) ?? 0
  const lastWeekCents = remainingCents - weeklyCents * (rawWeeks - 1)

  if (rawWeeks > MAX_WEEKS) {
    return {
      status: 'too-slow',
      remainingCents,
      savedCents,
      goalCents,
      weeks: null,
      finish: null,
      finishLabel: null,
      // Still worth answering "what if you saved more", because that is the
      // actionable half of this state.
      weeksWithBoost: boostWeeks > MAX_WEEKS ? null : boostWeeks,
      weeksSavedWithBoost: null,
      lastWeekCents: null,
    }
  }

  const finish = addWeeks(from, rawWeeks)

  return {
    status: 'planned',
    remainingCents,
    savedCents,
    goalCents,
    weeks: rawWeeks,
    finish,
    finishLabel: formatWeekOf(finish, from, locale),
    weeksWithBoost: boostWeeks,
    weeksSavedWithBoost: rawWeeks - boostWeeks,
    lastWeekCents,
  }
}
