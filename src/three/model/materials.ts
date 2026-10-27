import gsap from 'gsap'
import {
  Color,
  DoubleSide,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  type Material,
} from 'three'
import { FINISHES, type FinishId, type SurfaceSpec } from '@/config/finishes'
import type { HeadphoneTextures } from './textures'

/**
 * Material library for AETHER ONE.
 *
 * Finish-dependent materials (shell, frame, caps, cushions, accent) are
 * physically based and switched by tweening their actual parameters, so the
 * transition is a genuine material blend rendered by the GPU.
 */

export function createMaterials(tex: HeadphoneTextures, finishId: FinishId) {
  const f = FINISHES[finishId]

  const surface = (spec: SurfaceSpec) =>
    new MeshPhysicalMaterial({
      color: spec.color,
      metalness: spec.metalness,
      roughness: spec.roughness,
      clearcoat: spec.clearcoat,
      clearcoatRoughness: spec.clearcoatRoughness,
    })

  const shell = surface(f.shell)
  const frame = surface(f.frame)
  const cap = (roughness: typeof tex.capRoughnessL, mark: typeof tex.capMarkL) => {
    const m = surface(f.cap)
    m.roughnessMap = roughness
    m.emissive.set('#c4cbd3')
    m.emissiveMap = mark
    m.emissiveIntensity = 0.16
    return m
  }
  const capR = cap(tex.capRoughnessR, tex.capMarkR)
  const capL = cap(tex.capRoughnessL, tex.capMarkL)

  const leather = new MeshPhysicalMaterial({
    color: f.cushion.color,
    roughness: f.cushion.roughness,
    metalness: 0,
    sheen: 0.6,
    sheenRoughness: 0.7,
    sheenColor: new Color(f.cushion.sheenColor),
    clearcoat: 0.08,
    clearcoatRoughness: 0.6,
  })

  const accent = new MeshStandardMaterial({
    color: f.accent.color,
    emissive: f.accent.emissive,
    emissiveIntensity: f.accent.emissiveIntensity,
    metalness: 0.6,
    roughness: 0.25,
  })

  const materials = {
    shell,
    frame,
    capR,
    capL,
    leather,
    accent,
    mount: new MeshStandardMaterial({ color: '#0f1013', roughness: 0.55, metalness: 0.1 }),
    scrimR: new MeshStandardMaterial({ map: tex.scrimR, roughness: 0.92, metalness: 0 }),
    scrimL: new MeshStandardMaterial({ map: tex.scrimL, roughness: 0.92, metalness: 0 }),
    baffle: new MeshStandardMaterial({ color: '#121317', roughness: 0.5, metalness: 0.35 }),
    grille: new MeshStandardMaterial({
      color: '#3a3e45',
      roughness: 0.32,
      metalness: 1,
      alphaMap: tex.grilleAlpha,
      alphaTest: 0.5,
      side: DoubleSide,
    }),
    dome: new MeshPhysicalMaterial({
      color: '#cfd5dc',
      metalness: 1,
      roughness: 0.16,
      side: DoubleSide,
    }),
    cone: new MeshPhysicalMaterial({
      color: '#17191d',
      metalness: 0.35,
      roughness: 0.3,
      clearcoat: 0.6,
      clearcoatRoughness: 0.2,
      iridescence: 0.85,
      iridescenceIOR: 1.45,
      iridescenceThicknessRange: [220, 560],
      side: DoubleSide,
    }),
    copper: new MeshStandardMaterial({ color: '#b5683a', metalness: 1, roughness: 0.3, side: DoubleSide }),
    darkMetal: new MeshStandardMaterial({ color: '#33363c', metalness: 1, roughness: 0.36, side: DoubleSide }),
    chrome: new MeshStandardMaterial({ color: '#d9dee4', metalness: 1, roughness: 0.1 }),
    magnet: new MeshStandardMaterial({ color: '#3c4047', metalness: 0.7, roughness: 0.4 }),
    board: new MeshStandardMaterial({ map: tex.board, metalness: 0.25, roughness: 0.48 }),
    chip: new MeshStandardMaterial({ color: '#111215', metalness: 0.4, roughness: 0.32 }),
    battery: new MeshStandardMaterial({ color: '#b1b8c0', metalness: 0.9, roughness: 0.4 }),
    label: new MeshStandardMaterial({ color: '#1a1c20', metalness: 0.1, roughness: 0.65 }),
    port: new MeshStandardMaterial({ color: '#050506', metalness: 0.2, roughness: 0.3 }),
    hole: new MeshStandardMaterial({ color: '#020203', metalness: 0, roughness: 1 }),
  }
  return materials
}

export type HeadphoneMaterials = ReturnType<typeof createMaterials>

function tweenSurface(m: MeshPhysicalMaterial, spec: SurfaceSpec, duration: number) {
  const c = new Color(spec.color)
  gsap.to(m.color, { r: c.r, g: c.g, b: c.b, duration, ease: 'power2.inOut', overwrite: true })
  gsap.to(m, {
    metalness: spec.metalness,
    roughness: spec.roughness,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: spec.clearcoatRoughness,
    duration,
    ease: 'power2.inOut',
    overwrite: true,
  })
}

/** Tweens every finish-dependent material to the given finish. */
export function applyFinish(m: HeadphoneMaterials, finishId: FinishId, duration = 1.1) {
  const f = FINISHES[finishId]
  tweenSurface(m.shell, f.shell, duration)
  tweenSurface(m.frame, f.frame, duration)
  tweenSurface(m.capR, f.cap, duration)
  tweenSurface(m.capL, f.cap, duration)

  const cushion = new Color(f.cushion.color)
  const sheen = new Color(f.cushion.sheenColor)
  gsap.to(m.leather.color, { r: cushion.r, g: cushion.g, b: cushion.b, duration, overwrite: true })
  gsap.to(m.leather.sheenColor, { r: sheen.r, g: sheen.g, b: sheen.b, duration, overwrite: true })
  gsap.to(m.leather, { roughness: f.cushion.roughness, duration, overwrite: true })

  const ac = new Color(f.accent.color)
  const ae = new Color(f.accent.emissive)
  gsap.to(m.accent.color, { r: ac.r, g: ac.g, b: ac.b, duration, overwrite: true })
  gsap.to(m.accent.emissive, { r: ae.r, g: ae.g, b: ae.b, duration, overwrite: true })
}

export function disposeMaterials(m: HeadphoneMaterials) {
  Object.values(m).forEach((mat: Material) => {
    gsap.killTweensOf(mat)
    mat.dispose()
  })
}
