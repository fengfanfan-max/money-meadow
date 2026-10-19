#!/usr/bin/env node
/**
 * Verifies the claim the grown-ups panel makes: that this app makes no network
 * request to any third party at runtime.
 *
 * The claim is concrete enough to test, so it is tested. The check has two
 * halves:
 *
 *   1. No absolute external URL survives into the build. A remote font, an
 *      analytics beacon or a CDN script all show up as an http(s) URL, a
 *      protocol-relative //host, or a bare hostname in a src/href attribute.
 *   2. No known analytics or advertising library is bundled, by name.
 *
 * Run with `pnpm check:network`. It reads dist/, so build first.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const DIST = new URL('../dist', import.meta.url).pathname

/**
 * Hosts that appear as *text* in the build but are never fetched.
 *
 * React embeds the address of its own error documentation in production error
 * messages. It is printed to a console, never requested, so counting it as a
 * network dependency would be wrong — and it is worth being explicit about that
 * rather than loosening the rule for everything.
 */
const ALLOWED_HOSTS = ['react.dev']

const FORBIDDEN_SIGNATURES = [
  'google-analytics',
  'googletagmanager',
  'gtag(',
  'analytics.track',
  'segment.com',
  'mixpanel',
  'amplitude',
  'hotjar',
  'sentry.io',
  'bugsnag',
  'datadoghq',
  'fullstory',
  'facebook.net',
  'fbq(',
  // "doubleclick" alone matches React's own onDoubleClick event name, so the
  // domain is the thing to look for.
  'doubleclick.net',
  'adsbygoogle',
  'googlesyndication',
  'cloudflareinsights',
  'clarity.ms',
  'posthog',
  'matomo',
  'plausible.io',
]

function walk(dir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else out.push(full)
  }
  return out
}

let files
try {
  files = walk(DIST)
} catch {
  console.error('\n  dist/ not found. Run `pnpm build` first.\n')
  process.exit(1)
}

const textFiles = files.filter((file) => /\.(js|css|html|json|svg|txt)$/.test(file))
const problems = []

console.log('\n  Money Meadow — runtime network audit\n')

// --- 1. External URLs ------------------------------------------------------
const urlPattern = /\bhttps?:\/\/[^\s"'`)\\]+/g
const protocolRelative = /["'(]\/\/[a-z0-9.-]+\.[a-z]{2,}/gi

let externalHits = 0
for (const file of textFiles) {
  const content = readFileSync(file, 'utf8')
  const name = relative(DIST, file)

  for (const match of content.match(urlPattern) ?? []) {
    // The SVG namespace and the HTML doctype-adjacent schema URLs are identifiers,
    // not requests. W3C and SVG namespace URIs are never fetched.
    const isNamespace =
      match.includes('www.w3.org') || match.includes('schema.org') || match.includes('ns.adobe.com')
    const host = new URL(match).host
    const isAllowed = ALLOWED_HOSTS.some((allowed) => host.includes(allowed))
    if (!isNamespace && !isAllowed) {
      problems.push(`${name}: references external URL ${match}`)
      externalHits += 1
    }
  }

  for (const match of content.match(protocolRelative) ?? []) {
    problems.push(`${name}: protocol-relative external reference ${match}`)
    externalHits += 1
  }
}
console.log(
  `  external URLs in the build ......... ${externalHits === 0 ? 'none' : `${externalHits} found`}`,
)

// --- 2. Third-party libraries ---------------------------------------------
const signatureHits = []
for (const file of textFiles) {
  const content = readFileSync(file, 'utf8').toLowerCase()
  const name = relative(DIST, file)
  for (const signature of FORBIDDEN_SIGNATURES) {
    if (content.includes(signature)) signatureHits.push(`${name}: contains "${signature}"`)
  }
}
for (const hit of signatureHits) problems.push(hit)
console.log(
  `  analytics or ad signatures ........ ${signatureHits.length === 0 ? 'none' : `${signatureHits.length} found`}`,
)

// --- 3. Every asset is local ---------------------------------------------
const html = readFileSync(join(DIST, 'index.html'), 'utf8')
const assetRefs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1])
const remoteRefs = assetRefs.filter((ref) => /^https?:|^\/\//.test(ref))
for (const ref of remoteRefs) problems.push(`index.html loads a remote asset: ${ref}`)
console.log(
  `  remote assets in index.html ........ ${remoteRefs.length === 0 ? 'none' : `${remoteRefs.length} found`}`,
)

// --- 4. Fonts are self-hosted --------------------------------------------
const hasLocalFonts = files.some((file) => file.endsWith('.woff2'))
console.log(`  webfonts bundled locally ........... ${hasLocalFonts ? 'yes' : 'no'}`)
if (!hasLocalFonts) problems.push('no woff2 files in dist — fonts may be loading from a CDN')

// --- Report ---------------------------------------------------------------
if (problems.length > 0) {
  console.error(`\n  ${problems.length} problem(s):\n`)
  for (const problem of problems) console.error(`    - ${problem}`)
  console.error('')
  process.exit(1)
}

console.log(
  '\n  The build is self-contained: after the page loads, nothing is fetched from anywhere.\n',
)
