// Usage: node qa/shoot.mjs <outDir> <width>x<height> <time,time,...> [--mobile] [--reduced] [--finish=id] [--url=...]
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const [outDir, size, timesArg = '0', ...flags] = process.argv.slice(2)
const [width, height] = size.split('x').map(Number)
const mobile = flags.includes('--mobile')
const reduced = flags.includes('--reduced')
const finish = flags.find((f) => f.startsWith('--finish='))?.split('=')[1]
const base = flags.find((f) => f.startsWith('--url='))?.split('=')[1] ?? 'http://localhost:3100/?qa'
const times = timesArg.split(',').map(Number)
fs.mkdirSync(outDir, { recursive: true })

const noWebgl = flags.includes('--nowebgl')
const browser = await chromium.launch({
  args: noWebgl ? ['--disable-webgl', '--disable-3d-apis'] : ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})
const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: mobile ? 2 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  reducedMotion: reduced ? 'reduce' : 'no-preference',
})
const page = await context.newPage()
const logs = []
page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`))

const t0 = Date.now()
await page.goto(base, { waitUntil: 'load' })
await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
const loadMs = Date.now() - t0
await page.waitForTimeout(reduced ? 600 : 3800)

if (finish) await page.evaluate((f) => window.__aether.appState.set({ finish: f }), finish)

for (const t of times) {
  await page.evaluate((time) => {
    const secs = [...document.querySelectorAll('[data-chapter]')]
    const i = Math.min(Math.floor(time), secs.length - 1)
    const el = secs[i]
    const top = el.getBoundingClientRect().top + window.scrollY
    const y = top + (time - i) * el.offsetHeight
    window.scrollTo({ top: y, behavior: 'instant' })
  }, t)
  await page.waitForTimeout(2200)
  // Let visible lazy images finish (hidden lazy images never load, so skip them).
  await page.evaluate(() =>
    Promise.race([
      Promise.all([...document.images].filter((i) => i.offsetParent && !i.complete).map((i) => i.decode().catch(() => {}))),
      new Promise((r) => setTimeout(r, 3000)),
    ]),
  )
  const state = await page.evaluate(() => ({ time: window.__aether.runtime.time, target: window.__aether.runtime.targetTime }))
  const file = path.join(outDir, `t${t.toFixed(2)}.png`)
  await page.screenshot({ path: file })
  console.log(`${file}  time=${state.time.toFixed(3)} target=${state.target.toFixed(3)}`)
}
console.log(`revealed after ${loadMs}ms`)
const info = await page.evaluate(() => {
  const c = document.querySelector('canvas')
  const gl = c?.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
  const dbg = gl?.getExtension('WEBGL_debug_renderer_info')
  return { renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'n/a', scrollW: document.documentElement.scrollWidth, innerW: window.innerWidth }
})
console.log(JSON.stringify(info))
console.log(logs.join('\n'))
await browser.close()
