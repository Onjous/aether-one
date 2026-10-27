'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef, type RefObject } from 'react'
import { Group, Matrix4, Object3D, Quaternion, Vector3 } from 'three'
import { pose, runtime } from '@/animation/director'
import { FINISHES } from '@/config/finishes'
import type { AnnotationId } from '@/content/copy'
import { appState } from '@/lib/appState'
import { annotationAnchors } from '../annotations'
import {
  createHeadphoneGeometry,
  cupOutline,
  cupOutlineNormal,
  DIM,
  disposeHeadphoneGeometry,
  EXPLODE,
  YOKE_X,
  type HeadphoneGeometry,
  type Quality,
} from '../geometry/headphoneGeometry'
import { applyFinish, createMaterials, disposeMaterials, type HeadphoneMaterials } from './materials'
import { StaticInstances } from './StaticInstances'
import { createTextures } from './textures'
import { SoundRings } from '../effects/SoundRings'

interface Props {
  quality: Quality
  shadows: boolean
  onReady?: () => void
}

function measure<T>(name: string, fn: () => T): T {
  const start = performance.now()
  const value = fn()
  performance.measure(name, { start, end: performance.now() })
  return value
}

/** Moving parts of one ear-cup assembly, updated every frame. */
interface SideRefs {
  cup: RefObject<Group | null>
  cap: RefObject<Group | null>
  ring: RefObject<Group | null>
  pcb: RefObject<Group | null>
  motor: RefObject<Group | null>
  diaphragm: RefObject<Group | null>
  baffle: RefObject<Group | null>
  cushion: RefObject<Group | null>
  pinFront: RefObject<Group | null>
  pinBack: RefObject<Group | null>
}

const useSideRefs = (): SideRefs => ({
  cup: useRef<Group>(null),
  cap: useRef<Group>(null),
  ring: useRef<Group>(null),
  pcb: useRef<Group>(null),
  motor: useRef<Group>(null),
  diaphragm: useRef<Group>(null),
  baffle: useRef<Group>(null),
  cushion: useRef<Group>(null),
  pinFront: useRef<Group>(null),
  pinBack: useRef<Group>(null),
})

/** An invisible point on the model that a DOM annotation follows. */
function Anchor({ id, position }: { id: AnnotationId; position: [number, number, number] }) {
  const ref = useRef<Object3D>(null)
  useEffect(() => {
    const o = ref.current
    if (!o) return
    annotationAnchors.set(id, o)
    return () => {
      if (annotationAnchors.get(id) === o) annotationAnchors.delete(id)
    }
  }, [id])
  return <object3D ref={ref} position={position} />
}

/** Matrix for a part sitting on the cup's outer surface, Z aligned to the surface normal. */
function onShell(theta: number, x: number, s: number, lift: number, scale = 1) {
  const [y, z] = cupOutline(theta, s)
  const [ny, nz] = cupOutlineNormal(theta)
  const xAxis = new Vector3(1, 0, 0)
  const zAxis = new Vector3(0, ny, nz)
  const yAxis = new Vector3(0, nz, -ny)
  const m = new Matrix4().makeBasis(xAxis, yAxis, zAxis)
  m.scale(new Vector3(scale, scale, scale))
  m.setPosition(x, y + ny * lift, z + nz * lift)
  return m
}

function spokeMatrices() {
  const list: Matrix4[] = []
  const from = new Vector3(0.012, 0.282, 0)
  const to = new Vector3(0.09, 0.138, 0)
  const dirLocal = to.clone().sub(from).normalize()
  const up = new Vector3(0, 1, 0)
  for (let k = 0; k < 6; k++) {
    const phi = (k / 6) * Math.PI * 2 + Math.PI / 6
    const radial = new Vector3(0, Math.sin(phi), Math.cos(phi))
    const dir = new Vector3(dirLocal.x, 0, 0).addScaledVector(radial, dirLocal.y).normalize()
    const center = new Vector3((from.x + to.x) / 2, 0, 0).addScaledVector(radial, (from.y + to.y) / 2)
    const q = new Quaternion().setFromUnitVectors(up, dir)
    list.push(new Matrix4().compose(center, q, new Vector3(1, 1, 1)))
  }
  return list
}

