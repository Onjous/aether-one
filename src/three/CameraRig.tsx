'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type ReactNode } from 'react'
import { Group, InstancedMesh, MathUtils, Mesh, PerspectiveCamera, Vector3 } from 'three'
import { pose, runtime } from '@/animation/director'
import { clamp } from '@/lib/math'

/** Aspect ratio each layout's shots were composed for. */
const REFERENCE_ASPECT = { desktop: 1.7, mobile: 0.46 } as const

/**
 * Assembled product extent (world units) used to fit it into the finale slot.
 * Width includes headroom for the gentle idle sway.
 */
const PRODUCT_SIZE = { h: 2.2, w: 2.35 }

const camPos = new Vector3()
const camTgt = new Vector3()
const slotPos = new Vector3()
const slotTgt = new Vector3()
const viewDir = new Vector3()
const panRight = new Vector3()
const panUp = new Vector3()
const WORLD_UP = new Vector3(0, 1, 0)

/**
 * Applies the director's pose to the camera and the product.
 *
 * Rotation is layered: the inner group carries the choreographed pose from the
 * scroll timeline; the outer group adds the ambient layers on top — idle sway,
 * pointer parallax and user rotation — each weighted by the current chapter,
 * so they can never fight the choreography.
 */
export function CameraRig({ children }: { children: ReactNode }) {
  const camera = useThree((s) => s.camera)
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)

  useFrame((state) => {
    const p = pose
    const r = runtime
    r.aspect = state.size.width / Math.max(1, state.size.height)
    const intro = r.intro
    const t = r.elapsed

    // Keep the composition when the viewport differs from the one the shot was
    // designed for, by dollying along the camera's line of sight. On narrow
    // layouts short screens also pull back, since text takes more of them.
    const aspectFit = REFERENCE_ASPECT[r.layout] / r.aspect
    const mobile = r.layout === 'mobile'
    const fit = mobile
      ? clamp(aspectFit, 1, 1.6) * clamp(780 / state.size.height, 1, 1.3)
      : clamp(aspectFit, 0.9, 1.6)
    // Narrower desktop screens push side-composed shots further off-centre so
    // the product keeps clear of the text column.
    const shift = mobile ? 1 : 1 + 0.6 * clamp(aspectFit - 1, 0, 0.5)
    const introDolly = 1 + (1 - intro) * 0.55
    camTgt.set(p.tgtX * shift, p.tgtY, p.tgtZ)
    camPos.set(p.camX * shift, p.camY, p.camZ).sub(camTgt).multiplyScalar(fit * introDolly).add(camTgt)

    const vw = state.size.width
    const vh = state.size.height
    const tanHalfFov = Math.tan(MathUtils.degToRad((camera as PerspectiveCamera).fov) / 2)

    // Finale: hand over to a framing fitted to the finale's layout slot, so the
    // product rests in the space the layout reserves for it on every screen.
    const slot = r.finaleSlot
    if (slot && p.slot > 0) {
      // Distance at which the product fills the slot (whichever axis is tighter).
      const dist = Math.max(
        (PRODUCT_SIZE.h * vh) / (2 * tanHalfFov * slot.h),
        (PRODUCT_SIZE.w * vh) / (2 * tanHalfFov * slot.w),
      )
      const worldPerPx = (2 * dist * tanHalfFov) / vh
      // Aim so the product's centre lands on the slot's centre; `slotDrop`
      // lifts it above the slot while it settles.
      slotTgt.set(-(slot.cx - vw / 2) * worldPerPx, (slot.cy - vh / 2) * worldPerPx - p.slotDrop, 0)
      // Keep the authored viewing angle; only distance and aim come from the slot.
      viewDir.copy(camPos).sub(camTgt).normalize()
      slotPos.copy(slotTgt).addScaledVector(viewDir, dist)
      camPos.lerp(slotPos, p.slot)
      camTgt.lerp(slotTgt, p.slot)
    }

    // Past the end of the story the page keeps scrolling towards the footer.
    // Pan by exactly that many pixels (measured at the product's depth) so the
    // product leaves with the finale section and never sits over the footer.
    // The pan runs along the camera's own up axis: the finale camera looks
    // slightly upward, and moving along world Y would also push it along its
    // line of sight, making the product lag the page.
    if (r.tail > 0) {
      const dist = camPos.distanceTo(camTgt)
      const shift = (r.tail * 2 * dist * tanHalfFov) / vh
      viewDir.copy(camTgt).sub(camPos).normalize()
      panRight.crossVectors(viewDir, WORLD_UP).normalize()
      panUp.crossVectors(panRight, viewDir)
      camPos.addScaledVector(panUp, -shift)
      camTgt.addScaledVector(panUp, -shift)
    }

    camera.position.copy(camPos)
    camera.lookAt(camTgt)
    camera.userData.viewH = vh

    const o = outer.current
    const i = inner.current
    if (!o || !i) return

    i.rotation.set(p.rotX, p.rotY - (1 - intro) * 1.25, p.rotZ)
    i.position.set(p.posX, p.posY - (1 - intro) * 0.18, p.posZ)

    const idleYaw = p.idle * (0.26 * Math.sin(t * 0.29) + 0.05 * Math.sin(t * 0.73))
    const idleBob = p.idle * 0.025 * Math.sin(t * 0.8)
    o.rotation.y = idleYaw + r.pointerX * 0.24 * p.pointer + r.userYaw * p.interact
    o.rotation.x = -r.pointerY * 0.1 * p.pointer + r.userPitch * p.interact
    o.position.y = idleBob
  })

  // QA only (`?qa`): the product's exact on-screen bounds in CSS px, from its
  // projected vertices (effect planes excluded), for automated overlap checks.
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('qa')) return
    const w = window as unknown as { __aetherProductRect?: () => object }
    const v = new Vector3()
    w.__aetherProductRect = () => {
      const root = inner.current
      if (!root) return {}
      root.updateWorldMatrix(true, true)
      camera.updateMatrixWorld()
      const viewH = camera.userData.viewH as number
      let top = Infinity
      let bottom = -Infinity
      let left = Infinity
      let right = -Infinity
      root.traverseVisible((o) => {
        const m = o as Mesh
        // Instanced parts are tiny and their base geometry is unscaled; skip them.
        if (!m.isMesh || (m as InstancedMesh).isInstancedMesh) return
        if ((m.material as { type?: string }).type === 'ShaderMaterial') return
        const pos = m.geometry.getAttribute('position')
        for (let i = 0; i < pos.count; i++) {
          v.fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld).project(camera)
          const x = (v.x * 0.5 + 0.5) * window.innerWidth
          const y = (-v.y * 0.5 + 0.5) * viewH
          if (y < top) top = y
          if (y > bottom) bottom = y
          if (x < left) left = x
          if (x > right) right = x
        }
      })
      return { top: Math.round(top), bottom: Math.round(bottom), left: Math.round(left), right: Math.round(right) }
    }
    return () => {
      delete w.__aetherProductRect
    }
  }, [camera])

  return (
    <group ref={outer}>
      <group ref={inner}>{children}</group>
    </group>
  )
}
