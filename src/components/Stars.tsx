/**
 * A three-star rating.
 *
 * Exposed as a single labelled graphic rather than as three separate images:
 * "Coin Catch: 2 of 3 stars" is one useful sentence, whereas three unlabelled
 * stars announce as nothing at all.
 */
export function Stars({
  count,
  max = 3,
  label,
}: {
  count: number
  max?: number
  label: string
}) {
  const filled = Math.min(max, Math.max(0, count))

  return (
    <span className="stars" role="img" aria-label={`${label}: ${filled} of ${max} stars`}>
      {Array.from({ length: max }, (_, index) => (
        <svg
          key={index}
          className="stars__star"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className={index < filled ? 'stars__star--on' : 'stars__star--off'}
            d="M 12 2 l 3 6.3 6.9 0.9 -5 4.9 1.2 6.9 -6.1 -3.3 -6.1 3.3 1.2 -6.9 -5 -4.9 6.9 -0.9 z"
          />
        </svg>
      ))}
    </span>
  )
}

/** The empty-state version, used on cards for games not yet played. */
export function UnplayedBadge() {
  return <span className="screen-head__meta">Not played yet</span>
}
