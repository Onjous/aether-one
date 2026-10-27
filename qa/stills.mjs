// Renders the fallback stills and the social image from the live 3D scene.
// Usage: node qa/stills.mjs  (server must be running on :3100)
import { chromium } from 'playwright'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
const out = fileURLToPath(new URL('../public/stills/', import.meta.url))
fs.mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })

async function open(width, height) {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  await page.goto('http://localhost:3100/?qa')
  await page.waitForFunction(() => window.__aether?.appState.get().revealed === true, null, { timeout: 60000 })
  await page.waitForTimeout(3800)
  return page
}

const base = {
  camX: 0, camY: 0.2, camZ: 5.6, tgtX: 0, tgtY: 0, tgtZ: 0, rotZ: 0, posX: 0, posY: 0, posZ: 0,
  idle: 0, pointer: 0, interact: 0, labelsForm: 0, labelsExplode: 0, wave: 0,
  explodeFrame: 0, explodeCups: 0, explodeCushion: 0, explodeCore: 0, explodeCap: 0,
  key: 1.05, rim: 1.1, accent: 0.45, env: 1, glow: 0.6, warm: 0,
}
const shots = [
  { name: 'hero', pose: { rotX: 0.1, rotY: -0.55 } },
  { name: 'form', pose: { rotX: 0.14, rotY: -1.12, camZ: 5.8 } },
  { name: 'exploded', pose: { rotX: 0.32, rotY: 0.6, camY: 1.2, camZ: 9.2, tgtY: 0.12, explodeFrame: 1, explodeCups: 1, explodeCushion: 1, explodeCore: 1, explodeCap: 1 } },
  { name: 'obsidian', finish: 'obsidian', pose: { rotX: 0.1, rotY: -0.65 } },
  { name: 'titanium', finish: 'titanium', pose: { rotX: 0.1, rotY: -0.65 } },
  { name: 'ember', finish: 'ember', pose: { rotX: 0.1, rotY: -0.65 } },
]

const page = await open(1600, 1000)
await page.addStyleTag({
  content:
    'html,body{background:transparent!important}[data-backdrop],.grain,main,header,footer,nav,[data-hero],.annotation,a[href="#main"]{visibility:hidden!important}',
})

/** Screenshot with alpha, re-encoded to WebP by Chromium itself. */
async function saveWebp(name) {
  const png = await page.screenshot({ omitBackground: true })
  const dataUrl = await page.evaluate(async (src) => {
    const img = new Image()
    img.src = src
    await img.decode()
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    c.getContext('2d').drawImage(img, 0, 0)
    return c.toDataURL('image/webp', 0.86)
  }, 'data:image/png;base64,' + png.toString('base64'))
  fs.writeFileSync(`${out}${name}.webp`, Buffer.from(dataUrl.split(',')[1], 'base64'))
}
for (const s of shots) {
  await page.evaluate(({ pose, finish }) => {
    const a = window.__aether
    if (finish) a.appState.set({ finish })
    a.runtime.userYawTarget = a.runtime.userPitchTarget = 0
    a.runtime.poseOverride = pose
  }, { pose: { ...base, ...s.pose }, finish: s.finish })
  await page.waitForTimeout(1800)
  await saveWebp(s.name)
  console.log('still', s.name)
}
await page.close()

// Social preview: the real hero, UI included.
const og = await open(1200, 630)
await og.screenshot({ path: `${out}og.jpg`, type: 'jpeg', quality: 86 })
console.log('still og')
await browser.close()
