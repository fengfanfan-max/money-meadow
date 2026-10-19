import { describe, expect, it } from 'vitest'

import {
  BOOST_CENTS,
  GOALS,
  MAX_WEEKS,
  addWeeks,
  describeWeeks,
  formatWeekOf,
  planForGoal,
  weeksToSave,
} from './calc'

/** A fixed local date so nothing here depends on when the suite is run. */
const TODAY = new Date(2026, 9, 16) // 16 October 2026

describe('weeksToSave', () => {
  it('rounds up to whole weeks, because a part week is still a week', () => {
    expect(weeksToSave(100, 30)).toBe(4) // 3.33 weeks
    expect(weeksToSave(90, 30)).toBe(3)
    expect(weeksToSave(1, 100)).toBe(1)
  })

  it('is zero when there is nothing left to save', () => {
    expect(weeksToSave(0, 30)).toBe(0)
  })

  it('returns null, not Infinity, when nothing is being saved', () => {
    // The bug this guards: 100 / 0 is Infinity, and Infinity rendered into
    // "you will get there in Infinity weeks" is a lie told to a child.
    expect(weeksToSave(100, 0)).toBeNull()
    expect(Number.isFinite(weeksToSave(100, 1) ?? 0)).toBe(true)
  })
})

describe('addWeeks', () => {
  it('adds whole calendar weeks', () => {
    expect(addWeeks(TODAY, 1)).toEqual(new Date(2026, 9, 23))
    expect(addWeeks(TODAY, 4)).toEqual(new Date(2026, 10, 13))
    expect(addWeeks(TODAY, 0)).toEqual(TODAY)
  })

  it('rolls over the year', () => {
    expect(addWeeks(new Date(2026, 11, 25), 2)).toEqual(new Date(2027, 0, 8))
  })

  it('does not mutate the date it was given', () => {
    const from = new Date(2026, 9, 16)
    addWeeks(from, 10)
    expect(from).toEqual(new Date(2026, 9, 16))
  })

  it('keeps the same weekday across a daylight-saving change', () => {
    // 2027-03-14 is a DST start in most of the US. Adding milliseconds instead
    // of calendar days drifts to the previous day here.
    const before = new Date(2027, 1, 21) // Sunday
    const after = addWeeks(before, 4)
    expect(before.getDay()).toBe(0)
    expect(after.getDay()).toBe(0)
    expect(after).toEqual(new Date(2027, 2, 21))
  })
})

describe('formatWeekOf', () => {
  it('omits the year within the same year', () => {
    expect(formatWeekOf(new Date(2026, 11, 18), TODAY, 'en-GB')).toBe('18 December')
  })

  it('includes the year when the plan crosses into the next one', () => {
    expect(formatWeekOf(new Date(2027, 0, 15), TODAY, 'en-GB')).toBe('15 January 2027')
  })
})

describe('the interface language does not follow the host machine', () => {
  /**
   * The bug this exists to prevent.
   *
   * `new Intl.DateTimeFormat(undefined, ...)` means "use the browser's locale".
   * This app's only date then renders as "22 January 2027" on an English laptop
   * and "2027年1月22日" on a Chinese one. The interface is English, so the date
   * must be too, whatever the machine is set to.
   */
  it('formats with en-US when no locale is given, not the host default', () => {
    const label = formatWeekOf(new Date(2026, 11, 18), TODAY)
    expect(label).toBe('December 18')
    // No CJK, no Arabic-Indic digits, no other script leaking in.
    expect(label).toMatch(/^[A-Za-z]+ \d{1,2}$/)
  })

  it('still includes the year across a boundary, in English', () => {
    const label = formatWeekOf(new Date(2027, 0, 15), TODAY)
    expect(label).toBe('January 15, 2027')
  })

  it('carries the same behaviour through planForGoal', () => {
    const plan = planForGoal({
      goalCents: 2400,
      savedCents: 0,
      weeklyCents: 1200,
      from: TODAY,
    })
    expect(plan.finishLabel).toMatch(/^[A-Za-z]+ \d{1,2}$/)
  })

  it('honours an explicit locale when one is asked for', () => {
    const plan = planForGoal({
      goalCents: 2400,
      savedCents: 0,
      weeklyCents: 1200,
      from: TODAY,
      locale: 'en-GB',
    })
    expect(plan.finishLabel).toBe('30 October')
  })
})

describe('describeWeeks', () => {
  it('speaks in weeks when that is easy to picture', () => {
    expect(describeWeeks(0)).toBe('today')
    expect(describeWeeks(1)).toBe('1 week')
    expect(describeWeeks(8)).toBe('8 weeks')
  })

  it('switches to months once the number stops meaning much', () => {
    expect(describeWeeks(9)).toBe('9 weeks — about 2 months')
    expect(describeWeeks(23)).toBe('23 weeks — about 5 months')
  })

  it('switches to years for a long plan', () => {
    expect(describeWeeks(52)).toContain('a year')
    expect(describeWeeks(104)).toContain('2 years')
  })
})

