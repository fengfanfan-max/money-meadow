/**
 * Deterministic randomness.
 *
 * The games shuffle, so they need a random source. They take it as a parameter
 * rather than reaching for `Math.random` directly, which is what makes a round
 * reproducible in a test: pass a seeded generator, assert the exact order.
 */

/** mulberry32 — small, fast, and good enough for shuffling eight flashcards. */
export function makeRng(seed: number): () => number {
  let state = seed >>> 0
  return function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Fisher-Yates. Returns a new array; the input is never mutated, because these
 * inputs are module-level constants and an in-place shuffle would leak state
 * between games.
 */
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const a = result[i]
    const b = result[j]
    // Both indices are inside the array by construction; the guard is for
    // noUncheckedIndexedAccess rather than for a real runtime case.
    if (a === undefined || b === undefined) continue
    result[i] = b
    result[j] = a
  }
  return result
}
