/**
 * Money handling for Money Meadow.
 *
 * Every amount in this app is an integer number of cents. There is no floating
 * point money anywhere, and `assertCents` is the tripwire that keeps it that way.
 * A children's money game that shows "you have $0.30000000000000004 left" is a
 * broken money game, and the fix is a type discipline, not a rounding patch.
 */

/** An integer number of cents. The only money representation this app uses. */
export type Cents = number

/** US coin denominations, smallest first. */
export const COIN_VALUES = [1, 5, 10, 25] as const

export type CoinValue = (typeof COIN_VALUES)[number]

/** Human-facing metadata for each coin. `name` doubles as the accessible label. */
export const COINS: Record<CoinValue, { name: string; singular: string; plural: string }> = {
  1: { name: 'penny', singular: '1 cent', plural: 'cents' },
  5: { name: 'nickel', singular: '5 cents', plural: 'cents' },
  10: { name: 'dime', singular: '10 cents', plural: 'cents' },
  25: { name: 'quarter', singular: '25 cents', plural: 'cents' },
}

/** Throws on anything that is not a non-negative integer number of cents. */
export function assertCents(value: number, label = 'amount'): Cents {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${label} must be an integer number of cents, got ${value}`)
  }
  if (value < 0) {
    throw new RangeError(`${label} must not be negative, got ${value}`)
  }
  return value
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** `75` becomes `"$0.75"`. */
export function formatCents(cents: Cents): string {
  return currencyFormatter.format(assertCents(cents) / 100)
}

/** Cents as a bare number of cents with the unit, e.g. `75` -> `"75¢"`. */
export function formatCentsShort(cents: Cents): string {
  return `${assertCents(cents)}¢`
}

/**
 * Spoken form, for screen readers and `aria-valuetext`.
 *
 * "$1.25" is read by some screen readers as "one point two five dollars", which
 * is not what a child hears from a grown-up. This returns "1 dollar and 25 cents".
 */
export function amountToWords(cents: Cents): string {
  const value = assertCents(cents)
  const dollars = Math.floor(value / 100)
  const rest = value % 100

  const parts: string[] = []
  if (dollars > 0) parts.push(`${dollars} ${dollars === 1 ? 'dollar' : 'dollars'}`)
  if (rest > 0 || dollars === 0) parts.push(`${rest} ${rest === 1 ? 'cent' : 'cents'}`)

  if (parts.length === 1) return parts[0]!
  return `${parts[0]} and ${parts[1]}`
}

/** Total value of a pile of coins. */
export function sumCoins(coins: readonly Cents[]): Cents {
  let total = 0
  for (const coin of coins) total += assertCents(coin, 'coin')
  return total
}

/** How much is still owed. Never negative. */
export function centsRemaining(paid: Cents, price: Cents): Cents {
  return Math.max(0, assertCents(price, 'price') - assertCents(paid, 'paid'))
}

/** How far over the price a pile of coins goes. Never negative. */
export function centsOver(paid: Cents, price: Cents): Cents {
  return Math.max(0, assertCents(paid, 'paid') - assertCents(price, 'price'))
}

/** True when a pile of coins pays a price exactly. */
export function isExactPayment(paid: Cents, price: Cents): boolean {
  return assertCents(paid, 'paid') === assertCents(price, 'price')
}

/**
 * Fewest coins that add up to `target`, or `Infinity` when it cannot be made.
 *
 * Bottom-up dynamic programming rather than the greedy "take the biggest coin
 * that fits" approach. Greedy happens to be optimal for the US denomination set,
 * but that is a property of those four numbers, not a general truth — if the
 * game ever gains a 20c coin, greedy silently starts returning wrong answers.
 * `money.test.ts` pins both properties so the assumption is visible if it breaks.
 */
export function minCoinsToMake(
  target: Cents,
  denominations: readonly Cents[] = COIN_VALUES,
): number {
  const goal = assertCents(target, 'target')
  if (goal === 0) return 0
  if (denominations.length === 0) return Infinity

  const best = new Array<number>(goal + 1).fill(Infinity)
  best[0] = 0

  for (let amount = 1; amount <= goal; amount += 1) {
    for (const coin of denominations) {
      if (coin <= 0 || coin > amount) continue
      const without = best[amount - coin]
      if (without === undefined || without === Infinity) continue
      const candidate = without + 1
      if (candidate < (best[amount] ?? Infinity)) best[amount] = candidate
    }
  }

  return best[goal] ?? Infinity
}

/**
 * Greedy coin count: largest coin that fits, repeat.
 *
 * Kept in the codebase only so the test suite can prove it agrees with
 * {@link minCoinsToMake} for the current denominations.
 */
export function greedyCoinsToMake(
  target: Cents,
  denominations: readonly Cents[] = COIN_VALUES,
): number {
  let remaining = assertCents(target, 'target')
  const descending = [...denominations].sort((a, b) => b - a)
  let used = 0
  for (const coin of descending) {
    while (remaining >= coin) {
      remaining -= coin
      used += 1
    }
  }
  return remaining === 0 ? used : Infinity
}
