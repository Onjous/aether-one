import {
  BoxGeometry,
  BufferGeometry,
  CapsuleGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import {
  loft,
  loopProfile,
  ringPoint,
  roundedRect,
  samplePath,
  sgnPow,
  smoothProfile,
  superProfile,
  sweep,
  type LoftRow,
  type RingShape,
} from './builders'

/**
 * AETHER ONE — procedural model definition.
 *
 * Units are arbitrary (≈ 1 unit = 10 cm). Axes: X runs ear to ear, Y is up,
 * Z faces forward. Ear-cup parts are authored for the RIGHT side in a local
 * frame whose origin is the cup's rim plane, with +X pointing away from the
 * head. The left side reuses the same geometry mirrored (scale.x = -1).
 *
 * Every component is its own geometry so the exploded view can move parts
 * independently along the axis they were assembled on.
 */

export const DIM = {
  /** Ear-cup outline (superellipse). */
  cup: { a: 0.4, b: 0.5, n: 2.6 } satisfies RingShape,
  /** Rim plane of the right cup, from the centre of the head. */
  cupX: 0.6,
  /** Vertical centre of the cups. */
  cupY: -0.36,
  /** Plane of the yoke, in cup-local X. */
  yokeLocalX: 0.13,
  /** Yoke centre-line offset from the cup outline. */
  yokeOffset: 0.058,
  /** Headband path. */
  band: { rx: 0.73, yBase: 0.5, ry: 0.84, m: 2.35 },
  /** Vertical offset that centres the assembled product on the origin. */
  centerY: -0.24,
} as const

export const YOKE_X = DIM.cupX + DIM.yokeLocalX

/** Exploded-view travel for each part (cup-local X unless noted). */
export const EXPLODE = {
  frameLift: 0.32,
  cupsOut: 0.7,
  pinsOut: 0.1,
  cap: 0.5,
  accentRing: 0.41,
  pcb: -0.24,
  motor: -0.4,
  diaphragm: -0.56,
  baffle: -0.72,
  cushion: -0.92,
} as const

export type Quality = 'high' | 'low'

/** Point on the cup outline at angle θ for ring scale s, in cup-local (y, z). */
export function cupOutline(theta: number, s: number): [number, number] {
  const [sy, sz] = ringPoint(theta, DIM.cup.n)
  return [DIM.cup.b * s * sy, DIM.cup.a * s * sz]
}

/** Outward normal of the cup outline at angle θ, as (y, z). */
export function cupOutlineNormal(theta: number): [number, number] {
  const { a, b, n } = DIM.cup
  const [y, z] = cupOutline(theta, 1)
  const gy = (n * sgnPow(y / b, n - 1)) / b
  const gz = (n * sgnPow(z / a, n - 1)) / a
  const len = Math.hypot(gy, gz) || 1
  return [gy / len, gz / len]
}

function lathe(points: [r: number, h: number][], segments: number) {
  const g = new LatheGeometry(
    points.map(([r, h]) => new Vector2(r, h)),
    segments,
  )
  // Lathe revolves around +Y; rotate so the axis is +X (h → x).
  g.rotateZ(-Math.PI / 2)
  return g
}

function cylinderX(radius: number, length: number, segments: number, open = false) {
  const g = new CylinderGeometry(radius, radius, length, segments, 1, open)
  g.rotateZ(-Math.PI / 2)
  return g
}

export function createHeadphoneGeometry(quality: Quality) {
  const seg = quality === 'high' ? 144 : 96
  const pathSeg = quality === 'high' ? 160 : 100
  const ring = quality === 'high' ? 28 : 18
  const { cup } = DIM

  // ── Ear-cup shell ────────────────────────────────────────────────────────
  // One continuous profile: inner floor → inner wall → rolled rim → outer
  // wall → shoulder → recessed seat for the cap. Ends on the axis at both
  // ends, so the shell is a closed solid.
  const shellProfile: LoftRow[] = [
    [0.25, 0],
    [0.25, 0.35],
    [0.25, 0.68],
    ...smoothProfile(
      [
        [0.248, 0.72],
        [0.215, 0.79],
        [0.12, 0.88],
        [0.05, 0.912],
        [0.012, 0.925],
        [0.0, 0.952],
        [0.008, 0.985],
        [0.04, 1.0],
        [0.12, 1.0],
        [0.2, 0.975],
        [0.255, 0.925],
        [0.287, 0.865],
        [0.302, 0.822],
      ],
      quality === 'high' ? 64 : 40,
    ),
    [0.302, 0.822],
    [0.292, 0.81],
    [0.292, 0.81],
    [0.292, 0.5],
    [0.292, 0],
  ]
  const shell = loft(shellProfile, cup, { segments: seg })

  // Outer cap: a shallow dome with a chamfered edge. Planar UVs carry the
  // spun-metal roughness map and engraved wordmark.
  const capProfile: LoftRow[] = [
    [0.294, 0.796],
    [0.294, 0.796],
    ...smoothProfile(
      [
        [0.3, 0.796],
        [0.314, 0.786],
        [0.322, 0.76],
        [0.327, 0.7],
        [0.333, 0.45],
        [0.336, 0.0],
      ],
      quality === 'high' ? 36 : 24,
    ),
    // Underside, so the cap reads as a solid part once it lifts away.
    [0.294, 0],
    [0.294, 0.4],
  ]
  const cap = loft(capProfile, cup, { segments: seg, planarUV: cup.b * 0.8, closed: true })

  // Hairline accent ring seated between shell and cap.
  const accentRing = loft(loopProfile(0.301, 0.808, 0.0045, 0.011, 2, 12), cup, {
    segments: seg,
    closed: true,
  })

  // Four cap-retaining screws on the recessed seat (revealed when the cap lifts).
  const screw = cylinderX(0.012, 0.008, 16)
  screw.translate(0.296, 0, 0)

  // ── Cushion ──────────────────────────────────────────────────────────────
  const cushion = loft(loopProfile(-0.084, 0.8, 0.074, 0.2, 3.1, ring * 2, 0.012), cup, {
    segments: seg,
    closed: true,
  })
  // Raised piping around the cushion's outer equator.
  const piping = loft(loopProfile(-0.07, 1.0, 0.0045, 0.009, 2, 10), cup, { segments: seg, closed: true })
  // Hard mounting plate that clips the cushion to the cup.
  const cushionMount = loft(
    [
      [-0.014, 0.62],
      [-0.014, 0.965],
      [-0.014, 0.965],
      [0, 0.965],
      [0, 0.965],
      [0, 0.62],
      [0, 0.62],
      [-0.014, 0.62],
    ],
    cup,
    { segments: seg, closed: true },
  )
  // Acoustic scrim stretched across the cushion opening (faces the ear).
  const scrim = loft(
    [
      [-0.006, 0],
      [-0.006, 0.3],
      [-0.006, 0.64],
    ],
    cup,
    { segments: seg, planarUV: cup.b * 0.64 },
  )

  // ── Baffle and grille ────────────────────────────────────────────────────
  // A plate whose outline is the cup superellipse and whose opening is the
  // circular driver port: rows blend from circle (c = 1) to superellipse.
  const portR = 0.27
  const baffle = loft(
    [
      [0.01, portR, 1],
      [0.01, 0.9, 0],
      [0.01, 0.9, 0],
      [0.024, 0.9, 0],
      [0.024, 0.9, 0],
      [0.024, portR, 1],
      [0.024, portR, 1],
      [0.01, portR, 1],
    ],
    cup,
    { segments: seg, closed: true },
  )
  const grille = new CircleGeometry(portR + 0.004, 64)
  grille.rotateY(-Math.PI / 2) // face -X, towards the ear
  grille.translate(0.016, 0, 0)

  // ── Driver ───────────────────────────────────────────────────────────────
  // Profiles are (radius, axial) with the axial direction pointing into the cup.
  const dome = lathe(
    [
      [0.0, -0.017],
      [0.03, -0.0155],
      [0.06, -0.0118],
      [0.085, -0.0062],
      [0.1, 0.0005],
    ],
    64,
  )
  const cone = lathe(
    [
      [0.1, 0.0005],
      [0.13, 0.0032],
      [0.18, 0.0058],
      [0.232, 0.0074],
      [0.246, 0.0068],
      [0.254, 0.0012],
      [0.262, -0.0022],
      [0.27, 0.0012],
      [0.278, 0.0074],
    ],
    96,
  )
  const coil = cylinderX(0.101, 0.04, 48, true)
  coil.translate(0.022, 0, 0)

  const flange = lathe(
    [
      [0.272, 0.0],
      [0.298, 0.0],
      [0.298, 0.0],
      [0.298, 0.012],
      [0.298, 0.012],
      [0.272, 0.012],
      [0.272, 0.012],
      [0.272, 0.0],
    ],
    96,
  )
  // Basket spokes: a single box instanced six times around the axis.
  const spoke = new BoxGeometry(0.012, 0.16, 0.014)
  const topPlate = cylinderX(0.092, 0.012, 48)
  topPlate.translate(0.036, 0, 0)
  const magnet = cylinderX(0.122, 0.04, 48)
  magnet.translate(0.062, 0, 0)
  const pot = cylinderX(0.142, 0.032, 64)
  pot.translate(0.098, 0, 0)
  const vent = cylinderX(0.03, 0.002, 24)
  vent.translate(0.1145, 0, 0)

  // ── Electronics (right) and battery (left) ───────────────────────────────
  const boardShape = new Shape()
  {
    const w = 0.21
    const h = 0.26
    const r = 0.07
    boardShape.moveTo(-w + r, -h)
    boardShape.lineTo(w - r, -h)
    boardShape.quadraticCurveTo(w, -h, w, -h + r)
    boardShape.lineTo(w, h - r)
    boardShape.quadraticCurveTo(w, h, w - r, h)
    boardShape.lineTo(-w + r, h)
    boardShape.quadraticCurveTo(-w, h, -w, h - r)
    boardShape.lineTo(-w, -h + r)
    boardShape.quadraticCurveTo(-w, -h, -w + r, -h)
  }
  const board = new ExtrudeGeometry(boardShape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.002,
    bevelSegments: 1,
    curveSegments: 10,
  })
  // Shape lies in XY with depth along +Z; turn it to lie in the YZ plane.
  board.rotateY(Math.PI / 2)
  board.translate(0.205, 0, 0)

  const chip = new BoxGeometry(1, 1, 1)
  const micCapsule = cylinderX(0.026, 0.03, 32)
  const battery = new RoundedBoxGeometry(0.034, 0.46, 0.34, 3, 0.012)
  battery.translate(0.2, 0, 0)
  const batteryLabel = new BoxGeometry(0.0015, 0.2, 0.3)
  batteryLabel.translate(0.2 - 0.0175, -0.06, 0)
  const flex = new BoxGeometry(0.06, 0.004, 0.05)

  // ── Shell details ────────────────────────────────────────────────────────
  const button = new CapsuleGeometry(0.0125, 0.05, 6, 16)
  const roundButton = new CylinderGeometry(0.017, 0.017, 0.012, 32)
  const port = new RoundedBoxGeometry(0.03, 0.02, 0.07, 2, 0.008)
  const micHole = new CylinderGeometry(0.008, 0.008, 0.01, 16)
  const led = new SphereGeometry(0.0055, 16, 12)

  // ── Yoke ─────────────────────────────────────────────────────────────────
  // Fork that wraps the top of the cup and holds it at front and back pivots.
  const yokePath = samplePath((t, out) => {
    const theta = t * Math.PI
    const [y, z] = cupOutline(theta, 1)
    const [ny, nz] = cupOutlineNormal(theta)
    out.set(DIM.yokeLocalX, y + ny * DIM.yokeOffset, z + nz * DIM.yokeOffset)
  }, pathSeg / 2)
  const yoke = sweep(
    yokePath,
    new Vector3(-1, 0, 0),
    (t) => {
      // Slightly heavier at the crown where the swivel attaches.
      const swell = 1 + 0.25 * Math.pow(Math.sin(t * Math.PI), 4)
      return roundedRect(0.034 * swell, 0.064, 0.014, 4)
    },
    { capStart: true, capEnd: true },
  )
  const boss = new CylinderGeometry(0.04, 0.04, 0.03, 40)
  boss.rotateX(Math.PI / 2)
  const pin = new CylinderGeometry(0.014, 0.014, 0.075, 24)
  pin.rotateX(Math.PI / 2)
  const pinCap = new CylinderGeometry(0.022, 0.022, 0.006, 32)
  pinCap.rotateX(Math.PI / 2)
  const swivel = new CylinderGeometry(0.032, 0.036, 0.06, 40)

  // ── Headband ─────────────────────────────────────────────────────────────
  const { rx, yBase, ry, m } = DIM.band
  const bandPoint = (alpha: number, out: Vector3) =>
    out.set(rx * sgnPow(Math.cos(alpha), 2 / m), yBase + ry * sgnPow(Math.sin(alpha), 2 / m), 0)

  const bandPath = samplePath((t, out) => bandPoint(t * Math.PI, out), pathSeg)
  const bandWidth = (t: number) => {
    // Widest at the crown, tapering into the slider housings.
    const k = Math.sin(t * Math.PI)
    return 0.08 + 0.088 * Math.pow(k, 1.6)
  }
  const band = sweep(bandPath, new Vector3(0, 0, 1), (t) => roundedRect(0.04, bandWidth(t), 0.017, 5), {
    capStart: true,
    capEnd: true,
  })

  const sub = (a0: number, a1: number, count: number) =>
    samplePath((t, out) => bandPoint((a0 + (a1 - a0) * t) * Math.PI, out), count)

  const spine = sweep(
    sub(0.1, 0.9, pathSeg),
    new Vector3(0, 0, 1),
    (t) => {
      const fade = Math.min(1, Math.sin(t * Math.PI) * 6)
      return roundedRect(0.008, 0.028 * fade + 0.004, 0.003, 3).map(([u, v]) => [u + 0.0215, v] as [number, number])
    },
    { capStart: true, capEnd: true },
  )

  const pad = sweep(
    sub(0.21, 0.79, pathSeg),
    new Vector3(0, 0, 1),
    (t) => {
      const k = Math.min(1, Math.sin(t * Math.PI) * 4)
      return superProfile(0.026 * (0.55 + 0.45 * k), 0.06, 3.2, ring + 4, -0.046)
    },
    { capStart: true, capEnd: true },
  )
  const padStrap = new RoundedBoxGeometry(0.03, 0.05, 0.1, 2, 0.008)

  const housing = new RoundedBoxGeometry(0.06, 0.16, 0.09, 4, 0.022)
  const housingTrim = new BoxGeometry(0.062, 0.006, 0.092)
  const rod = new CylinderGeometry(0.0105, 0.0105, 0.26, 20)

  // Precomputed anchor points along the band (used for straps and labels).
  const at = (alpha: number) => {
    const v = new Vector3()
    bandPoint(alpha * Math.PI, v)
    return v
  }
  const bandTangent = (alpha: number) => at(alpha + 0.001).sub(at(alpha - 0.001)).normalize()

  return {
    shell,
    cap,
    accentRing,
    screw,
    cushion,
    piping,
    cushionMount,
    scrim,
    baffle,
    grille,
    dome,
    cone,
    coil,
    flange,
    spoke,
    topPlate,
    magnet,
    pot,
    vent,
    board,
    chip,
    micCapsule,
    battery,
    batteryLabel,
    flex,
    button,
    roundButton,
    port,
    micHole,
    led,
    yoke,
    boss,
    pin,
    pinCap,
    swivel,
    band,
    spine,
    pad,
    padStrap,
    housing,
    housingTrim,
    rod,
    bandAt: at,
    bandTangent,
  }
}

export type HeadphoneGeometry = ReturnType<typeof createHeadphoneGeometry>

export function disposeHeadphoneGeometry(g: HeadphoneGeometry) {
  Object.values(g).forEach((v) => {
    if (v instanceof BufferGeometry) v.dispose()
  })
}
