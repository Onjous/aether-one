// Frame-rate and resource measurements during a continuous scroll.
// Usage: node qa/perf.mjs [dpr=1] [width=1440] [height=900]
import { chromium } from 'playwright'
const dpr = Number(process.argv[2] ?? 1)
const width = Number(process.argv[3] ?? 1440)
const height = Number(process.argv[4] ?? 900)
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: dpr })
const page = await context.newPage()
let bytes = { js: 0, css: 0, font: 0, img: 0, other: 0 }
page.on('response', async (r) => {
  try {
    const len = (await r.body()).length
    const t = r.request().resourceType()
    const k = t === 'script' ? 'js' : t === 'stylesheet' ? 'css' : t === 'font' ? 'font' : t === 'image' ? 'img' : 'other'
    bytes[k] += len
  } catch {}
})
const t0 = Date.now()
await page.goto(`http://localhost:3100/?qa${process.env.PIN ? '&dpr=' + dpr : ''}`)
const fcp = await page.evaluate(() => new Promise((r) => {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') r(e.startTime) }).observe({ type: 'paint', buffered: true })
}))
await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
const ready = Date.now() - t0
await page.waitForTimeout(3500)

const result = await page.evaluate(async () => {
  const max = document.documentElement.scrollHeight - innerHeight
  const frames = []
  let last = performance.now()
  let running = true
  const loop = (t) => { frames.push(t - last); last = t; if (running) requestAnimationFrame(loop) }
  requestAnimationFrame(loop)
  const longTasks = []
  new PerformanceObserver((l) => l.getEntries().forEach((e) => longTasks.push(e.duration))).observe({ type: 'longtask' })
  const duration = 14000
  const start = performance.now()
  await new Promise((resolve) => {
    const step = () => {
      const k = (performance.now() - start) / duration
      window.scrollTo(0, Math.min(1, k) * max)
      if (k < 1) requestAnimationFrame(step); else resolve()
    }
    requestAnimationFrame(step)
  })
  running = false
  const f = frames.slice(5).sort((a, b) => a - b)
  const avg = f.reduce((a, b) => a + b, 0) / f.length
  const info = window.__aetherRenderer?.info
  return {
    frames: f.length,
    avgFps: +(1000 / avg).toFixed(1),
    p95FrameMs: +f[Math.floor(f.length * 0.95)].toFixed(1),
    worstFrameMs: +f[f.length - 1].toFixed(1),
    framesOver33ms: f.filter((x) => x > 33.4).length,
    longTasks: longTasks.length,
    drawCalls: info?.render.calls,
    triangles: info?.render.triangles,
    geometries: info?.memory.geometries,
    textures: info?.memory.textures,
    programs: info?.programs?.length,
    dpr: window.__aetherRenderer?.getPixelRatio(),
  }
})
console.log(JSON.stringify({ viewport: `${width}x${height}@${dpr}`, fcpMs: Math.round(fcp), revealedMs: ready, transferKB: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)])), ...result }, null, 1))
await browser.close()
