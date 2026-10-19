#!/usr/bin/env node
/**
 * Measures the fenced blocks in a pitch document.
 *
 * Upwork's proposal box has a hard character limit, and a cover letter that gets
 * silently truncated at the end is the worst possible failure — the client reads
 * a sentence that stops mid-thought and concludes the applicant is careless.
 * Recounting by hand is how that happens, so this counts the actual text.
 *
 * Usage:
 *   node scripts/count-chars.mjs                       # every .md in docs/
 *   node scripts/count-chars.mjs docs/SomeFile.md
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const UPWORK_LIMIT = 5000

const targets =
  process.argv.slice(2).length > 0
    ? process.argv.slice(2)
    : readdirSync(new URL('../docs', import.meta.url))
        .filter((name) => name.endsWith('.md'))
        .map((name) => `docs/${name}`)

let anyBlock = false

for (const target of targets) {
  let text
  try {
    text = readFileSync(new URL(`../${target}`, import.meta.url), 'utf8')
  } catch {
    console.error(`  cannot read ${target}`)
    continue
  }

  // ``` fenced blocks, with the nearest preceding heading as the label.
  const blockPattern = /^(#{1,4} .*)$[\s\S]*?```[a-z]*\n([\s\S]*?)```/gm
  const lines = text.split('\n')
  const blocks = []
  let inFence = false
  let buffer = []
  let currentHeading = ''

  for (const line of lines) {
    const heading = /^#{1,4}\s+(.*)$/.exec(line)
    if (heading && !inFence) currentHeading = heading[1].trim()

    if (line.trimStart().startsWith('```')) {
      if (inFence) {
        blocks.push({ heading: currentHeading, body: buffer.join('\n') })
        buffer = []
      }
      inFence = !inFence
      continue
    }
    if (inFence) buffer.push(line)
  }
  void blockPattern

  if (blocks.length === 0) continue
  anyBlock = true

  console.log(`\n  ${target}\n`)
  for (const block of blocks) {
    const trimmed = block.body.replace(/\s+$/, '')
    const chars = [...trimmed].length
    const over = chars > UPWORK_LIMIT
    const pct = Math.round((chars / UPWORK_LIMIT) * 100)
    const flag = over ? `  OVER by ${chars - UPWORK_LIMIT}` : ''
    console.log(
      `    ${String(chars).padStart(5)} chars  ${String(pct).padStart(3)}% of limit  ${block.heading}${flag}`,
    )
  }
}

if (!anyBlock) {
  console.log('\n  No fenced blocks found.\n')
} else {
  console.log(`\n  Limit used: ${UPWORK_LIMIT} characters (Upwork proposal box).\n`)
}
