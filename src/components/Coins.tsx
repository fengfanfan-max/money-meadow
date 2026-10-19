import { useEffect, useState } from 'react'

import { COINS } from '../lib'
import type { CoinValue } from '../lib'

/** A coin glyph. Decorative on its own; the accessible name lives on the button. */
export function CoinIcon({ value, className }: { value: CoinValue; className?: string }) {
  return (
    <span
      className={['coin', `coin--${value}`, className].filter(Boolean).join(' ')}
      aria-hidden="true"
    >
      {value}¢
    </span>
  )
}

type CoinButtonProps = {
  value: CoinValue
  onPick: (value: CoinValue) => void
  disabled?: boolean
  /**
   * Increments when this coin was just refused for overshooting the price.
   * A counter rather than a boolean so that two refusals in a row still replay
   * the shake — a boolean would flip true/true and animate nothing the second
   * time.
   */
  refusePulse?: number
}

/**
 * The one interactive coin in the app.
 *
 * The label spells the coin out — "Add 25 cents — a quarter" — rather than
 * relying on the visible "25¢", because "25¢" is read inconsistently and a child
 * using a screen reader is the audience most likely to be confused by it.
 */
export function CoinButton({ value, onPick, disabled = false, refusePulse = 0 }: CoinButtonProps) {
  const [refused, setRefused] = useState(false)

  useEffect(() => {
    if (refusePulse === 0) return
    setRefused(true)
    const timer = window.setTimeout(() => setRefused(false), 420)
    return () => window.clearTimeout(timer)
  }, [refusePulse])

  return (
    <button
      type="button"
      className="coin-btn"
      onClick={() => onPick(value)}
      disabled={disabled}
      aria-label={`Add ${COINS[value].singular} — a ${COINS[value].name}`}
    >
      <CoinIcon value={value} className={refused ? 'coin--refused' : undefined} />
    </button>
  )
}
