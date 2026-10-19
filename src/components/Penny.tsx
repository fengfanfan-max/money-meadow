import type { CSSProperties } from 'react'

/**
 * Penny, the piggy-bank mascot.
 *
 * Hand-authored SVG rather than an illustration file: it scales to any size, it
 * inherits the palette from CSS custom properties so a theme change moves her
 * with it, and it costs no extra request. Her idle animation is CSS keyframes on
 * named groups, which means the global reduced-motion rule switches all of it off
 * without this component knowing anything about that.
 *
 * She is always decorative. She carries no information that is not also in real
 * text, so she is hidden from assistive technology rather than described —
 * announcing a decorative mascot on every screen is noise, not accessibility.
 */

export type PennyMood = 'idle' | 'happy' | 'cheer' | 'thinking'

type PennyProps = {
  mood?: PennyMood
  className?: string
  style?: CSSProperties
}

/**
 * Geometry, pinned in one place. The CSS blink keyframe scales each eyelid about
 * its eye centre, so those two coordinates appear in components.css as
 * transform-origin values and must stay in step with the constants below.
 */
const GEOMETRY = {
  leftEye: { x: 126, y: 74 },
  rightEye: { x: 156, y: 74 },
} as const

export function Penny({ mood = 'idle', className, style }: PennyProps) {
  return (
    <svg
      className={['penny', `penny--${mood}`, className].filter(Boolean).join(' ')}
      viewBox="0 0 220 190"
      aria-hidden="true"
      focusable="false"
      style={style}
    >
      <g className="penny__root">
        {/* Tail — behind the body so the join is hidden. */}
        <path
          className="penny__tail"
          d="M 34 94 C 14 86 4 106 18 116 C 30 124 44 118 41 106"
        />

        {/* Legs — behind the body, and in the body colour so they read as part of
            the pig rather than as four pale shapes that happen to be underneath it. */}
        <rect className="penny__leg" x="62" y="140" width="24" height="32" rx="11" />
        <rect className="penny__leg" x="90" y="140" width="24" height="32" rx="11" />
        <rect className="penny__leg" x="118" y="140" width="24" height="32" rx="11" />
        <rect className="penny__leg" x="146" y="140" width="24" height="32" rx="11" />

        {/* Ears — behind the body, so they read as tucked into the head. */}
        <path className="penny__ear penny__ear--left" d="M 68 62 C 58 22 78 10 98 30 C 88 42 84 52 86 64 Z" />
        <path
          className="penny__ear penny__ear--right"
          d="M 152 62 C 162 22 142 10 122 30 C 132 42 136 52 134 64 Z"
        />

        {/* Body. */}
        <ellipse className="penny__body" cx="110" cy="98" rx="82" ry="58" />

        {/* Coin slot, with a lip so it reads as an opening rather than a stripe. */}
        <rect className="penny__slot" x="90" y="44" width="50" height="11" rx="5.5" />

        {/* Head group — the thinking mood tilts this without moving the body. */}
        <g className="penny__head">
          <ellipse className="penny__snout" cx="176" cy="100" rx="28" ry="23" />
          <ellipse className="penny__slot" cx="170" cy="100" rx="3.6" ry="5" />
          <ellipse className="penny__slot" cx="184" cy="100" rx="3.6" ry="5" />

          <circle className="penny__cheek" cx="124" cy="97" r="13" />
          <circle className="penny__cheek" cx="158" cy="97" r="13" />

          <circle className="penny__eye" cx={GEOMETRY.leftEye.x} cy={GEOMETRY.leftEye.y} r="8" />
          <circle className="penny__eye" cx={GEOMETRY.rightEye.x} cy={GEOMETRY.rightEye.y} r="8" />
          <circle cx="123" cy="71" r="2.6" fill="#fff" />
          <circle cx="153" cy="71" r="2.6" fill="#fff" />

          {/* Eyelids, matched in colour to the body so a blink reads as closure. */}
          <circle
            className="penny__lid penny__lid--left"
            cx={GEOMETRY.leftEye.x}
            cy={GEOMETRY.leftEye.y}
            r="8.6"
          />
          <circle
            className="penny__lid penny__lid--right"
            cx={GEOMETRY.rightEye.x}
            cy={GEOMETRY.rightEye.y}
            r="8.6"
          />
        </g>

        {/* A high-contrast sheen arc, to stop the large flat body looking dead. */}
        <path
          className="penny__shine"
          d="M 52 80 C 66 60 92 47 118 47 C 96 53 76 63 64 84 Z"
        />
      </g>
    </svg>
  )
}

/**
 * The small brand mark. The full mascot is unreadable at 46px, so the header
 * uses this reduced pig face instead — same palette, same identity, legible at
 * favicon scale.
 *
 * Colours come from CSS classes, not from `fill="var(--coral)"`. A presentation
 * attribute is not run through custom-property substitution in browsers, so the
 * var() form silently renders black — a mistake that is easy to make and hard to
 * spot in a screenshot.
 */
export function PennyMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle className="mark__face" cx="32" cy="32" r="29" />
      <path className="mark__ear" d="M 13 16 C 10 4 20 1 26 10 Z" />
      <path className="mark__ear" d="M 51 16 C 54 4 44 1 38 10 Z" />
      <circle className="mark__eye" cx="24" cy="28" r="3.4" />
      <circle className="mark__eye" cx="41" cy="28" r="3.4" />
      <ellipse className="mark__snout" cx="32" cy="43" rx="13" ry="10" />
      <ellipse className="mark__nostril" cx="28" cy="43" rx="2" ry="2.6" />
      <ellipse className="mark__nostril" cx="36" cy="43" rx="2" ry="2.6" />
    </svg>
  )
}
