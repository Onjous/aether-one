// Functional QA for AETHER ONE. Requires `next start` on :3100.
// Usage: node qa/interact.mjs
import { chromium } from 'playwright'

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })

async function open(opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...opts })
  const page = await context.newPage()
  const errors = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:3100/?qa')
  await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
  return { page, errors, context }
}

/** Scrolls so that story time equals `t`, then waits for the smoothed time to settle. */
async function goTo(page, t, settle = true) {
  await page.evaluate((time) => {
    const secs = [...document.querySelectorAll('[data-chapter]')]
    const i = Math.min(Math.floor(time), secs.length - 1)
    const top = secs[i].getBoundingClientRect().top + window.scrollY
    window.scrollTo({ top: top + (time - i) * secs[i].offsetHeight, behavior: 'instant' })
  }, t)
  // Wait until the director has read the new scroll position, then (optionally)
  // until the smoothed time has fully caught up with it.
  await page.waitForFunction((time) => Math.abs(window.__aether.runtime.targetTime - time) < 0.003, t, { timeout: 15000 })
  if (settle)
    await page.waitForFunction(
      () => Math.abs(window.__aether.runtime.time - window.__aether.runtime.targetTime) < 1e-6,
      null,
      { timeout: 15000 },
    )
}

const snap = (page) =>
  page.evaluate(() => {
    const p = window.__aether.pose
    const keys = ['camX', 'camY', 'camZ', 'rotX', 'rotY', 'rotZ', 'explodeCups', 'explodeCushion', 'explodeCore', 'explodeFrame', 'labelsExplode']
    return Object.fromEntries(keys.map((k) => [k, +p[k].toFixed(5)]))
  })
const diff = (a, b) => Math.max(...Object.keys(a).map((k) => Math.abs(a[k] - b[k])))

