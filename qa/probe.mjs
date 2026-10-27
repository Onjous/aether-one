// Usage: node qa/probe.mjs <width>x<height> <storyTime> "<js expression>"
import { chromium } from 'playwright'
const [size, time, expr] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width, height } })
await page.goto('http://localhost:3100/?qa')
await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
await page.waitForTimeout(1500)
await page.evaluate((t) => {
  const secs = [...document.querySelectorAll('[data-chapter]')]
  const i = Math.min(Math.floor(t), secs.length - 1)
  const top = secs[i].getBoundingClientRect().top + window.scrollY
  window.scrollTo({ top: top + (t - i) * secs[i].offsetHeight, behavior: 'instant' })
}, Number(time))
await page.waitForTimeout(1500)
console.log(JSON.stringify(await page.evaluate(expr), null, 1))
await browser.close()
