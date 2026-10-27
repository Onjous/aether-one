'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { pose } from '@/animation/director'
import { ANNOTATIONS, type AnnotationId } from '@/content/copy'
import { annotationAnchors, annotationElements } from './annotations'

const FORM_IDS = new Set<AnnotationId>(ANNOTATIONS.form.map((a) => a.id))
const v = new Vector3()
/** Authored side of each label, read once from the DOM. */
const preferredSide = new WeakMap<HTMLElement, string>()
const reachCache = new WeakMap<HTMLElement, number>()
/** Room a label needs beside its anchor (leader + gap + text), measured once. */
const labelReach = (el: HTMLElement) => {
  let r = reachCache.get(el)
  if (r === undefined) {
    const w = el.querySelector<HTMLElement>('.annotation__text')?.offsetWidth ?? 0
    r = w + 90
    if (w > 0) reachCache.set(el, r)
  }
  return r
}

/**
 * Projects each registered 3D anchor to screen space and moves its DOM label
 * there. It is mounted after the camera rig so it runs after the camera has
 * moved this frame, and writes only `transform`, `opacity` and `visibility`,
 * which never trigger layout.
 */
export function AnnotationProjector() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useFrame(() => {
    if (annotationElements.size === 0) return
    // The rig moved the camera this frame; refresh its inverse matrix now
    // rather than waiting for the renderer, so labels never lag a frame.
    camera.updateMatrixWorld()
    annotationElements.forEach((el, id) => {
      const anchor = annotationAnchors.get(id)
      const weight = FORM_IDS.has(id) ? pose.labelsForm : pose.labelsExplode
      if (!anchor || weight < 0.01) {
        if (el.style.visibility !== 'hidden') el.style.visibility = 'hidden'
        return
      }
      anchor.getWorldPosition(v)
      v.project(camera)
      if (v.z > 1) {
        el.style.visibility = 'hidden'
        return
      }
      const x = (v.x * 0.5 + 0.5) * size.width
      const y = (-v.y * 0.5 + 0.5) * size.height
      // Flip to the other side if the authored side would leave the viewport.
      if (!preferredSide.has(el)) preferredSide.set(el, el.dataset.side ?? 'right')
      const want = preferredSide.get(el)
      const reach = labelReach(el)
      let side = want
      if (want === 'right' && x + reach > size.width) side = 'left'
      else if (want === 'left' && x - reach < 0) side = 'right'
      if (el.dataset.side !== side) el.dataset.side = side
      el.style.visibility = 'visible'
      el.style.opacity = weight.toFixed(3)
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
      el.style.setProperty('--reveal', weight.toFixed(3))
    })
  })

  return null
}
