import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'

/**
 * Low-level procedural geometry builders for the AETHER ONE model.
 *
 * Two primitives cover almost every part:
 *
 * - `loft`  — revolves a 2D profile around the X axis, where every ring is a
 *             superellipse (or a blend towards a circle). Used for ear-cup
 *             shells, caps, cushions, baffles and scrims.
 * - `sweep` — extrudes a closed 2D cross-section along a planar path. Used for
 *             the headband, its spine, the pad and the yokes.
 *
 * Normal orientation is guaranteed by construction rather than fixed up later:
 * loft profiles that close on themselves are authored clockwise in (x, s)
 * space, and sweep cross-sections counter-clockwise in (u, v) space. Repeating
 * a profile point creates a zero-area strip, which yields a crisp crease
 * without splitting the mesh.
 */

export interface RingShape {
  /** Half-width along Z. */
  a: number
  /** Half-height along Y. */
  b: number
  /** Superellipse exponent (2 = ellipse, higher = squarer). */
  n: number
}

/** A loft profile row: axial position, ring scale, and circle blend (0 = superellipse, 1 = circle of radius `s`). */
export type LoftRow = [x: number, s: number, circle?: number]

const sgnPow = (v: number, p: number) => Math.sign(v) * Math.pow(Math.abs(v), p)

/** Point on the unit superellipse ring at angle θ, returned as (y, z). */
export function ringPoint(theta: number, n: number): [number, number] {
  return [sgnPow(Math.sin(theta), 2 / n), sgnPow(Math.cos(theta), 2 / n)]
}

/**
 * Indexed grid surface. `rows` run along the profile, `cols` around the ring.
 * The triangle normal is d(row) × d(col).
 */
