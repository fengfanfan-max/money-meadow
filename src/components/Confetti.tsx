import { useMemo } from 'react'
import type { CSSProperties } from 'react'

import { makeRng } from '../lib/random'

/** Allows custom properties in an inline style without losing type safety. */
type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>

const COLOURS = [
  'var(--coral)',
  'var(--sun)',
  'var(--mint)',
  'var(--sky)',
  'var(--grape)',
] as const

type Piece = {
  id: number
  left: number
  delay: number
  duration: number
  drift: number
  spin: number
  colour: string
  width: number
  height: number
}

/**
 * Celebratory confetti.
 *
 * Purely decorative, so it is `aria-hidden` — the celebration is announced by
 * the live region in words, and a screen reader should not be told about falling
 * paper. Positions are drawn from a seeded generator so a re-render does not
 * reshuffle the pieces mid-fall.
 *
 * Under reduced motion the global CSS rule flattens the animation, which leaves
 * every piece parked above the container where it is clipped and invisible. In
 * that case the component renders nothing at all rather than allocating thirty
 * spans nobody can see.
 */
export function Confetti({
  seed,
  pieces = 30,
  enabled = true,
}: {
  seed: number
  pieces?: number
  enabled?: boolean
}) {
  const items = useMemo<Piece[]>(() => {
    const rng = makeRng(seed)
    return Array.from({ length: pieces }, (_, index) => ({
      id: index,
      left: rng() * 100,
      delay: rng() * 700,
      duration: 1600 + rng() * 1400,
      drift: (rng() - 0.5) * 180,
      spin: 360 + rng() * 720,
      colour: COLOURS[Math.floor(rng() * COLOURS.length)] ?? 'var(--sun)',
      width: 8 + rng() * 8,
      height: 10 + rng() * 10,
    }))
  }, [seed, pieces])

  if (!enabled) return null

  return (
    <div className="confetti" aria-hidden="true">
      {items.map((piece) => (
        <span
          key={piece.id}
          className="confetti__piece"
          style={
            {
              left: `${piece.left}%`,
              width: `${piece.width}px`,
              height: `${piece.height}px`,
              background: piece.colour,
              '--fall-delay': `${piece.delay}ms`,
              '--fall-duration': `${piece.duration}ms`,
              '--drift': `${piece.drift}px`,
              '--spin-end': `${piece.spin}deg`,
            } as StyleWithVars
          }
        />
      ))}
    </div>
  )
}
