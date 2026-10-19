#!/usr/bin/env node
/**
 * Measures every text/background pair in the UI against WCAG 2.2.
 *
 * This exists because "WCAG AA compliant" is a claim, and claims about
 * accessibility are exactly the kind that quietly stop being true. Here the
 * palette in src/styles/tokens.css is mirrored below, each real pair is listed
 * with the ratio it needs, and the exit code is non-zero if any pair regresses.
 * Run it with `pnpm contrast`.
 *
 * Thresholds:
 *   4.5  normal text            (WCAG 2.2 §1.4.3 AA)
 *   3.0  large text >= 24px, or >= 18.66px bold (§1.4.3 AA)
 *   3.0  UI component boundaries and meaningful graphics (§1.4.11 AA)
 *   3.0  focus indicator against adjacent colour (§2.4.11 AA)
 */

const TOKENS = {
  bg: '#FFF8EC',
  bgDeep: '#F7E9D3',
  surface: '#FFFFFF',
  tintCoral: '#FFE4DC',
  tintSun: '#FFF0C9',
  tintMint: '#DCF5E7',
  tintSky: '#DEEAFF',
  tintGrape: '#EADFFF',
  ink: '#2A2140',
  inkSoft: '#5C5470',
  coral: '#FF6B4A',
  sun: '#FFC93C',
  mint: '#23A55A',
  mintDeep: '#1B7F45',
  sky: '#2F7FE0',
  grape: '#7A4FE0',
  skyDeep: '#1F63C4',
  white: '#FFFFFF',
}

/** @type {{fg: keyof TOKENS, bg: keyof TOKENS, min: number, where: string}[]} */
const PAIRS = [
  // Body copy — must clear 4.5:1
  { fg: 'ink', bg: 'bg', min: 4.5, where: 'body text on the app background' },
  { fg: 'ink', bg: 'surface', min: 4.5, where: 'body text on a card' },
  { fg: 'ink', bg: 'bgDeep', min: 4.5, where: 'body text on a recessed panel' },
  { fg: 'inkSoft', bg: 'bg', min: 4.5, where: 'secondary text on the app background' },
  { fg: 'inkSoft', bg: 'surface', min: 4.5, where: 'secondary text on a card' },
  { fg: 'inkSoft', bg: 'tintMint', min: 4.5, where: 'secondary text in the "need" bin' },
  { fg: 'inkSoft', bg: 'tintSky', min: 4.5, where: 'secondary text in the "want" bin' },

  { fg: 'ink', bg: 'tintMint', min: 4.5, where: 'text in the "need" bin' },
  { fg: 'ink', bg: 'tintSky', min: 4.5, where: 'text in the "want" bin' },
  { fg: 'ink', bg: 'tintSun', min: 4.5, where: 'text on a reward panel' },
  { fg: 'ink', bg: 'tintCoral', min: 4.5, where: 'text on a warm panel' },
  { fg: 'ink', bg: 'tintGrape', min: 4.5, where: 'text on a lavender panel' },

  // Ink on the saturated accents — the button treatment
  { fg: 'ink', bg: 'coral', min: 4.5, where: 'primary button label' },
  { fg: 'ink', bg: 'sun', min: 4.5, where: 'reward button label' },
  { fg: 'ink', bg: 'mint', min: 4.5, where: 'ink on the mint accent' },

  // White on saturated — only where it passes.
  // Rule: --sky, --mint and --sun are never text backgrounds for white. Measured
  // white-on-sky is 4.01:1 and white-on-mint is 3.18:1, both under 4.5:1, so the
  // deep blue and grape actions are the only ones allowed white labels.
  { fg: 'white', bg: 'skyDeep', min: 4.5, where: 'white label on the deep blue action' },
  { fg: 'white', bg: 'grape', min: 4.5, where: 'white label on the grape action' },

  // Non-text: boundaries and graphics — must clear 3:1.
  // Rule: a coloured shape carries a 3px ink outline, so its boundary is ink, not
  // the fill. That is why the checks below test ink outlines rather than raw fill
  // edges — coral on white measures only 2.82:1 and sun on white 1.54:1, and both
  // are legitimate fills precisely because they are never bare boundaries.
  { fg: 'ink', bg: 'coral', min: 3, where: 'ink outline around a coral button' },
  { fg: 'ink', bg: 'sun', min: 3, where: 'ink outline around a reward button' },
  { fg: 'ink', bg: 'mint', min: 3, where: 'ink outline around a mint shape' },
  { fg: 'ink', bg: 'sky', min: 3, where: 'ink outline around a sky shape' },
  // --grape and --sky-deep are the two "deep" accents and they load the opposite
  // way round: they are dark enough to carry white text, which also makes them
  // too dark for an ink outline to read against (ink-on-grape measures 2.89:1).
  // So they are not outlined — their own fill is the boundary, and that clears
  // 3:1 against every surface it sits on. Splitting the palette this way is what
  // lets both the white-label button and the ink-outlined sticker coexist.
  { fg: 'white', bg: 'grape', min: 3, where: 'grape fill reads as a shape on white' },
  { fg: 'mint', bg: 'bg', min: 3, where: '"need" bin boundary against the background' },
  { fg: 'sky', bg: 'bg', min: 3, where: '"want" bin boundary against the background' },
  { fg: 'grape', bg: 'bg', min: 3, where: 'progress fill against the background' },
  { fg: 'grape', bg: 'surface', min: 3, where: 'progress fill against a card' },
  { fg: 'grape', bg: 'tintGrape', min: 3, where: 'progress fill against its own track' },
  { fg: 'mintDeep', bg: 'tintGrape', min: 3, where: 'completed progress fill against its track' },
  { fg: 'mintDeep', bg: 'bg', min: 3, where: 'completed progress fill against the background' },
  { fg: 'mintDeep', bg: 'surface', min: 3, where: 'completed progress fill against a card' },
  { fg: 'white', bg: 'mintDeep', min: 4.5, where: 'white label on the deep green action' },

  // Focus ring — must clear 3:1 against everything it can land on
  { fg: 'ink', bg: 'bg', min: 3, where: 'focus ring on the app background' },
  { fg: 'ink', bg: 'surface', min: 3, where: 'focus ring on a card' },
  { fg: 'ink', bg: 'coral', min: 3, where: 'focus ring on a coral button' },
  { fg: 'ink', bg: 'sun', min: 3, where: 'focus ring on a reward button' },
  { fg: 'ink', bg: 'tintMint', min: 3, where: 'focus ring in the "need" bin' },
  { fg: 'ink', bg: 'tintSky', min: 3, where: 'focus ring in the "want" bin' },
]

