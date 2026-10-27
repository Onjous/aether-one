// Usage: node qa/sheet.mjs <dir> <out.png> [columnWidth=260]
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
const [dir, out, colW = '260'] = process.argv.slice(2)
const files = fs.readdirSync(dir).filter((f) => (f.endsWith('.png') || f.endsWith('.jpg')) && f.startsWith('t')).sort()
const imgs = files
  .map((f) => `<figure><img src="data:image/jpeg;base64,${fs.readFileSync(path.join(dir, f)).toString('base64')}"><figcaption>${f}</figcaption></figure>`)
  .join('')
const html = `<html><body style="margin:0;background:#222;display:flex;gap:8px;padding:8px;font:12px monospace;color:#ccc">${imgs}<style>figure{margin:0;width:${colW}px}img{width:100%;display:block}</style></body></html>`
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: files.length * (Number(colW) + 8) + 8, height: 600 } })
await page.setContent(html)
await page.screenshot({ path: out, fullPage: true })
await browser.close()
console.log(out)
