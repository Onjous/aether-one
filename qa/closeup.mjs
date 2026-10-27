// Close-up renders of both ear-cup caps (checks the printed cap marking).
// Usage: node qa/closeup.mjs <outDir> [finish]
import { chromium } from 'playwright'
const [out, finish = 'obsidian'] = process.argv.slice(2)
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await b.newPage({ viewport: { width: 900, height: 700 } })
await page.goto('http://localhost:3100/?qa')
await page.waitForFunction(() => window.__aether?.appState.get().revealed === true)
await page.waitForTimeout(3800)
await page.addStyleTag({ content: 'main,header,footer,nav,[data-hero],.annotation{visibility:hidden!important}' })
await page.evaluate((f) => window.__aether.appState.set({ finish: f }), finish)
const base = { idle: 0, pointer: 0, interact: 0, labelsForm: 0, labelsExplode: 0, wave: 0, explodeFrame: 0, explodeCups: 0, explodeCushion: 0, explodeCore: 0, explodeCap: 0, rotX: 0, rotZ: 0, camX: 0, tgtX: 0, camY: -0.6, tgtY: -0.6, tgtZ: 0, camZ: 2.6, key: 1.2, env: 1.2 }
for (const [name, rotY] of [['right', -Math.PI / 2], ['left', Math.PI / 2]]) {
  await page.evaluate((p) => { window.__aether.runtime.poseOverride = p }, { ...base, rotY })
  await page.waitForTimeout(1600)
  await page.screenshot({ path: `${out}/t-cap-${finish}-${name}.png` })
}
await b.close()
