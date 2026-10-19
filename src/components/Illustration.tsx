import type { CSSProperties, ReactNode } from 'react'

/**
 * The illustration set.
 *
 * Every icon is hand-authored SVG on the same 64x64 grid with one consistent
 * treatment: a 3px ink outline and flat fills drawn from the palette. That
 * consistency is what makes eighteen separate drawings read as one set rather
 * than eighteen downloads, and it means the illustrations restyle themselves
 * when a token changes.
 *
 * They are all decorative. A game item is announced through its real text label,
 * so these carry `aria-hidden` and no title.
 */

export type IllustrationName =
  // Coin Catch shop stock
  | 'marble'
  | 'sticker'
  | 'eraser'
  | 'yoyo'
  | 'comic'
  | 'teddy'
  // Need or Want items
  | 'coat'
  | 'toothbrush'
  | 'milk'
  | 'shoes'
  | 'medicine'
  | 'icecream'
  | 'videogame'
  | 'cinema'
  // Savings goals
  | 'artset'
  | 'skateboard'
  | 'telescope'
  | 'bike'
  // Bin and section marks
  | 'heart'
  | 'star'
  | 'piggy'
  | 'jar'

type IllustrationProps = {
  name: IllustrationName
  className?: string
  style?: CSSProperties
}

function Svg({
  children,
  className,
  style,
}: {
  children: ReactNode
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      className={className}
      style={style}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function Illustration({ name, className, style }: IllustrationProps) {
  return (
    <Svg className={className} style={style}>
      {ART[name]}
    </Svg>
  )
}

const ART: Record<IllustrationName, ReactNode> = {
  /* --- Coin Catch stock --------------------------------------------------- */

  marble: (
    <>
      <circle className="ill ill--sky" cx="32" cy="32" r="22" />
      <path className="ill ill--line" d="M 20 22 C 26 30 36 34 44 30" />
      <path className="ill ill--line" d="M 18 36 C 26 42 34 44 42 40" />
      <circle className="ill ill--paper ill--line" cx="24" cy="23" r="4" />
    </>
  ),

  sticker: (
    <>
      <path className="ill ill--sun" d="M 10 12 H 54 V 44 L 44 54 H 10 Z" />
      <path className="ill ill--paper" d="M 44 54 V 44 H 54 Z" />
      <path
        className="ill ill--ink"
        d="M 32 22 l 3.4 7 7.6 1 -5.5 5.4 1.3 7.6 -6.8 -3.6 -6.8 3.6 1.3 -7.6 -5.5 -5.4 7.6 -1 z"
      />
    </>
  ),

  eraser: (
    <>
      <path className="ill ill--coral" d="M 12 42 L 34 16 H 52 L 30 42 Z" />
      <path className="ill ill--paper" d="M 12 42 L 30 42 L 52 42 L 52 52 H 12 Z" />
      <path className="ill ill--line" d="M 26 26 L 40 26" />
    </>
  ),

  yoyo: (
    <>
      <path className="ill ill--line" d="M 32 8 V 26" />
      <circle className="ill ill--grape" cx="32" cy="40" r="18" />
      <circle className="ill ill--paper ill--line" cx="32" cy="40" r="6" />
      <path className="ill ill--line" d="M 22 30 C 28 36 36 36 42 30" />
    </>
  ),

  comic: (
    <>
      <path className="ill ill--coral" d="M 8 14 H 40 V 46 H 8 Z" />
      <path className="ill ill--mint" d="M 40 14 H 56 V 46 H 40 Z" />
      <path className="ill ill--paper" d="M 44 20 H 52 V 30 H 44 Z" />
      <path className="ill ill--line" d="M 14 24 H 34" />
      <path className="ill ill--line" d="M 14 32 H 34" />
      <path className="ill ill--line" d="M 14 40 H 26" />
    </>
  ),

  teddy: (
    <>
      <circle className="ill ill--sun" cx="18" cy="18" r="8" />
      <circle className="ill ill--sun" cx="46" cy="18" r="8" />
      <circle className="ill ill--sun" cx="32" cy="28" r="17" />
      <ellipse className="ill ill--paper ill--line" cx="32" cy="34" rx="9" ry="7" />
      <circle className="ill ill--ink" cx="26" cy="26" r="2.4" />
      <circle className="ill ill--ink" cx="38" cy="26" r="2.4" />
      <path className="ill ill--ink" d="M 32 33 l -3 3 h 6 z" />
      <path className="ill ill--line" d="M 24 54 C 24 46 40 46 40 54" />
    </>
  ),

  /* --- Need or Want items ------------------------------------------------- */

  coat: (
    <>
      <path className="ill ill--sky" d="M 20 14 H 44 L 54 24 L 48 32 L 44 28 V 54 H 20 V 28 L 16 32 L 10 24 Z" />
      <path className="ill ill--line" d="M 32 14 V 54" />
      <path className="ill ill--paper" d="M 26 14 H 38 L 32 24 Z" />
      <circle className="ill ill--ink" cx="32" cy="32" r="2" />
      <circle className="ill ill--ink" cx="32" cy="42" r="2" />
    </>
  ),

  toothbrush: (
    <>
      <rect className="ill ill--coral" x="26" y="6" width="12" height="40" rx="5" />
      <rect className="ill ill--sun" x="24" y="44" width="16" height="14" rx="4" />
      <path className="ill ill--paper" d="M 26 6 H 38 V 16 H 26 Z" />
      <path className="ill ill--line" d="M 30 4 V 12" />
      <path className="ill ill--line" d="M 34 4 V 12" />
    </>
  ),

  milk: (
    <>
      <path className="ill ill--paper" d="M 18 20 L 32 8 L 46 20 V 56 H 18 Z" />
      <path className="ill ill--sky" d="M 18 36 H 46 V 44 H 18 Z" />
      <path className="ill ill--line" d="M 18 20 H 46" />
      <path className="ill ill--line" d="M 32 8 V 20" />
      <path className="ill ill--coral" d="M 26 26 H 38 V 32 H 26 Z" />
    </>
  ),

  shoes: (
    <>
      <path className="ill ill--grape" d="M 8 40 V 28 H 20 L 30 36 H 44 C 50 36 56 40 56 46 V 50 H 8 Z" />
      <path className="ill ill--paper" d="M 8 46 H 56 V 52 H 8 Z" />
      <path className="ill ill--line" d="M 34 38 L 40 32" />
      <path className="ill ill--line" d="M 40 38 L 46 32" />
    </>
  ),

  medicine: (
    <>
      <rect className="ill ill--paper" x="24" y="6" width="16" height="10" rx="3" />
      <path className="ill ill--coral" d="M 18 18 H 46 V 56 H 18 Z" />
      <path className="ill ill--paper" d="M 28 26 H 36 V 34 H 44 V 42 H 36 V 50 H 28 V 42 H 20 V 34 H 28 Z" />
    </>
  ),

  icecream: (
    <>
      <path className="ill ill--sun" d="M 20 30 L 32 58 L 44 30 Z" />
      <path className="ill ill--line" d="M 24 38 L 40 38" />
      <path className="ill ill--line" d="M 27 46 L 37 46" />
      <circle className="ill ill--coral" cx="32" cy="22" r="14" />
      <circle className="ill ill--mint" cx="22" cy="16" r="7" />
      <circle className="ill ill--grape" cx="42" cy="16" r="7" />
    </>
  ),

  videogame: (
    <>
      <path
        className="ill ill--sky"
        d="M 16 22 H 48 C 58 22 60 40 54 46 C 50 50 44 48 40 44 H 24 C 20 48 14 50 10 46 C 4 40 6 22 16 22 Z"
      />
      <path className="ill ill--ink" d="M 16 30 H 26 V 34 H 22 V 40 H 18 V 34 H 14 Z" />
      <circle className="ill ill--sun" cx="44" cy="31" r="4" />
      <circle className="ill ill--coral" cx="50" cy="39" r="4" />
    </>
  ),

  cinema: (
    <>
      <path className="ill ill--grape" d="M 8 16 H 56 V 48 H 8 Z" />
      <path className="ill ill--sun" d="M 24 26 l 3 6 7 1 -5 5 1 7 -6 -3.4 -6 3.4 1 -7 -5 -5 7 -1 z" />
      <path className="ill ill--ink" d="M 40 26 H 50 V 30 H 40 Z" />
      <path className="ill ill--ink" d="M 40 34 H 50 V 38 H 40 Z" />
      <path className="ill ill--paper" d="M 14 16 V 20 M 14 24 V 28 M 14 32 V 36 M 14 40 V 44" />
    </>
  ),

  /* --- Savings goals ------------------------------------------------------ */

  artset: (
    <>
      <path className="ill ill--paper" d="M 32 6 C 48 6 58 18 58 32 C 58 42 50 48 42 46 C 36 45 34 50 36 54 C 38 58 30 60 24 58 C 10 54 6 44 6 32 C 6 17 18 6 32 6 Z" />
      <circle className="ill ill--coral" cx="20" cy="22" r="5" />
      <circle className="ill ill--sun" cx="34" cy="16" r="5" />
      <circle className="ill ill--mint" cx="48" cy="26" r="5" />
      <circle className="ill ill--sky" cx="18" cy="38" r="5" />
    </>
  ),

  skateboard: (
    <>
      <path className="ill ill--grape" d="M 8 30 C 8 24 14 22 20 22 H 44 C 50 22 56 24 56 30 Z" />
      <path className="ill ill--line" d="M 18 30 V 36" />
      <path className="ill ill--line" d="M 46 30 V 36" />
      <circle className="ill ill--sun" cx="18" cy="42" r="7" />
      <circle className="ill ill--sun" cx="46" cy="42" r="7" />
      <circle className="ill ill--paper ill--line" cx="18" cy="42" r="2.5" />
      <circle className="ill ill--paper ill--line" cx="46" cy="42" r="2.5" />
    </>
  ),

  telescope: (
    <>
      <path className="ill ill--sky" d="M 6 22 L 42 10 L 48 22 L 12 34 Z" />
      <path className="ill ill--sun" d="M 44 16 L 58 12 L 60 20 L 46 24 Z" />
      <path className="ill ill--line" d="M 30 26 V 40" />
      <path className="ill ill--line" d="M 30 40 L 16 58" />
      <path className="ill ill--line" d="M 30 40 L 44 58" />
      <path className="ill ill--line" d="M 30 40 L 30 58" />
    </>
  ),

  bike: (
    <>
      <circle className="ill ill--paper" cx="15" cy="43" r="12" />
      <circle className="ill ill--paper" cx="49" cy="43" r="12" />
      {/* Frame: two triangles sharing the seat tube. */}
      <path className="ill ill--line" d="M 15 43 L 26 22 L 40 22" />
      <path className="ill ill--line" d="M 15 43 L 32 43 L 26 22" />
      <path className="ill ill--line" d="M 32 43 L 40 22" />
      <path className="ill ill--line" d="M 40 22 L 49 43" />
      {/* Handlebars and saddle. */}
      <path className="ill ill--coral" d="M 36 17 H 46 L 46 22 H 36 Z" />
      <path className="ill ill--sun" d="M 21 18 H 31 V 22 H 21 Z" />
      <circle className="ill ill--ink" cx="32" cy="43" r="2.6" />
      <circle className="ill ill--ink" cx="15" cy="43" r="2" />
      <circle className="ill ill--ink" cx="49" cy="43" r="2" />
    </>
  ),

  /* --- Marks -------------------------------------------------------------- */

  heart: <path className="ill ill--coral" d="M 32 54 C 6 36 8 14 22 12 C 28 11 31 15 32 18 C 33 15 36 11 42 12 C 56 14 58 36 32 54 Z" />,

  star: (
    <path
      className="ill ill--sun"
      d="M 32 6 l 7.6 16 17.4 2.2 -12.8 12.2 3.2 17.4 -15.4 -8.4 -15.4 8.4 3.2 -17.4 -12.8 -12.2 17.4 -2.2 z"
    />
  ),

  piggy: (
    <>
      <ellipse className="ill ill--coral" cx="32" cy="34" rx="22" ry="17" />
      <path className="ill ill--paper ill--line" d="M 34 22 h 8 v 4 h -8 z" />
      <ellipse className="ill ill--paper ill--line" cx="50" cy="36" rx="8" ry="7" />
      <circle className="ill ill--ink" cx="48" cy="36" r="1.6" />
      <circle className="ill ill--ink" cx="53" cy="36" r="1.6" />
      <circle className="ill ill--ink" cx="36" cy="30" r="2.2" />
      <rect className="ill ill--paper ill--line" x="20" y="48" width="8" height="10" rx="3" />
      <rect className="ill ill--paper ill--line" x="36" y="48" width="8" height="10" rx="3" />
    </>
  ),

  jar: (
    <>
      {/* Lid and neck */}
      <rect className="ill ill--grape" x="18" y="5" width="28" height="9" rx="4" />
      <path className="ill ill--paper" d="M 23 14 H 41 V 27 H 23 Z" />
      {/* Glass, with coins inside */}
      <path
        className="ill ill--sun"
        d="M 13 27 H 51 V 48 C 51 56 45 60 37 60 H 27 C 19 60 13 56 13 48 Z"
      />
      <circle className="ill ill--paper ill--line" cx="24" cy="46" r="6" />
      <circle className="ill ill--paper ill--line" cx="40" cy="46" r="6" />
      <circle className="ill ill--paper ill--line" cx="32" cy="35" r="6" />
      <path
        className="ill ill--line"
        d="M 13 27 H 51 V 48 C 51 56 45 60 37 60 H 27 C 19 60 13 56 13 48 Z"
      />
    </>
  ),
}