describe('planForGoal', () => {
  const bike = GOALS.find((goal) => goal.id === 'bike')
  if (!bike) throw new Error('bike goal is missing')

  it('plans a normal case', () => {
    const plan = planForGoal({
      goalCents: 12000,
      savedCents: 1200,
      weeklyCents: 1200,
      from: TODAY,
      locale: 'en-GB',
    })

    expect(plan.status).toBe('planned')
    expect(plan.remainingCents).toBe(10800)
    expect(plan.weeks).toBe(9)
    expect(plan.finishLabel).toBe('18 December')
    expect(plan.finish).toEqual(addWeeks(TODAY, 9))
  })

  it('reports what the last week actually costs', () => {
    // 1000 remaining at 300 a week: 4 weeks, and the last one only needs 100.
    const plan = planForGoal({
      goalCents: 1000,
      savedCents: 0,
      weeklyCents: 300,
      from: TODAY,
    })
    expect(plan.weeks).toBe(4)
    expect(plan.lastWeekCents).toBe(100)
  })

  it('has a full-rate last week when the division is exact', () => {
    const plan = planForGoal({ goalCents: 900, savedCents: 0, weeklyCents: 300, from: TODAY })
    expect(plan.weeks).toBe(3)
    expect(plan.lastWeekCents).toBe(300)
  })

  it('reports "done" when the goal is already met', () => {
    const plan = planForGoal({
      goalCents: 12000,
      savedCents: 12000,
      weeklyCents: 500,
      from: TODAY,
    })
    expect(plan.status).toBe('done')
    expect(plan.remainingCents).toBe(0)
    expect(plan.finish).toBeNull()
  })

  it('treats saving more than the goal as having met it', () => {
    const plan = planForGoal({
      goalCents: 12000,
      savedCents: 99999,
      weeklyCents: 500,
      from: TODAY,
    })
    expect(plan.status).toBe('done')
    expect(plan.remainingCents).toBe(0)
    expect(plan.savedCents).toBe(12000)
  })

  it('reports "no-rate" rather than a nonsense number at a zero weekly saving', () => {
    const plan = planForGoal({
      goalCents: 12000,
      savedCents: 0,
      weeklyCents: 0,
      from: TODAY,
    })
    expect(plan.status).toBe('no-rate')
    expect(plan.weeks).toBeNull()
    expect(plan.finish).toBeNull()
    expect(plan.finishLabel).toBeNull()
  })

  it('reports "too-slow" past the horizon instead of a date in 200 years', () => {
    const plan = planForGoal({
      goalCents: 120000,
      savedCents: 0,
      weeklyCents: 50,
      from: TODAY,
    })
    expect(plan.status).toBe('too-slow')
    expect(plan.weeks).toBeNull()
    expect(plan.finish).toBeNull()
  })

  it('says how much sooner a bigger weekly saving gets there', () => {
    const plan = planForGoal({
      goalCents: 12000,
      savedCents: 0,
      weeklyCents: 500,
      from: TODAY,
    })
    // 24 weeks at $5; at $7 it is 18 weeks.
    expect(plan.weeks).toBe(24)
    expect(plan.weeksWithBoost).toBe(18)
    expect(plan.weeksSavedWithBoost).toBe(6)
    expect(plan.weeksSavedWithBoost).toBeGreaterThan(0)
  })

  it('never produces a non-integer number of cents anywhere', () => {
    for (const goal of GOALS) {
      for (const saved of [0, 1, 333, 1500, goal.price]) {
        for (const weekly of [50, 175, 1200, 1500]) {
          const plan = planForGoal({
            goalCents: goal.price,
            savedCents: saved,
            weeklyCents: weekly,
            from: TODAY,
          })
          expect(Number.isInteger(plan.remainingCents)).toBe(true)
          expect(Number.isInteger(plan.savedCents)).toBe(true)

          if (plan.status === 'planned') {
            expect(Number.isInteger(plan.lastWeekCents)).toBe(true)
            // The last week is a real amount: never zero, never more than a full week.
            // Scoped to 'planned' on purpose — a goal that is already met has a
            // last week of genuinely zero, which is the whole point of 'done'.
            expect(plan.lastWeekCents).toBeGreaterThan(0)
            expect(plan.lastWeekCents).toBeLessThanOrEqual(weekly)
          }

          if (plan.weeks !== null) {
            expect(Number.isInteger(plan.weeks)).toBe(true)
            expect(plan.weeks).toBeGreaterThanOrEqual(0)
            expect(plan.weeks).toBeLessThanOrEqual(MAX_WEEKS)
          }
        }
      }
    }
  })

  it('is consistent: saving the planned weeks reaches the goal', () => {
    for (const goal of GOALS) {
      for (const weekly of [50, 200, 750, 1500]) {
        const plan = planForGoal({
          goalCents: goal.price,
          savedCents: 0,
          weeklyCents: weekly,
          from: TODAY,
        })
        if (plan.status !== 'planned' || plan.weeks === null) continue
        expect(plan.weeks * weekly).toBeGreaterThanOrEqual(goal.price)
        expect((plan.weeks - 1) * weekly).toBeLessThan(goal.price)
      }
    }
  })

  it('rejects fractional cents rather than silently rounding', () => {
    expect(() =>
      planForGoal({ goalCents: 100.5, savedCents: 0, weeklyCents: 100, from: TODAY }),
    ).toThrow(TypeError)
  })
})

describe('BOOST_CENTS', () => {
  it('is a nudge, not a different plan', () => {
    expect(BOOST_CENTS).toBeGreaterThan(0)
    expect(BOOST_CENTS).toBeLessThan(500)
  })
})
