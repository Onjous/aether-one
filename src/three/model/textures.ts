import { CanvasTexture, LinearSRGBColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'

/**
 * Procedural textures, generated once on a 2D canvas at start-up.
 * No image files are downloaded; everything here is original.
 *
 * Mirroring note: the left ear cup is the right cup with scale.x = -1, which
 * mirrors its planar UVs. Anything with legible text is therefore drawn
 * mirrored for the side where it would otherwise read backwards.
 */

/** Deterministic PRNG so textures are identical on every load. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function canvas(size: number) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const ctx = c.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable')
  return { c, ctx }
}

function finish(c: HTMLCanvasElement, srgb: boolean, anisotropy = 4): Texture {
  const t = new CanvasTexture(c)
  t.colorSpace = srgb ? SRGBColorSpace : LinearSRGBColorSpace
  t.anisotropy = anisotropy
  t.needsUpdate = true
  return t
}

/**
 * Roughness map for the outer caps: concentric spun-metal grain around a
 * polished ring. Values multiply the material roughness.
 */
export function createCapRoughness(size: number) {
  const { c, ctx } = canvas(size)
  const rand = mulberry32(7)
  const cx = size / 2
  const cy = size / 2
  ctx.fillStyle = 'rgb(205,205,205)'
  ctx.fillRect(0, 0, size, size)

  // Spun grain: many thin concentric rings with random brightness.
  for (let r = 2; r < size * 0.72; r += 1.1) {
    const v = 175 + rand() * 80
    ctx.strokeStyle = `rgba(${v},${v},${v},0.55)`
    ctx.lineWidth = 0.6 + rand() * 0.9
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.stroke()
  }

  // Polished ring framing the printed mark (see createCapMark).
  ctx.strokeStyle = 'rgb(70,70,70)'
  ctx.lineWidth = size * 0.004
  ctx.beginPath()
  ctx.arc(cx, cy, size * 0.2, 0, Math.PI * 2)
  ctx.stroke()


  return finish(c, false, 8)
}

/**
 * Pad-printed cap marking (white on black) used as an emissive map, so it reads
 * as a faint light-grey print on every finish regardless of reflections.
 */
export function createCapMark(size: number) {
  const { c, ctx } = canvas(size)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, size, size)
  ctx.translate(size / 2, size / 2)
  ctx.fillStyle = '#fff'
  ctx.strokeStyle = '#fff'
  ctx.lineWidth = size * 0.0025
  ctx.beginPath()
  ctx.arc(0, 0, size * 0.2, 0, Math.PI * 2)
  ctx.stroke()
  ctx.font = `600 ${Math.round(size * 0.042)}px "Helvetica Neue", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('A E T H E R', 0, 0)
  ctx.font = `500 ${Math.round(size * 0.018)}px "Helvetica Neue", Arial, sans-serif`
  ctx.fillText('O N E', 0, size * 0.05)
  return finish(c, true, 8)
}

/**
 * A horizontally mirrored view of a texture. `clone()` shares the underlying
 * image, so the canvas is drawn and uploaded to the GPU only once.
 */
function mirroredCopy(t: Texture) {
  const m = t.clone()
  m.wrapS = RepeatWrapping
  m.repeat.x = -1
  m.offset.x = 1
  return m
}

/** Knitted acoustic scrim with a discreet L / R marking. */
export function createScrimMap(size: number, letter: 'L' | 'R', mirrored: boolean) {
  const { c, ctx } = canvas(size)
  const rand = mulberry32(letter === 'L' ? 11 : 13)
  // Knit cells written straight into pixel memory (far cheaper than tens of
  // thousands of fillRect calls). Each cell has a 1 px dark gap.
  const step = Math.max(3, Math.round(size / 160))
  const cells = Math.ceil(size / step)
  const shade = new Uint8Array(cells * cells).map(() => 22 + Math.floor(rand() * 14))
  const img = ctx.createImageData(size, size)
  const d = img.data
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const gap = x % step === step - 1 || y % step === step - 1
      const v = gap ? 18 : shade[Math.floor(y / step) * cells + Math.floor(x / step)]
      const i = (y * size + x) * 4
      d[i] = v
      d[i + 1] = v + 1
      d[i + 2] = v + 3
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  ctx.save()
  ctx.translate(size / 2, size * 0.24)
  if (mirrored) ctx.scale(-1, 1)
  ctx.fillStyle = 'rgba(150,156,166,0.75)'
  ctx.font = `500 ${Math.round(size * 0.07)}px "Helvetica Neue", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(letter, 0, 0)
  ctx.restore()
  return finish(c, true)
}

/** Alpha map for the perforated driver grille (white = metal, black = hole). */
export function createGrilleAlpha(size: number) {
  const { c, ctx } = canvas(size)
  ctx.fillStyle = '#fff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000'
  const pitch = size / 44
  const r = pitch * 0.34
  for (let row = 0, y = 0; y < size + pitch; row++, y += pitch * 0.866) {
    for (let x = row % 2 ? pitch / 2 : 0; x < size + pitch; x += pitch) {
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const t = finish(c, false)
  t.wrapS = t.wrapT = RepeatWrapping
  return t
}

/** Matte-black circuit board with gold traces and pads. */
export function createBoardMap(size: number) {
  const { c, ctx } = canvas(size)
  const rand = mulberry32(21)
  ctx.fillStyle = '#0d0f11'
  ctx.fillRect(0, 0, size, size)
  ctx.strokeStyle = 'rgba(184,146,74,0.55)'
  ctx.lineCap = 'round'
  for (let i = 0; i < 90; i++) {
    let x = rand() * size
    let y = rand() * size
    ctx.lineWidth = 0.8 + rand() * 1.6
    ctx.beginPath()
    ctx.moveTo(x, y)
    for (let k = 0; k < 4; k++) {
      const len = 10 + rand() * 60
      const dir = Math.floor(rand() * 4)
      // Traces run orthogonally with occasional 45° jogs, like a real layout.
      const dx = [1, 0, -1, 0][dir] * len
      const dy = [0, 1, 0, -1][dir] * len
      if (rand() > 0.7) {
        x += dx * 0.3
        y += dx * 0.3
        ctx.lineTo(x, y)
      }
      x += dx
      y += dy
      ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
  ctx.fillStyle = 'rgba(205,170,100,0.8)'
  for (let i = 0; i < 140; i++) {
    const s = 2 + rand() * 4
    ctx.fillRect(rand() * size, rand() * size, s, s)
  }
  const t = finish(c, true)
  t.wrapS = t.wrapT = RepeatWrapping
  t.repeat.set(2.2, 2.2)
  return t
}

export function createTextures(quality: 'high' | 'low') {
  const big = quality === 'high' ? 1024 : 512
  const mid = quality === 'high' ? 512 : 256
  const capL = createCapRoughness(big)
  const markL = createCapMark(mid * 2)
  return {
    capMarkR: mirroredCopy(markL),
    capMarkL: markL,
    capRoughnessR: mirroredCopy(capL),
    capRoughnessL: capL,
    scrimR: createScrimMap(mid, 'R', false),
    scrimL: createScrimMap(mid, 'L', true),
    grilleAlpha: createGrilleAlpha(mid),
    board: createBoardMap(mid),
  }
}

export type HeadphoneTextures = ReturnType<typeof createTextures>
