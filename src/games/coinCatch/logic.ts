import { COIN_VALUES, minCoinsToMake, sumCoins } from '../../lib'
import type { Cents, CoinValue } from '../../lib'
import type { IllustrationName } from '../../components/Illustration'

/**
 * Coin Catch — pay for a school-fair item with exact change.
 *
 * The design decision that matters here is that an overshoot is *refused* rather
 * than accepted and then marked wrong. The tray therefore always holds an amount
 * less than or equal to the price, so:
 *   - the child can always see exactly how much is still owed, which is the
 *     whole lesson;
 *   - there is no "undo the wrong answer" step, so a mistake costs nothing;
 *   - the puzzle state is never invalid, so the game has no dead ends.
 *
 * The prices are all multiples of 5 and under a dollar, which is the range where
 * counting coins is actually teachable.
 */

export type ShopItem = {
  id: string
  name: string
  price: Cents
  art: IllustrationName
}

export const SHOP_ROUNDS: readonly ShopItem[] = [
  { id: 'marble', name: 'Glass marble', price: 10, art: 'marble' },
  { id: 'sticker', name: 'Sticker pack', price: 25, art: 'sticker' },
  { id: 'eraser', name: 'Rubber eraser', price: 30, art: 'eraser' },
  { id: 'yoyo', name: 'Yo-yo', price: 45, art: 'yoyo' },
  { id: 'comic', name: 'Comic book', price: 60, art: 'comic' },
  { id: 'teddy', name: 'Teddy bear', price: 85, art: 'teddy' },
]

export type PayState = {
  coins: readonly CoinValue[]
  paid: Cents
  remaining: Cents
  exact: boolean
}

export function payState(coins: readonly CoinValue[], price: Cents): PayState {
  const paid = sumCoins(coins)
  return {
    coins,
    paid,
    remaining: Math.max(0, price - paid),
    exact: paid === price,
  }
}

export type AddCoinResult =
  | { ok: true; coins: CoinValue[]; exact: boolean }
  | { ok: false; over: Cents }

/**
 * Adds a coin if doing so does not break the price.
 *
 * Returns a result object rather than a boolean so the caller has the overshoot
 * amount to put into the message the child hears: "That is 10 cents too much"
 * teaches more than "no".
 */
export function addCoin(
  coins: readonly CoinValue[],
  price: Cents,
  coin: CoinValue,
): AddCoinResult {
  const paid = sumCoins(coins)
  const next = paid + coin
  if (next > price) return { ok: false, over: next - price }
  return { ok: true, coins: [...coins, coin], exact: next === price }
}

/** Fewest coins that can pay this price — the target for a perfect round. */
export function optimalCoinCount(price: Cents): number {
  return minCoinsToMake(price, COIN_VALUES)
}

/**
 * Star rating for a whole play-through.
 *
 * Rated on how many of the six rounds were paid with the fewest possible coins,
 * not on whether the child finished — finishing is guaranteed by the refusal
 * rule, so scoring it would be meaningless. This rewards efficiency, which is
 * the next idea after "add up the coins".
 */
export function rateGame(perfectRounds: number, totalRounds: number): 1 | 2 | 3 {
  if (totalRounds <= 0) return 1
  const ratio = perfectRounds / totalRounds
  if (ratio >= 0.8) return 3
  if (ratio >= 0.5) return 2
  return 1
}

/** Removes the most recently added coin. */
export function undoCoin(coins: readonly CoinValue[]): CoinValue[] {
  return coins.slice(0, -1)
}
