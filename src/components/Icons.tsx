/**
 * Interface icons.
 *
 * Deliberately not emoji. Emoji render differently on every platform — the same
 * lock is a colour glyph on macOS, a monochrome outline on Windows, and a blank
 * box wherever the font is missing — which is exactly the wrong property for an
 * icon that carries meaning. These inherit `currentColor`, so they take the ink
 * colour from the palette and are measured by the same contrast audit as text.
 *
 * All are decorative: each one sits next to a real label.
 */

import type { ReactNode } from 'react'

function Base({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      style={{ flex: 'none' }}
    >
      {children}
    </svg>
  )
}

export function IconSoundOn({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M 4 9 h 3.5 L 12.5 4.5 v 15 L 7.5 15 H 4 Z" fill="currentColor" />
      <path d="M 16 8.5 a 5 5 0 0 1 0 7" />
      <path d="M 19 5.5 a 9 9 0 0 1 0 13" />
    </Base>
  )
}

export function IconSoundOff({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M 4 9 h 3.5 L 12.5 4.5 v 15 L 7.5 15 H 4 Z" fill="currentColor" />
      <path d="M 16.5 9.5 L 21.5 14.5" />
      <path d="M 21.5 9.5 L 16.5 14.5" />
    </Base>
  )
}

export function IconLock({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <rect x="4" y="10.5" width="16" height="10.5" rx="2.5" />
      <path d="M 8 10.5 V 7.5 a 4 4 0 0 1 8 0 v 3" />
      <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
    </Base>
  )
}

export function IconSparkle({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path
        d="M 12 2.5 l 2.4 6.1 6.1 2.4 -6.1 2.4 -2.4 6.1 -2.4 -6.1 -6.1 -2.4 6.1 -2.4 z"
        fill="currentColor"
        stroke="none"
      />
    </Base>
  )
}

export function IconTick({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M 4.5 12.5 l 4.5 4.5 L 19.5 6.5" />
    </Base>
  )
}

export function IconBulb({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M 9 17.5 h 6" />
      <path d="M 10 20.5 h 4" />
      <path d="M 12 2.5 a 6.5 6.5 0 0 1 3.8 11.8 v 3.2 H 8.2 v -3.2 A 6.5 6.5 0 0 1 12 2.5 Z" />
    </Base>
  )
}

export function IconRocket({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M 12 2.5 c 3.6 2.4 5.4 6 5.4 10.2 l -2.6 3.4 H 9.2 L 6.6 12.7 C 6.6 8.5 8.4 4.9 12 2.5 Z" />
      <circle cx="12" cy="9.5" r="2" />
      <path d="M 9.2 16.1 L 7 21.5" />
      <path d="M 14.8 16.1 L 17 21.5" />
    </Base>
  )
}

export function IconTrophy({ className }: { className?: string }) {
  return (
    <Base className={className}>
      <path d="M 7.5 3.5 H 16.5 V 9 a 4.5 4.5 0 0 1 -9 0 Z" />
      <path d="M 7.5 5.5 H 4.5 V 8 a 3.5 3.5 0 0 0 3 3.4" />
      <path d="M 16.5 5.5 H 19.5 V 8 a 3.5 3.5 0 0 1 -3 3.4" />
      <path d="M 12 13.5 V 17" />
      <path d="M 8 20.5 H 16" />
      <path d="M 9.5 17 H 14.5 L 15.5 20.5 H 8.5 Z" />
    </Base>
  )
}
