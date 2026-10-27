// Finale QA: from the finale entrance to the page end and back, measuring the
// product's exact on-screen bounds against the headline, CTA and footer.
// Usage: node qa/finale.mjs <outDir> <width>x<height> [--mobile]
import { chromium } from 'playwright'
import fs from 'node:fs'

const [out, size, ...flags] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const mobile = flags.includes('--mobile')
fs.mkdirSync(out, { recursive: true })

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile })
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
await page.goto('http://localhost:3100/?qa')
await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
await page.waitForTimeout(3600)
// Freeze the time-based idle sway/bob so every measurement is purely the scroll choreography.
await page.evaluate(() => { window.__aether.runtime.poseOverride = { idle: 0 } })

/** k ∈ [0,1]: finale entrance (story 5.6 → 6). k ∈ [1,2]: story end → page end. */
async function goTo(k) {
  const y = await page.evaluate((k) => {
    const fin = document.querySelector('#finale')
    const specs = document.querySelector('#details')
    const finTop = fin.getBoundingClientRect().top + scrollY
    const specsTop = specs.getBoundingClientRect().top + scrollY
    const enterStart = specsTop + 0.6 * specs.offsetHeight
    const max = document.documentElement.scrollHeight - innerHeight
    const y = Math.round(k <= 1 ? enterStart + (finTop - enterStart) * k : finTop + (max - finTop) * (k - 1))
    scrollTo({ top: y, behavior: 'instant' })
    return y
  }, k)
  await page.waitForFunction((y) => Math.abs(scrollY - y) < 2, y)
  // Two frames so the director has read the new scroll position.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
  // Let smoothed story time settle completely.
  await page.waitForFunction(() => {
    const r = window.__aether.runtime
    return Math.abs(r.time - r.targetTime) < 1e-6
  }, null, { timeout: 15000 })
  await page.waitForTimeout(150)
  return page.evaluate(() => {
    const rect = (sel) => {
      const b = document.querySelector(sel).getBoundingClientRect()
      return { top: Math.round(b.top), bottom: Math.round(b.bottom) }
    }
    return {
      time: +window.__aether.runtime.time.toFixed(3),
      tail: Math.round(window.__aether.runtime.tail),
      product: window.__aetherProductRect(),
      headline: rect('#finale-title'),
      cta: rect('#finale button'),
      footer: rect('footer'),
    }
  })
}

const stops = [['enter-25', 0.25], ['enter-60', 0.6], ['story-end', 1], ['tail-50', 1.5], ['page-end', 2]]
const forward = {}
let ok = true
const report = (cond, msg) => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${msg}`)
  if (!cond) ok = false
}

for (const [name, k] of stops) {
  const g = await goTo(k)
  forward[name] = g
  console.log(name.padEnd(10), JSON.stringify(g))
  await page.screenshot({ path: `${out}/t-${name}.png` })
}

const end = forward['story-end']
report(end.product.top >= end.headline.bottom - 12, `story end: product clears the headline (product top ${end.product.top}, headline bottom ${end.headline.bottom})`)
report(end.product.bottom <= end.cta.top + 12, `story end: product rests above the CTA (product bottom ${end.product.bottom}, CTA top ${end.cta.top})`)
for (const name of ['story-end', 'tail-50', 'page-end']) {
  const g = forward[name]
  report(g.product.bottom <= g.footer.top, `${name}: product never enters the footer (product bottom ${g.product.bottom}, footer top ${g.footer.top})`)
}
// Locked to the page after the story ends: product and CTA move by the same amount.
const dProduct = forward['story-end'].product.top - forward['page-end'].product.top
const dCta = forward['story-end'].cta.top - forward['page-end'].cta.top
report(Math.abs(dProduct - dCta) <= 3, `after story end the product scrolls with the finale (product moved ${dProduct}px, CTA ${dCta}px)`)
// Settling: the product descends into place during the entrance.
report(
  forward['enter-25'].product.top < forward['story-end'].product.top,
  `product moves downward into its resting place (top ${forward['enter-25'].product.top} → ${forward['story-end'].product.top})`,
)

// Reverse: scroll back up through the same stops; every frame must match.
for (const [name, k] of [...stops].reverse()) {
  const g = await goTo(k)
  const f = forward[name]
  // Vertical framing only: the slow idle sway is time-based and legitimately
  // shifts the horizontal silhouette by a few pixels between passes.
  const d = Math.max(...['top', 'bottom'].map((s) => Math.abs(g.product[s] - f.product[s])))
  const tolerance = 1
  report(g.time === f.time, `reverse ${name}: identical story time (${g.time})`)
  report(d <= tolerance, `reverse ${name}: same framing (Δ ${d}px, tolerance ${tolerance}px)`)
}

report(errors.length === 0, `no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`)
await browser.close()
process.exit(ok ? 0 : 1)