/** Surface-mount components on the electronics board, as [y, z, height, depth, width]. */
const CHIPS: [number, number, number, number, number][] = [
  [0.05, 0.0, 0.012, 0.11, 0.11],
  [-0.1, 0.08, 0.01, 0.06, 0.08],
  [-0.12, -0.07, 0.008, 0.07, 0.05],
  [0.17, -0.08, 0.008, 0.05, 0.05],
  [0.17, 0.09, 0.008, 0.04, 0.06],
  [-0.02, -0.14, 0.006, 0.03, 0.06],
  [0.06, 0.15, 0.006, 0.05, 0.03],
  [-0.21, 0.0, 0.01, 0.035, 0.14],
]

function chipMatrices() {
  return CHIPS.map(([y, z, h, d, w]) =>
    new Matrix4().compose(new Vector3(0.203 - h / 2, y, z), new Quaternion(), new Vector3(h, d, w)),
  )
}

function screwMatrices() {
  return [0, 1, 2, 3].map((k) => {
    const [y, z] = cupOutline(Math.PI / 4 + (k * Math.PI) / 2, 0.64)
    return new Matrix4().makeTranslation(0, y, z)
  })
}

function EarSide({
  side,
  geo,
  mat,
  refs,
  shadows,
}: {
  side: 1 | -1
  geo: HeadphoneGeometry
  mat: HeadphoneMaterials
  refs: SideRefs
  shadows: boolean
}) {
  const right = side === 1
  const spokes = useMemo(() => spokeMatrices(), [])
  const chips = useMemo(() => chipMatrices(), [])
  const screws = useMemo(() => screwMatrices(), [])
  const micHoles = useMemo(
    () =>
      [0.5, 0.66, 0.82].map((t) => {
        const m = onShell(t, 0.2, 0.975, -0.003)
        // Cylinder axis is Y; rotate so it points along the surface normal.
        return m.multiply(new Matrix4().makeRotationX(Math.PI / 2))
      }),
    [],
  )
  const S = { castShadow: shadows, receiveShadow: shadows }

  const yokeAnchor = useMemo(() => {
    const t = Math.PI * 0.3
    const [y, z] = cupOutline(t, 1)
    const [ny, nz] = cupOutlineNormal(t)
    return [DIM.yokeLocalX, y + ny * (DIM.yokeOffset + 0.03), z + nz * (DIM.yokeOffset + 0.03)] as [
      number,
      number,
      number,
    ]
  }, [])

  return (
    <group scale={[side, 1, 1]}>
      {/* Yoke: part of the frame; the cup slides out of it when exploded. */}
      <group position={[DIM.cupX, DIM.cupY, 0]}>
        <mesh geometry={geo.yoke} material={mat.frame} {...S} />
        <mesh
          geometry={geo.swivel}
          material={mat.frame}
          position={[DIM.yokeLocalX, DIM.cup.b + DIM.yokeOffset + 0.045, 0]}
          {...S}
        />
        {[1, -1].map((dir) => (
          <mesh
            key={dir}
            geometry={geo.boss}
            material={mat.frame}
            position={[DIM.yokeLocalX, 0, dir * (DIM.cup.a + DIM.yokeOffset)]}
            {...S}
          />
        ))}
        <group ref={refs.pinFront}>
          <mesh geometry={geo.pin} material={mat.chrome} position={[DIM.yokeLocalX, 0, DIM.cup.a + 0.03]} />
          <mesh geometry={geo.pinCap} material={mat.chrome} position={[DIM.yokeLocalX, 0, DIM.cup.a + DIM.yokeOffset + 0.018]} />
        </group>
        <group ref={refs.pinBack}>
          <mesh geometry={geo.pin} material={mat.chrome} position={[DIM.yokeLocalX, 0, -(DIM.cup.a + 0.03)]} />
          <mesh
            geometry={geo.pinCap}
            material={mat.chrome}
            position={[DIM.yokeLocalX, 0, -(DIM.cup.a + DIM.yokeOffset + 0.018)]}
          />
        </group>
        {right && <Anchor id="yoke" position={yokeAnchor} />}
      </group>

      {/* Ear cup assembly. Local origin = rim plane, +X away from the head. */}
      <group ref={refs.cup} position={[DIM.cupX, DIM.cupY, 0]}>
        <mesh geometry={geo.shell} material={mat.shell} {...S} />
        <StaticInstances geometry={geo.screw} material={mat.chrome} matrices={screws} />
        <StaticInstances geometry={geo.micHole} material={mat.hole} matrices={micHoles} />

        {right && (
          <>
            <mesh geometry={geo.button} material={mat.frame} matrixAutoUpdate={false} matrix={onShell(Math.PI + 0.42, 0.15, 1, 0.004)} />
            <mesh
              geometry={geo.roundButton}
              material={mat.frame}
              matrixAutoUpdate={false}
              matrix={onShell(Math.PI + 0.78, 0.15, 1, 0.002).multiply(new Matrix4().makeRotationX(Math.PI / 2))}
            />
            <mesh geometry={geo.led} material={mat.accent} matrixAutoUpdate={false} matrix={onShell(Math.PI + 0.98, 0.15, 1, 0)} />
            <mesh geometry={geo.port} material={mat.port} position={[0.16, -DIM.cup.b + 0.006, 0]} />
          </>
        )}

        <group ref={refs.ring}>
          <mesh geometry={geo.accentRing} material={mat.accent} />
        </group>
        <group ref={refs.cap}>
          <mesh geometry={geo.cap} material={right ? mat.capR : mat.capL} {...S} />
        </group>

        {/* Electronics board (right) or battery (left). */}
        <group ref={refs.pcb}>
          {right ? (
            <>
              <mesh geometry={geo.board} material={mat.board} />
              <StaticInstances geometry={geo.chip} material={mat.chip} matrices={chips} />
              {[0.12, -0.12].map((z) => (
                <mesh key={z} geometry={geo.micCapsule} material={mat.chrome} position={[0.19, -0.19, z]} />
              ))}
              <mesh geometry={geo.flex} material={mat.copper} position={[0.17, 0.27, 0]} />
              <Anchor id="anc" position={[0.175, -0.19, 0.12]} />
            </>
          ) : (
            <>
              <mesh geometry={geo.battery} material={mat.battery} />
              <mesh geometry={geo.batteryLabel} material={mat.label} />
              <mesh geometry={geo.flex} material={mat.copper} position={[0.17, 0.25, 0]} />
            </>
          )}
        </group>

        {/* Driver motor: basket, spokes, magnet stack. */}
        <group ref={refs.motor}>
          <group position={[0.04, 0, 0]}>
            <mesh geometry={geo.flange} material={mat.darkMetal} />
            <StaticInstances geometry={geo.spoke} material={mat.darkMetal} matrices={spokes} />
            <mesh geometry={geo.topPlate} material={mat.chrome} />
            <mesh geometry={geo.magnet} material={mat.magnet} />
            <mesh geometry={geo.pot} material={mat.chrome} />
            <mesh geometry={geo.vent} material={mat.hole} />
          </group>
        </group>

        {/* Moving assembly: dome, cone/surround and voice coil. */}
        <group ref={refs.diaphragm}>
          <group position={[0.04, 0, 0]}>
            <mesh geometry={geo.dome} material={mat.dome} />
            <mesh geometry={geo.cone} material={mat.cone} />
            <mesh geometry={geo.coil} material={mat.copper} />
            {right && <Anchor id="driver" position={[-0.02, 0.0, 0.0]} />}
          </group>
        </group>

        <group ref={refs.baffle}>
          <mesh geometry={geo.baffle} material={mat.baffle} />
          <mesh geometry={geo.grille} material={mat.grille} />
        </group>

        <group ref={refs.cushion}>
          <mesh geometry={geo.cushion} material={mat.leather} {...S} />
          <mesh geometry={geo.piping} material={mat.leather} />
          <mesh geometry={geo.cushionMount} material={mat.mount} />
          <mesh geometry={geo.scrim} material={right ? mat.scrimR : mat.scrimL} />
          {right ? (
            <Anchor id="foam" position={[-0.09, DIM.cup.b * 0.92, 0.0]} />
          ) : (
            <Anchor id="cushion" position={[-0.16, DIM.cup.b * 0.42, DIM.cup.a * 0.35]} />
          )}
        </group>

        <SoundRings />
      </group>
    </group>
  )
}