function srgbToLinear(channel) {
  const c = channel / 255
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

function relativeLuminance(hex) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function contrastRatio(a, b) {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const lighter = Math.max(la, lb)
  const darker = Math.min(la, lb)
  return (lighter + 0.05) / (darker + 0.05)
}

const failures = []
const rows = []

for (const pair of PAIRS) {
  const fg = TOKENS[pair.fg]
  const bg = TOKENS[pair.bg]
  if (!fg || !bg) {
    failures.push(`unknown token in pair: ${pair.fg} / ${pair.bg}`)
    continue
  }
  const ratio = contrastRatio(fg, bg)
  const passes = ratio >= pair.min
  if (!passes) failures.push(`${ratio.toFixed(2)}:1 < ${pair.min}:1 — ${pair.where}`)
  rows.push({ ratio, min: pair.min, passes, where: pair.where, fg, bg })
}

const width = Math.max(...rows.map((r) => r.where.length))
console.log('\n  Money Meadow — WCAG 2.2 contrast audit\n')
console.log(
  `  ${'ratio'.padStart(7)}  ${'min'.padStart(4)}  ${'result'.padEnd(6)}  what it covers`,
)
console.log(`  ${'-'.repeat(7)}  ${'-'.repeat(4)}  ${'-'.repeat(6)}  ${'-'.repeat(width)}`)
for (const row of rows) {
  const mark = row.passes ? 'pass' : 'FAIL'
  console.log(
    `  ${`${row.ratio.toFixed(2)}:1`.padStart(7)}  ${`${row.min}:1`.padStart(4)}  ${mark.padEnd(6)}  ${row.where}`,
  )
}

const worst = rows.reduce((min, row) => (row.ratio / row.min < min.ratio / min.min ? row : min))
console.log(
  `\n  ${rows.length} pairs checked. Tightest margin: ${worst.ratio.toFixed(2)}:1 ` +
    `against a ${worst.min}:1 floor (${worst.where}).`,
)

if (failures.length > 0) {
  console.error(`\n  ${failures.length} contrast failure(s):\n`)
  for (const failure of failures) console.error(`    - ${failure}`)
  console.error('')
  process.exit(1)
}

console.log('  All pairs meet their WCAG 2.2 AA target.\n')