function gridGeometry(
  rows: number,
  cols: number,
  position: (i: number, j: number, out: Vector3) => void,
  closeRows: boolean,
  uv?: (p: Vector3) => [number, number],
) {
  const positions = new Float32Array(rows * cols * 3)
  const uvs = uv ? new Float32Array(rows * cols * 2) : null
  const p = new Vector3()
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      position(i, j, p)
      const k = i * cols + j
      positions[k * 3] = p.x
      positions[k * 3 + 1] = p.y
      positions[k * 3 + 2] = p.z
      if (uvs && uv) {
        const [u, v] = uv(p)
        uvs[k * 2] = u
        uvs[k * 2 + 1] = v
      }
    }
  }

  const index: number[] = []
  const rowLimit = closeRows ? rows : rows - 1
  for (let i = 0; i < rowLimit; i++) {
    const i1 = (i + 1) % rows
    for (let j = 0; j < cols; j++) {
      const j1 = (j + 1) % cols
      const a = i * cols + j
      const b = i * cols + j1
      const c = i1 * cols + j
      const d = i1 * cols + j1
      index.push(a, c, b, b, c, d)
    }
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  if (uvs) geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(index)
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

export interface LoftOptions {
  segments?: number
  /** Treat the profile as a closed loop (e.g. a cushion cross-section). */
  closed?: boolean
  /** Planar UVs projected onto the YZ plane, normalised by this half-extent. */
  planarUV?: number
}

export function loft(profile: LoftRow[], shape: RingShape, opts: LoftOptions = {}) {
  const segments = opts.segments ?? 128
  const rings: [number, number][] = []
  for (let j = 0; j < segments; j++) rings.push(ringPoint((j / segments) * Math.PI * 2, shape.n))

  const uvScale = opts.planarUV
  return gridGeometry(
    profile.length,
    segments,
    (i, j, out) => {
      const [x, s, c = 0] = profile[i]
      const [sy, sz] = rings[j]
      const theta = (j / segments) * Math.PI * 2
      const ey = shape.b * sy
      const ez = shape.a * sz
      const cy = Math.sin(theta)
      const cz = Math.cos(theta)
      out.set(x, s * (ey + (cy - ey) * c), s * (ez + (cz - ez) * c))
    },
    !!opts.closed,
    uvScale ? (p) => [0.5 + p.z / (2 * uvScale), 0.5 + p.y / (2 * uvScale)] : undefined,
  )
}

/** Smooths a sparse control polygon into an evenly sampled profile. */
export function smoothProfile(points: [number, number][], samples: number): LoftRow[] {
  const curve = new CatmullRomCurve3(
    points.map(([x, s]) => new Vector3(x, s, 0)),
    false,
    'centripetal',
  )
  return curve.getSpacedPoints(samples).map((v) => [v.x, v.y] as LoftRow)
}

/** Clockwise superellipse loop in (x, s) for closed loft profiles. */
export function loopProfile(
  cx: number,
  cs: number,
  hx: number,
  hs: number,
  m: number,
  count: number,
  bulge = 0,
): LoftRow[] {
  const rows: LoftRow[] = []
  for (let k = 0; k < count; k++) {
    const phi = (k / count) * Math.PI * 2
    const c = Math.cos(phi)
    const s = Math.sin(phi)
    // Optional outward bulge on the face pointing away from the shell (-x).
    const extra = c < 0 ? bulge * Math.pow(-c, 1.5) : 0
    rows.push([cx + sgnPow(c, 2 / m) * hx - extra, cs - sgnPow(s, 2 / m) * hs])
  }
  return rows
}

// ---------------------------------------------------------------------------
// Sweeps
// ---------------------------------------------------------------------------

export type Profile2D = [u: number, v: number][]

/** Counter-clockwise rounded rectangle; `w` along u (normal), `h` along v (binormal). */
export function roundedRect(w: number, h: number, r: number, cornerSegments = 5): Profile2D {
  const hw = w / 2
  const hh = h / 2
  const rr = Math.min(r, hw, hh)
  const corners: [number, number, number][] = [
    [hw - rr, hh - rr, 0],
    [-hw + rr, hh - rr, Math.PI / 2],
    [-hw + rr, -hh + rr, Math.PI],
    [hw - rr, -hh + rr, (3 * Math.PI) / 2],
  ]
  const pts: Profile2D = []
  for (const [cu, cv, start] of corners) {
    for (let k = 0; k <= cornerSegments; k++) {
      const a = start + (k / cornerSegments) * (Math.PI / 2)
      pts.push([cu + Math.cos(a) * rr, cv + Math.sin(a) * rr])
    }
  }
  return pts
}

/** Counter-clockwise superellipse cross-section. */
export function superProfile(hu: number, hv: number, m: number, count: number, offsetU = 0): Profile2D {
  const pts: Profile2D = []
  for (let k = 0; k < count; k++) {
    const phi = (k / count) * Math.PI * 2
    pts.push([offsetU + sgnPow(Math.cos(phi), 2 / m) * hu, sgnPow(Math.sin(phi), 2 / m) * hv])
  }
  return pts
}

export interface SweepOptions {
  capStart?: boolean
  capEnd?: boolean
}

/**
 * Sweeps a closed cross-section along a planar path.
 *
 * Frame: T = path tangent, N = T × planeNormal (in-plane normal), B = planeNormal.
 * Cross-section points are (u along N, v along B) and must be counter-clockwise.
 * `profileAt(t)` may vary with t ∈ [0, 1] but must return the same point count.
 */
export function sweep(
  path: Vector3[],
  planeNormal: Vector3,
  profileAt: (t: number) => Profile2D,
  opts: SweepOptions = {},
) {
  const rows = path.length
  const profiles = path.map((_, i) => profileAt(i / (rows - 1)))
  const cols = profiles[0].length
  const frames = path.map((_, i) => {
    const prev = path[Math.max(0, i - 1)]
    const next = path[Math.min(rows - 1, i + 1)]
    const T = next.clone().sub(prev).normalize()
    const N = T.clone().cross(planeNormal).normalize()
    return { T, N, B: planeNormal.clone().normalize() }
  })

  const body = gridGeometry(
    rows,
    cols,
    (i, j, out) => {
      const [u, v] = profiles[i][j]
      const { N, B } = frames[i]
      out.copy(path[i]).addScaledVector(N, u).addScaledVector(B, v)
    },
    false,
  )

  if (!opts.capStart && !opts.capEnd) return body

  const pos = Array.from(body.getAttribute('position').array as Float32Array)
  const nor = Array.from(body.getAttribute('normal').array as Float32Array)
  const idx = Array.from(body.getIndex()!.array)

  const addCap = (i: number, flip: boolean) => {
    const { T, N, B } = frames[i]
    const normal = flip ? T.clone() : T.clone().negate()
    const base = pos.length / 3
    let cu = 0
    let cv = 0
    profiles[i].forEach(([u, v]) => {
      cu += u
      cv += v
    })
    cu /= cols
    cv /= cols
    const center = path[i].clone().addScaledVector(N, cu).addScaledVector(B, cv)
    pos.push(center.x, center.y, center.z)
    nor.push(normal.x, normal.y, normal.z)
    for (let j = 0; j < cols; j++) {
      const [u, v] = profiles[i][j]
      const p = path[i].clone().addScaledVector(N, u).addScaledVector(B, v)
      pos.push(p.x, p.y, p.z)
      nor.push(normal.x, normal.y, normal.z)
    }
    for (let j = 0; j < cols; j++) {
      const a = base + 1 + j
      const b = base + 1 + ((j + 1) % cols)
      if (flip) idx.push(base, b, a)
      else idx.push(base, a, b)
    }
  }
  if (opts.capStart) addCap(0, false)
  if (opts.capEnd) addCap(rows - 1, true)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(pos, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(nor, 3))
  geometry.setIndex(idx)
  geometry.computeBoundingSphere()
  body.dispose()
  return geometry
}

/** Samples a parametric path into `count + 1` points. */
export function samplePath(fn: (t: number, out: Vector3) => void, count: number) {
  const pts: Vector3[] = []
  for (let i = 0; i <= count; i++) {
    const v = new Vector3()
    fn(i / count, v)
    pts.push(v)
  }
  return pts
}

export { sgnPow }