function Frame({
  geo,
  mat,
  shadows,
  frameRef,
}: {
  geo: HeadphoneGeometry
  mat: HeadphoneMaterials
  shadows: boolean
  frameRef: RefObject<Group | null>
}) {
  const S = { castShadow: shadows, receiveShadow: shadows }
  const straps = useMemo(
    () =>
      [0.215, 0.785].map((alpha) => {
        const p = geo.bandAt(alpha)
        const t = geo.bandTangent(alpha)
        const n = new Vector3(t.y, -t.x, 0)
        return { position: p.addScaledVector(n, 0.034).toArray() as [number, number, number], rot: Math.atan2(t.y, t.x) }
      }),
    [geo],
  )
  const bandTop = useMemo(() => geo.bandAt(0.5).add(new Vector3(0, 0.03, 0)).toArray() as [number, number, number], [geo])
  const spineAnchor = useMemo(() => geo.bandAt(0.3).add(new Vector3(0.02, 0.03, 0)).toArray() as [number, number, number], [geo])

  return (
    <group ref={frameRef}>
      <mesh geometry={geo.band} material={mat.shell} {...S} />
      <mesh geometry={geo.spine} material={mat.frame} {...S} />
      <mesh geometry={geo.pad} material={mat.leather} {...S} />
      {straps.map((s, i) => (
        <mesh key={i} geometry={geo.padStrap} material={mat.mount} position={s.position} rotation={[0, 0, s.rot]} />
      ))}
      {[1, -1].map((side) => (
        <group key={side} position={[side * YOKE_X, 0, 0]}>
          <mesh geometry={geo.housing} material={mat.frame} position={[0, 0.47, 0]} {...S} />
          <mesh geometry={geo.housingTrim} material={mat.accent} position={[0, 0.392, 0]} />
          {[0.022, -0.022].map((z) => (
            <mesh key={z} geometry={geo.rod} material={mat.chrome} position={[0, 0.395, z]} />
          ))}
        </group>
      ))}
      <Anchor id="band" position={bandTop} />
      <Anchor id="frame" position={spineAnchor} />
    </group>
  )
}

