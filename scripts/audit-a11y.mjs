#!/usr/bin/env node
/**
 * Builds an audit copy of dist/ with axe-core wired in.
 *
 * The point of copying rather than injecting into the real build is that axe
 * never becomes part of the shipped app — the runtime network audit would
 * rightly fail if it did, and a children's app shipping an auditing library to
 * every visitor would be absurd.
 *
 * The runner walks the app: it audits the home screen, then opens the grown-ups
 * dialog, then each of the three games, and writes every result into a <pre> in
 * the page. Reading a result out of the DOM means this works with nothing more
 * than a static file server and a browser.
 *
 * Usage:  node scripts/audit-a11y.mjs       (builds .audit/)
 */

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const AUDIT = join(ROOT, '.audit')
const AXE = join(ROOT, 'node_modules', 'axe-core', 'axe.min.js')

if (!existsSync(DIST)) {
  console.error('\n  dist/ not found. Run `pnpm build` first.\n')
  process.exit(1)
}

if (!existsSync(AXE)) {
  console.error(
    '\n  axe-core is not installed.\n' +
      '  Install it as a dev dependency:  pnpm add -D axe-core\n' +
      '  It is only ever used by this script, never bundled into the app.\n',
  )
  process.exit(1)
}

rmSync(AUDIT, { recursive: true, force: true })
mkdirSync(AUDIT, { recursive: true })
cpSync(DIST, AUDIT, { recursive: true })
cpSync(AXE, join(AUDIT, 'axe.min.js'))

const RUNNER = `
<script src="./axe.min.js"></script>
<script>
(async function () {
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const results = [];

  async function audit(label) {
    try {
      const r = await axe.run(document, {
        resultTypes: ['violations', 'incomplete'],
        rules: { 'color-contrast': { enabled: true } },
      });
      results.push({
        screen: label,
        violations: r.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        })),
        incomplete: r.incomplete.map((v) => ({
          id: v.id,
          targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        })),
      });
    } catch (error) {
      results.push({ screen: label, error: String(error) });
    }
  }

  function click(selector) {
    const el = document.querySelector(selector);
    if (el) el.click();
    return Boolean(el);
  }

  await wait(900);
  await audit('home');

  click('.topbar__actions .btn--sun');
  await wait(500);
  await audit('grown-ups dialog');
  click('.grownups__head .btn');

  await wait(300);
  click(".game-card[data-accent='coral']");
  await wait(600);
  await audit('coin catch');
  // Pay the first item exactly, to catch the answered/complete states.
  click('.coin-rack .coin-btn:nth-child(3)');
  await wait(500);
  await audit('coin catch (answered)');
  click('.screen-head > .btn');

  await wait(400);
  click(".game-card[data-accent='mint']");
  await wait(600);
  await audit('need or want');
  click('.bin--need');
  await wait(500);
  await audit('need or want (answered)');
  click('.screen-head > .btn');

  await wait(400);
  click(".game-card[data-accent='grape']");
  await wait(600);
  await audit('save up');

  const pre = document.createElement('pre');
  pre.id = 'axe-results';
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.wordBreak = 'break-word';
  pre.style.font = '13px/1.5 ui-monospace, monospace';
  // A compact one-block-per-screen summary. The full node lists are in the
  // console for anyone who wants them; this is what a person actually reads.
  const lines = results.map(function (r) {
    if (r.error) return r.screen.toUpperCase() + ' -> ERROR ' + r.error;
    const v = r.violations.length === 0
      ? 'no violations'
      : r.violations.length + ' VIOLATION(S): ' + r.violations.map(function (x) {
          return x.id + ' [' + x.impact + '] x' + x.nodes + ' @ ' + x.targets.join(' | ');
        }).join('  ;;  ');
    const inc = r.incomplete.length
      ? '  (needs review: ' + r.incomplete.map(function (x) {
          return x.id + ' @ ' + x.targets.join(' | ');
        }).join('  ;;  ') + ')'
      : '';
    return r.screen.toUpperCase() + ' -> ' + v + inc;
  });
  pre.textContent = lines.join('\\n\\n');
  document.body.appendChild(pre);
  document.title = 'AUDIT-DONE';
})();
</script>
`

const indexPath = join(AUDIT, 'index.html')
const html = readFileSync(indexPath, 'utf8')
writeFileSync(indexPath, html.replace('</body>', `${RUNNER}</body>`))

console.log(`\n  Audit build written to ${AUDIT}`)
console.log('  Serve it and open index.html; results land in #axe-results.\n')
