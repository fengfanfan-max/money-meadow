import { shuffle } from '../../lib/random'
import { ROUND_SIZE, SORT_ITEMS } from './data'
import type { SortAnswer, SortItem } from './data'

/**
 * Round selection and scoring for Need or Want?.
 *
 * Pure functions, so the game component is only responsible for turning them
 * into pixels — which is what makes the scoring rules testable rather than
 * merely observed.
 */

/**
 * Picks a round. Deliberately balanced: half the round is needs and half wants,
 * so a child cannot score well by answering "want" every time. With eight items
 * from a five-and-five pool, each play has four of each.
 */
export function pickRound(
  random: () => number = Math.random,
  size: number = ROUND_SIZE,
  items: readonly SortItem[] = SORT_ITEMS,
): SortItem[] {
  const needs = shuffle(
    items.filter((item) => item.answer === 'need'),
    random,
  )
  const wants = shuffle(
    items.filter((item) => item.answer === 'want'),
    random,
  )

  const half = Math.floor(size / 2)
  const chosen = [...needs.slice(0, half), ...wants.slice(0, size - half)]
  return shuffle(chosen, random)
}

export function isCorrect(item: SortItem, answer: SortAnswer): boolean {
  return item.answer === answer
}

/**
 * Star rating.
 *
 * Eight items with a two-way choice means guessing scores 50% on average, so a
 * pass mark set at 50% would be worth nothing. The thresholds are placed where
 * they are because a child who understands the idea reliably clears six of
 * eight, and one who is guessing does not.
 */
export function rateGame(correct: number, total: number): 1 | 2 | 3 {
  if (total <= 0) return 1
  const ratio = correct / total
  if (ratio >= 0.875) return 3
  if (ratio >= 0.625) return 2
  return 1
}

export type Score = { correct: number; answered: number }

export function scoreRound(items: readonly SortItem[], answers: readonly SortAnswer[]): number {
  let correct = 0
  for (let i = 0; i < answers.length; i += 1) {
    const item = items[i]
    const answer = answers[i]
    if (item && answer && item.answer === answer) correct += 1
  }
  return correct
}
