import { useMemo } from 'react'
import type { CSSProperties } from 'react'

import { makeRng } from '../lib/random'

/** Allows custom properties in an inline style without losing type safety. */
type StyleWithVars = CSSProperties & Record<`--${string}`, string | number>

const COIN_COLOURS = [
  '#e8c97a', // gold
  '#c3cad6', // silver
  '#e8a277', // copper
] as const

type Piece = {
  id: number
  angle: number
  distance: number
  size: number
  spin: number
  delay: number
  duration: number
  colour: string
}

/**
 * Coins bursting out of the tray when a level is paid off.
 *
 * Decorative in the strict sense: it is `aria-hidden`, it carries no
 * information, and the same moment is already announced in words by the live
 * region. Removing it costs a screen-reader user nothing, which is the test for
 * whether a flourish belongs in a children's app.
 *
 * The pieces fly upward in a fan rather than in all directions — coins leaving a
 * hand, not a firework — so the shape reads as the payoff for the tray below it
 * rather than as generic celebration.
 *
 * Under reduced motion the caller does not render this at all. The CSS also
 * lands every piece at `opacity: 0` in its final keyframe, so if the component
 * is ever rendered with motion flattened the pieces are invisible rather than
 * frozen mid-flight.
 */
export function CoinBurst({
  seed,
  pieces = 18,
  className,
}: {
  seed: number
  pieces?: number
  className?: string
}) {
  const items = useMemo<Piece[]>(() => {
    const rng = makeRng(seed)

    return Array.from({ length: pieces }, (_, index) => {
      // A fan from -170deg to -10deg: -90 is straight up, so every piece leaves
      // the tray upward and outward, never downward into the controls.
      const spread = -170 + (index / Math.max(1, pieces - 1)) * 160
      const jitter = (rng() - 0.5) * 16

      return {
        id: index,
        angle: spread + jitter,
        distance: 70 + rng() * 110,
        size: 20 + rng() * 18,
        spin: (rng() < 0.5 ? -1 : 1) * (180 + rng() * 380),
        delay: rng() * 130,
        duration: 760 + rng() * 380,
        colour: COIN_COLOURS[Math.floor(rng() * COIN_COLOURS.length)] ?? COIN_COLOURS[0],
      }
    })
  }, [seed, pieces])

  return (
    <div className={['coin-burst', className].filter(Boolean).join(' ')} aria-hidden="true">
      {items.map((piece) => {
        const radians = (piece.angle * Math.PI) / 180

        return (
          <span
            key={piece.id}
            className="coin-burst__piece"
            style={
              {
                '--piece-bg': piece.colour,
                '--piece-size': `${piece.size}px`,
                '--fly-x': `${Math.cos(radians) * piece.distance}px`,
                '--fly-y': `${Math.sin(radians) * piece.distance}px`,
                '--fly-r': `${piece.spin}deg`,
                '--fly-delay': `${piece.delay}ms`,
                '--fly-duration': `${piece.duration}ms`,
              } as StyleWithVars
            }
          />
        )
      })}
    </div>
  )
}
