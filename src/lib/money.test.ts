import { describe, expect, it } from 'vitest'

import {
  COIN_VALUES,
  amountToWords,
  assertCents,
  centsOver,
  centsRemaining,
  formatCents,
  formatCentsShort,
  greedyCoinsToMake,
  isExactPayment,
  minCoinsToMake,
  sumCoins,
} from './money'

describe('assertCents', () => {
  it('accepts non-negative integers', () => {
    expect(assertCents(0)).toBe(0)
    expect(assertCents(125)).toBe(125)
  })

  it('rejects fractions, negatives and non-numbers', () => {
    expect(() => assertCents(1.5)).toThrow(TypeError)
    expect(() => assertCents(-1)).toThrow(RangeError)
    expect(() => assertCents(Number.NaN)).toThrow(TypeError)
    expect(() => assertCents(Number.POSITIVE_INFINITY)).toThrow(TypeError)
  })
})

describe('formatCents', () => {
  it('formats the way a price tag reads', () => {
    expect(formatCents(0)).toBe('$0.00')
    expect(formatCents(5)).toBe('$0.05')
    expect(formatCents(75)).toBe('$0.75')
    expect(formatCents(100)).toBe('$1.00')
    expect(formatCents(1234)).toBe('$12.34')
  })

  it('never leaks floating point noise', () => {
    // The naive implementation: (0.1 + 0.2) dollars. Our pipeline is integer-only.
    const cents = sumCoins([10, 20])
    expect(formatCents(cents)).toBe('$0.30')

    // Every cent value in a dollar formats to exactly two decimals.
    for (let c = 0; c <= 1000; c += 1) {
      expect(formatCents(c)).toMatch(/^\$\d+\.\d{2}$/)
    }
  })
})

describe('amountToWords', () => {
  it('reads the way a grown-up says it out loud', () => {
    expect(amountToWords(0)).toBe('0 cents')
    expect(amountToWords(1)).toBe('1 cent')
    expect(amountToWords(5)).toBe('5 cents')
    expect(amountToWords(75)).toBe('75 cents')
    expect(amountToWords(100)).toBe('1 dollar')
    expect(amountToWords(125)).toBe('1 dollar and 25 cents')
    expect(amountToWords(200)).toBe('2 dollars')
    expect(amountToWords(1205)).toBe('12 dollars and 5 cents')
  })

  it('never produces a double "cents"', () => {
    for (let c = 0; c <= 2000; c += 7) {
      expect(amountToWords(c)).not.toMatch(/cents.*cents/)
      expect(amountToWords(c)).not.toMatch(/^and/)
    }
  })
})

describe('coin pile arithmetic', () => {
  it('sums a pile', () => {
    expect(sumCoins([25, 25, 10, 5, 1])).toBe(66)
    expect(sumCoins([])).toBe(0)
  })

  it('reports what is left to pay, and never goes negative', () => {
    expect(centsRemaining(30, 75)).toBe(45)
    expect(centsRemaining(75, 75)).toBe(0)
    expect(centsRemaining(100, 75)).toBe(0)
  })

  it('reports overspend, and never goes negative', () => {
    expect(centsOver(100, 75)).toBe(25)
    expect(centsOver(50, 75)).toBe(0)
  })

  it('recognises an exact payment', () => {
    expect(isExactPayment(75, 75)).toBe(true)
    expect(isExactPayment(76, 75)).toBe(false)
  })
})

describe('minCoinsToMake', () => {
  it('handles the edges', () => {
    expect(minCoinsToMake(0)).toBe(0)
    expect(minCoinsToMake(1)).toBe(1)
    expect(minCoinsToMake(3)).toBe(3)
    expect(minCoinsToMake(50)).toBe(2)
    expect(minCoinsToMake(99)).toBe(9) // 25+25+25+10+10+1+1+1+1
  })

  it('returns Infinity for amounts it cannot make', () => {
    expect(minCoinsToMake(7, [5, 10])).toBe(Infinity)
    expect(minCoinsToMake(12, [])).toBe(Infinity)
  })

  it('agrees with greedy for the current US denominations', () => {
    // This is the assumption the game's difficulty maths rests on. If someone
    // adds a denomination where greedy is no longer optimal, this fails loudly.
    for (let target = 0; target <= 200; target += 1) {
      expect(minCoinsToMake(target)).toBe(greedyCoinsToMake(target))
    }
  })

  it('proves greedy is not optimal in general, which is why DP is used', () => {
    // A denomination set where taking the biggest coin first loses.
    const awkward = [1, 15, 25]
    expect(minCoinsToMake(30, awkward)).toBe(2) // 15 + 15
    expect(greedyCoinsToMake(30, awkward)).toBe(6) // 25 + 1 + 1 + 1 + 1 + 1
  })
})

describe('COIN_VALUES', () => {
  it('is kept sorted and canonical', () => {
    expect([...COIN_VALUES]).toEqual([1, 5, 10, 25])
    expect([...COIN_VALUES].sort((a, b) => a - b)).toEqual([...COIN_VALUES])
  })
})
