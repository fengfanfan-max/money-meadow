import { describe, expect, it } from 'vitest'

import { COIN_VALUES } from '../../lib'
import type { CoinValue } from '../../lib'
import {
  SHOP_ROUNDS,
  addCoin,
  optimalCoinCount,
  payState,
  rateGame,
  undoCoin,
} from './logic'

/** What a child does: take the biggest coin that still fits, until paid. */
function payGreedily(price: number): CoinValue[] {
  const coins: CoinValue[] = []
  const descending = [...COIN_VALUES].sort((a, b) => b - a) as CoinValue[]
  let paid = 0
  while (paid < price) {
    const coin = descending.find((value) => paid + value <= price)
    if (coin === undefined) throw new Error(`cannot pay ${price}`)
    coins.push(coin)
    paid += coin
  }
  return coins
}

describe('addCoin', () => {
  it('accepts a coin that stays within the price', () => {
    const result = addCoin([], 75, 25)
    expect(result).toEqual({ ok: true, coins: [25], exact: false })
  })

  it('reports an exact payment', () => {
    const result = addCoin([25, 25], 75, 25)
    expect(result).toEqual({ ok: true, coins: [25, 25, 25], exact: true })
  })

  it('refuses an overshoot and says by how much', () => {
    const result = addCoin([25, 25, 25], 75, 1)
    expect(result.ok).toBe(false)
    if (result.ok) throw new Error('expected a refusal')
    expect(result.over).toBe(1)
  })

  it('refuses even a penny too much', () => {
    // The refusal rule is what keeps the tray always solvable. If this ever
    // starts accepting the coin, the child can reach a state they cannot undo.
    expect(addCoin([25], 25, 1).ok).toBe(false)
  })

  it('can always reach an exact payment for every price in the game', () => {
    for (const round of SHOP_ROUNDS) {
      const coins = payGreedily(round.price)
      const state = payState(coins, round.price)
      expect(state.exact).toBe(true)
      expect(state.remaining).toBe(0)
    }
  })

  it('never lets the tray exceed the price, along any greedy path', () => {
    for (const round of SHOP_ROUNDS) {
      let coins: CoinValue[] = []
      for (const coin of payGreedily(round.price)) {
        const result = addCoin(coins, round.price, coin)
        expect(result.ok).toBe(true)
        if (!result.ok) return
        coins = result.coins
        expect(payState(coins, round.price).paid).toBeLessThanOrEqual(round.price)
      }
    }
  })
})

describe('optimalCoinCount', () => {
  it('knows the fewest coins for the round prices', () => {
    expect(optimalCoinCount(10)).toBe(1) // one dime
    expect(optimalCoinCount(25)).toBe(1) // one quarter
    expect(optimalCoinCount(30)).toBe(2) // quarter + nickel
    expect(optimalCoinCount(45)).toBe(3) // quarter + dime + dime
    expect(optimalCoinCount(60)).toBe(3) // quarter + quarter + dime
    expect(optimalCoinCount(85)).toBe(4) // 25+25+25+10
  })

  it('agrees with a greedy payment on every round, which is why greedy is the hint', () => {
    for (const round of SHOP_ROUNDS) {
      expect(payGreedily(round.price)).toHaveLength(optimalCoinCount(round.price))
    }
  })
})

describe('payState', () => {
  it('tracks paid, remaining and exactness together', () => {
    expect(payState([], 75)).toEqual({ coins: [], paid: 0, remaining: 75, exact: false })
    expect(payState([25, 25], 75)).toEqual({
      coins: [25, 25],
      paid: 50,
      remaining: 25,
      exact: false,
    })
    expect(payState([25, 25, 25], 75).exact).toBe(true)
  })
})

describe('undoCoin', () => {
  it('removes only the last coin', () => {
    expect(undoCoin([25, 10, 5])).toEqual([25, 10])
  })

  it('is safe on an empty tray', () => {
    expect(undoCoin([])).toEqual([])
  })
})

describe('rateGame', () => {
  it('rewards paying with the fewest coins', () => {
    expect(rateGame(6, 6)).toBe(3)
    expect(rateGame(5, 6)).toBe(3)
    expect(rateGame(4, 6)).toBe(2)
    expect(rateGame(3, 6)).toBe(2)
    expect(rateGame(2, 6)).toBe(1)
    expect(rateGame(0, 6)).toBe(1)
  })

  it('never divides by zero', () => {
    expect(rateGame(0, 0)).toBe(1)
  })
})

describe('SHOP_ROUNDS', () => {
  it('rises in price, so the difficulty curve is readable', () => {
    const prices = SHOP_ROUNDS.map((round) => round.price)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  it('stays under a dollar, which is the range where coins are teachable', () => {
    for (const round of SHOP_ROUNDS) {
      expect(round.price).toBeLessThan(100)
      expect(round.price).toBeGreaterThan(0)
      expect(Number.isInteger(round.price)).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = SHOP_ROUNDS.map((round) => round.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
