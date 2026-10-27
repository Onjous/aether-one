// Captures the hero entrance at fixed delays after the loader hands over.
import { chromium } from 'playwright'
const out = process.argv[2]
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
await page.goto('http://localhost:3100/?qa')
await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
const t0 = Date.now()
for (const ms of [400, 1200, 2500]) {
  await page.waitForTimeout(Math.max(0, ms - (Date.now() - t0)))
  await page.screenshot({ path: `${out}/t-intro-${String(ms).padStart(4, '0')}.png` })
}
await b.close()