// ── 1. Load, exploded view reversibility ───────────────────────────────────
{
  const { page, errors, context } = await open()
  await page.waitForTimeout(3600)
  const samples = [2.05, 2.15, 2.25, 2.35, 2.45, 2.55, 2.65, 2.72, 2.8]
  const down = []
  for (const t of samples) {
    await goTo(page, t)
    down.push(await snap(page))
  }
  const peak = down[samples.indexOf(2.55)]
  check('Exploded view separates fully at hold', peak.explodeCups === 1 && peak.explodeCore === 1 && peak.labelsExplode === 1, JSON.stringify(peak))
  const end = down[down.length - 1]
  check('Exploded view reassembles before the next chapter', end.explodeCups === 0 && end.explodeCore === 0 && end.explodeCushion === 0)

  const up = []
  for (const t of [...samples].reverse()) {
    await goTo(page, t)
    up.unshift(await snap(page))
  }
  const worst = Math.max(...samples.map((_, i) => diff(down[i], up[i])))
  check('Scrolling up reproduces scrolling down exactly', worst < 1e-4, `max deviation ${worst}`)

  // Jumps across many chapters must land on the same pose as a gradual approach.
  await goTo(page, 6)
  await goTo(page, 2.45)
  const jumped = await snap(page)
  check('Jump from finale back into exploded view is deterministic', diff(jumped, down[samples.indexOf(2.45)]) < 1e-4)
  await goTo(page, 0)
  await goTo(page, 2.25)
  check('Jump from top into exploded view is deterministic', diff(await snap(page), down[samples.indexOf(2.25)]) < 1e-4)

  // ── 2. Finish selection through the real UI ──────────────────────────────
  await goTo(page, 4)
  await page.waitForTimeout(1200)
  for (const name of ['Titanium', 'Ember', 'Obsidian']) {
    await page.getByText(name, { exact: true }).click()
    const state = await page.evaluate(() => ({
      finish: window.__aether.appState.get().finish,
      checked: document.querySelector('input[name="finish"]:checked')?.value,
    }))
    check(`Finish "${name}" selectable by click`, state.finish === name.toLowerCase() && state.checked === name.toLowerCase())
  }
  await page.locator('input[name="finish"][value="obsidian"]').focus()
  await page.keyboard.press('ArrowDown')
  check('Finish radio group responds to arrow keys', (await page.evaluate(() => window.__aether.appState.get().finish)) === 'titanium')

  // ── 3. Rotation: mouse, keyboard, reset ──────────────────────────────────
  const surface = page.getByRole('slider', { name: 'Rotate the product' })
  const box = await surface.boundingBox()
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + box.width / 2 + 200, box.y + box.height / 2, { steps: 10 })
  await page.mouse.up()
  const yawAfterDrag = await page.evaluate(() => window.__aether.runtime.userYawTarget)
  check('Mouse drag rotates the product', Math.abs(yawAfterDrag - 1.8) < 0.05, `yaw ${yawAfterDrag.toFixed(3)} rad`)
  await page.waitForTimeout(800)
  const visibleYaw = await page.evaluate(() => window.__aether.runtime.userYaw * window.__aether.pose.interact)
  check('Rotation reaches the rendered model', visibleYaw > 1.5, `applied ${visibleYaw.toFixed(3)} rad`)
  await page.getByRole('button', { name: 'Reset view' }).click()
  check('Reset view returns rotation to zero', (await page.evaluate(() => window.__aether.runtime.userYawTarget)) === 0)
  await surface.focus()
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  const kb = await page.evaluate(() => ({ yaw: window.__aether.runtime.userYawTarget, aria: document.querySelector('[role=slider]').getAttribute('aria-valuenow') }))
  check('Arrow keys rotate by 15° steps and update aria-valuenow', Math.abs(kb.yaw - Math.PI / 6) < 1e-6 && kb.aria === '30', JSON.stringify(kb))
  await page.keyboard.press('Home')
  await goTo(page, 5.3)
  check('Leaving the configurator releases user rotation', (await page.evaluate(() => window.__aether.runtime.userYawTarget)) === 0)

  // ── 4. Dialog and navigation ─────────────────────────────────────────────
  await goTo(page, 6)
  await page.waitForTimeout(800)
  await page.getByRole('button', { name: 'Discover the Experience' }).click()
  check('CTA opens the concept dialog', await page.locator('dialog[open]').isVisible())
  await page.keyboard.press('Escape')
  check('Escape closes the dialog', (await page.locator('dialog[open]').count()) === 0)
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Sound' }).click()
  await page.waitForTimeout(2500)
  const top = await page.evaluate(() => Math.round(document.querySelector('#sound').getBoundingClientRect().top))
  check('Primary nav link scrolls to its chapter', Math.abs(top) < 4, `section top ${top}px`)

  // ── 4b. Finale: product never enters the footer; disclaimer only once ───
  {
    const finaleCheck = async () => {
      await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))
      await page.waitForTimeout(1500)
      return page.evaluate(() => ({
        product: window.__aetherProductRect(),
        footerTop: Math.round(document.querySelector('footer').getBoundingClientRect().top),
      }))
    }
    const f = await finaleCheck()
    check('Finale: product stays above the footer at the page end', f.product.bottom <= f.footerTop, `product bottom ${f.product.bottom}, footer top ${f.footerTop}`)
    const notices = await page.evaluate(() => document.body.innerText.split('AETHER and AETHER ONE are fictional').length - 1)
    check('Concept disclaimer appears once (footer only)', notices === 1, `${notices} occurrence(s)`)
    await goTo(page, 0)
  }

  // ── 5. Memory over repeated full scroll cycles ───────────────────────────
  const cdp = await context.newCDPSession(page)
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage')
    return (await cdp.send('Runtime.getHeapUsage')).usedSize / 1e6
  }
  const before = await heap()
  for (let c = 0; c < 3; c++) for (const t of [0, 1, 2.5, 3, 4, 5, 6]) await goTo(page, t, false)
  await goTo(page, 0)
  const after = await heap()
  check('JS heap stable across 3 full scroll cycles', after - before < 5, `${before.toFixed(1)} MB → ${after.toFixed(1)} MB`)

  check('No console errors (desktop)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

// ── 6. Touch device ─────────────────────────────────────────────────────────
{
  const { page, errors, context } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 })
  await page.waitForTimeout(3600)
  await goTo(page, 4)
  await page.waitForTimeout(800)
  const box = await page.getByRole('slider', { name: 'Rotate the product' }).boundingBox()
  const cdp = await context.newCDPSession(page)
  const touch = async (type, x, y) =>
    cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  await touch('touchStart', cx - 100, cy)
  for (let i = 1; i <= 10; i++) await touch('touchMove', cx - 100 + i * 20, cy)
  await touch('touchEnd')
  const yaw = await page.evaluate(() => window.__aether.runtime.userYawTarget)
  check('Horizontal swipe rotates the product on touch', yaw > 1, `yaw ${yaw.toFixed(3)} rad`)
  const touchAction = await page.evaluate(() => getComputedStyle(document.querySelector('[role=slider]')).touchAction)
  check('Rotation surface leaves vertical panning to the browser', touchAction === 'pan-y', touchAction)
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth)
  check('No horizontal overflow at 390px', scrollW === 390, `${scrollW}px`)
  check('Layout uses the portrait choreography', (await page.evaluate(() => window.__aether.runtime.layout)) === 'mobile')
  check('No console errors (touch)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

// ── 7. Reduced motion ───────────────────────────────────────────────────────
{
  const { page, errors, context } = await open({ reducedMotion: 'reduce' })
  await page.waitForTimeout(500)
  const intro = await page.evaluate(() => window.__aether.runtime.intro)
  check('Reduced motion: no intro animation', intro === 1)
  await goTo(page, 2.2, false)
  await page.waitForTimeout(300)
  const r = await page.evaluate(() => ({ time: window.__aether.runtime.time, cups: window.__aether.pose.explodeCups }))
  check('Reduced motion: scene snaps to the chapter still (no travelling camera)', r.time === 2.55 && r.cups === 1, JSON.stringify(r))
  const e1 = await page.evaluate(() => window.__aether.runtime.elapsed)
  await page.waitForTimeout(800)
  const e2 = await page.evaluate(() => window.__aether.runtime.elapsed)
  check('Reduced motion: ambient loops are frozen', e1 === e2)
  await page.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  await page.waitForTimeout(600)
  const rf = await page.evaluate(() => ({ p: window.__aetherProductRect(), f: Math.round(document.querySelector('footer').getBoundingClientRect().top) }))
  check('Reduced motion: product stays above the footer at the page end', rf.p.bottom <= rf.f, `product bottom ${rf.p.bottom}, footer top ${rf.f}`)
  const hidden = await page.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).visibility === 'hidden').length)
  check('Reduced motion: no content hidden for reveal animations', hidden === 0, `${hidden} hidden`)
  check('No console errors (reduced motion)', errors.length === 0, errors.slice(0, 3).join(' | '))
  await context.close()
}

await browser.close()

// ── 8. WebGL unavailable ────────────────────────────────────────────────────
{
  const b = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] })
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('http://localhost:3100/?qa')
  await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 30000 })
  await page.waitForTimeout(1500)
  const state = await page.evaluate(() => ({
    webgl: window.__aether.appState.get().webgl,
    cls: document.documentElement.classList.contains('no-webgl'),
    canvas: document.querySelectorAll('canvas').length,
    heroStill: getComputedStyle(document.querySelector('#arrival .webgl-still')).display,
    stillLoaded: document.querySelector('#arrival .webgl-still').complete && document.querySelector('#arrival .webgl-still').naturalWidth > 0,
  }))
  check('WebGL unavailable: fallback stills shown instead of a blank canvas', state.webgl === 'unsupported' && state.cls && state.canvas === 0 && state.heroStill === 'block' && state.stillLoaded, JSON.stringify(state))
  await page.screenshot({ path: process.env.QA_OUT ? `${process.env.QA_OUT}/no-webgl.png` : 'qa/output/no-webgl.png' })
  check('No page errors without WebGL', errors.length === 0, errors.join(' | '))
  await b.close()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
