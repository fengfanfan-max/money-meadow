import { describe, expect, it } from 'vitest'

import { makeRng } from '../../lib/random'
import { ROUND_SIZE, SORT_ITEMS } from './data'
import { isCorrect, pickRound, rateGame, scoreRound } from './logic'

describe('the item pool', () => {
  it('is balanced between needs and wants', () => {
    const needs = SORT_ITEMS.filter((item) => item.answer === 'need').length
    const wants = SORT_ITEMS.filter((item) => item.answer === 'want').length
    expect(needs).toBe(wants)
  })

  it('has at least enough items for two different rounds', () => {
    expect(SORT_ITEMS.length).toBeGreaterThanOrEqual(ROUND_SIZE)
  })

  it('gives every item a reason and something to talk about', () => {
    for (const item of SORT_ITEMS) {
      expect(item.reason.trim().length).toBeGreaterThan(20)
      expect(item.talk.trim().endsWith('?')).toBe(true)
    }
  })

  it('has unique ids and names', () => {
    expect(new Set(SORT_ITEMS.map((item) => item.id)).size).toBe(SORT_ITEMS.length)
    expect(new Set(SORT_ITEMS.map((item) => item.name)).size).toBe(SORT_ITEMS.length)
  })
})

describe('pickRound', () => {
  it('returns a full round', () => {
    expect(pickRound(makeRng(1))).toHaveLength(ROUND_SIZE)
  })

  it('never repeats an item', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const round = pickRound(makeRng(seed))
      expect(new Set(round.map((item) => item.id)).size).toBe(round.length)
    }
  })

  it('always balances needs and wants, so guessing one answer cannot win', () => {
    for (let seed = 0; seed < 40; seed += 1) {
      const round = pickRound(makeRng(seed))
      const needs = round.filter((item) => item.answer === 'need').length
      const wants = round.filter((item) => item.answer === 'want').length
      expect(needs).toBe(ROUND_SIZE / 2)
      expect(wants).toBe(ROUND_SIZE / 2)
    }
  })

  it('is reproducible from a seed', () => {
    const first = pickRound(makeRng(7)).map((item) => item.id)
    const second = pickRound(makeRng(7)).map((item) => item.id)
    expect(first).toEqual(second)
  })

  it('actually varies between seeds, so replays differ', () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, seed) =>
        pickRound(makeRng(seed))
          .map((item) => item.id)
          .join(','),
      ),
    )
    expect(orders.size).toBeGreaterThan(1)
  })

  it('handles an odd round size without dropping an item', () => {
    const round = pickRound(makeRng(3), 7)
    expect(round).toHaveLength(7)
    expect(new Set(round.map((item) => item.id)).size).toBe(7)
  })

  it('does not mutate the pool', () => {
    const before = SORT_ITEMS.map((item) => item.id)
    pickRound(makeRng(5))
    expect(SORT_ITEMS.map((item) => item.id)).toEqual(before)
  })
})

describe('isCorrect', () => {
  it('compares the answer to the item', () => {
    const coat = SORT_ITEMS.find((item) => item.id === 'coat')
    const iceCream = SORT_ITEMS.find((item) => item.id === 'icecream')
    expect(coat && isCorrect(coat, 'need')).toBe(true)
    expect(coat && isCorrect(coat, 'want')).toBe(false)
    expect(iceCream && isCorrect(iceCream, 'want')).toBe(true)
  })
})

describe('rateGame', () => {
  it('is deliberately harder than a coin toss', () => {
    // Eight binary choices means guessing averages four. A pass mark of four
    // would reward guessing, so the middle band starts above it.
    expect(rateGame(8, 8)).toBe(3)
    expect(rateGame(7, 8)).toBe(3)
    expect(rateGame(6, 8)).toBe(2)
    expect(rateGame(5, 8)).toBe(2)
    expect(rateGame(4, 8)).toBe(1)
    expect(rateGame(0, 8)).toBe(1)
  })

  it('never divides by zero', () => {
    expect(rateGame(0, 0)).toBe(1)
  })
})

describe('scoreRound', () => {
  it('counts correct answers', () => {
    const round = pickRound(makeRng(11))
    const allRight = round.map((item) => item.answer)
    expect(scoreRound(round, allRight)).toBe(round.length)

    const allWrong = round.map((item) => (item.answer === 'need' ? 'want' : 'need'))
    expect(scoreRound(round, allWrong)).toBe(0)
  })

  it('ignores answers that were never given', () => {
    const round = pickRound(makeRng(11))
    expect(scoreRound(round, [])).toBe(0)
    expect(scoreRound(round, [round[0]?.answer ?? 'need'])).toBe(1)
  })
})