export function Headphones({ quality, shadows, onReady }: Props) {
  // User Timing marks make the procedural build visible in performance traces.
  const geo = useMemo(() => measure('aether:geometry', () => createHeadphoneGeometry(quality)), [quality])
  const tex = useMemo(() => measure('aether:textures', () => createTextures(quality)), [quality])
  const mat = useMemo(() => createMaterials(tex, appState.get().finish), [tex])

  useEffect(
    () => () => {
      disposeHeadphoneGeometry(geo)
    },
    [geo],
  )
  useEffect(
    () => () => {
      Object.values(tex).forEach((t) => t.dispose())
    },
    [tex],
  )
  useEffect(
    () => () => {
      disposeMaterials(mat)
    },
    [mat],
  )

  // Real material transitions when the finish changes.
  const accentBase = useRef(FINISHES[appState.get().finish].accent.emissiveIntensity)
  useEffect(() => {
    let current = appState.get().finish
    return appState.subscribe(() => {
      const next = appState.get().finish
      if (next === current) return
      current = next
      accentBase.current = FINISHES[next].accent.emissiveIntensity
      applyFinish(mat, next, runtime.reducedMotion ? 0.01 : 1.1)
    })
  }, [mat])

  useLayoutEffect(() => {
    onReady?.()
  }, [onReady])

  const frame = useRef<Group>(null)
  const R = useSideRefs()
  const L = useSideRefs()

  useFrame(() => {
    const p = pose
    if (frame.current) frame.current.position.y = EXPLODE.frameLift * p.explodeFrame

    for (const s of [R, L]) {
      const cup = s.cup.current
      if (!cup) continue
      cup.position.x = DIM.cupX + EXPLODE.cupsOut * p.explodeCups
      s.pinFront.current!.position.z = EXPLODE.pinsOut * p.explodeCups
      s.pinBack.current!.position.z = -EXPLODE.pinsOut * p.explodeCups
      s.cap.current!.position.x = EXPLODE.cap * p.explodeCap
      s.ring.current!.position.x = EXPLODE.accentRing * p.explodeCap
      s.pcb.current!.position.x = EXPLODE.pcb * p.explodeCore
      s.motor.current!.position.x = EXPLODE.motor * p.explodeCore
      s.diaphragm.current!.position.x = EXPLODE.diaphragm * p.explodeCore
      s.baffle.current!.position.x = EXPLODE.baffle * p.explodeCushion
      s.cushion.current!.position.x = EXPLODE.cushion * p.explodeCushion
    }

    // The hairline glows a little brighter with the sound field.
    const pulse = 0.5 + 0.5 * Math.sin(runtime.elapsed * 2.4)
    mat.accent.emissiveIntensity = accentBase.current * (1 + p.wave * (0.6 + 0.9 * pulse))
  })

  return (
    <group position={[0, DIM.centerY, 0]}>
      <Frame geo={geo} mat={mat} shadows={shadows} frameRef={frame} />
      <EarSide side={1} geo={geo} mat={mat} refs={R} shadows={shadows} />
      <EarSide side={-1} geo={geo} mat={mat} refs={L} shadows={shadows} />
    </group>
  )
}

